// Ce script transforme le GTFS en fichiers légers pour la carte SITP (réseau zonal).
// Il crée :
//  - public/data/sitp-stops.geojson : les arrêts (nom, et codes des services qui y passent) ;
//  - public/data/sitp-routes/<code>.json : un fichier par service, avec son tracé et ses arrêts.
//    La carte ne charge un de ces fichiers que lorsqu'on clique sur le service.
// À relancer quand le dossier gtfs/ change.
// Usage : node scripts/build-sitp-data.mjs

import fs from "node:fs";
import readline from "node:readline";

const gtfsFolder = "gtfs";
const stopsOutputFile = "public/data/sitp-stops.geojson";
const routesOutputFolder = "public/data/sitp-routes";

// --- Réglages (à modifier librement) ---
const zonalAgencyIds = ["3", "4", "5"]; // agency_id du GTFS : 3 = urbain, 4 = complémentaire, 5 = spécial
const excludedNamePattern = /ciclov/i; // les variantes "Ciclovía" (dimanche) sont ignorées pour l'instant
const coordinateDecimals = 5; // 5 décimales = environ 1 m de précision

// Arrondit une coordonnée pour alléger les fichiers (ex : -74.1182001 -> -74.1182).
function roundCoordinate(value) {
  return Number(value.toFixed(coordinateDecimals));
}

// Transforme "A  ||  B" en "A → B" : origine → destination, avec des espaces propres.
function formatRouteName(longName) {
  return longName
    .split("||")
    .map((part) => part.trim().replace(/\s+/g, " "))
    .join(" → ");
}

// Lit un fichier du GTFS ligne par ligne, sans tout charger en mémoire
// (stop_times.txt a 9 millions de lignes), et appelle handleRow pour chaque ligne.
// "columns" donne la position de chaque colonne par son nom : values[columns.stop_id]
// évite de compter les colonnes à la main.
async function readRows(fileName, handleRow) {
  const lines = readline.createInterface({
    input: fs.createReadStream(`${gtfsFolder}/${fileName}`)
  });
  let columns = null; // rempli avec la première ligne du fichier (l'en-tête)
  for await (const line of lines) {
    const values = line.trim().split(","); // trim retire un éventuel retour chariot de fin de ligne
    if (!columns) {
      // Le replace retire un éventuel caractère invisible (BOM) au tout début du fichier.
      columns = Object.fromEntries(
        values.map((name, position) => [name.replace(/^\uFEFF/, ""), position])
      );
      continue;
    }
    handleRow(values, columns);
  }
}

async function main() {
  // 1. Routes zonales retenues : route_id -> { code, name }
  const zonalRoutes = new Map();
  await readRows("routes.txt", (values, columns) => {
    if (!zonalAgencyIds.includes(values[columns.agency_id])) return;
    const longName = values[columns.route_long_name];
    if (excludedNamePattern.test(longName)) return;
    zonalRoutes.set(values[columns.route_id], {
      code: values[columns.route_short_name],
      name: formatRouteName(longName)
    });
  });

  // 2. Pour chaque route retenue : son tracé (shape_id), et le lien trajet -> route
  const shapeIdByRoute = new Map();
  const routeIdByTrip = new Map();
  await readRows("trips.txt", (values, columns) => {
    const routeId = values[columns.route_id];
    if (!zonalRoutes.has(routeId)) return;
    routeIdByTrip.set(values[columns.trip_id], routeId);
    shapeIdByRoute.set(routeId, values[columns.shape_id]);
  });

  // 3. Arrêts de chaque route, lus dans stop_times.txt (peut prendre une minute).
  // Un Set garde chaque arrêt une seule fois, même si 100 trajets y passent.
  const stopIdsByRoute = new Map(); // route_id -> Set de stop_id
  await readRows("stop_times.txt", (values, columns) => {
    const routeId = routeIdByTrip.get(values[columns.trip_id]);
    if (!routeId) return; // trajet qui n'est pas zonal : on l'ignore
    if (!stopIdsByRoute.has(routeId)) stopIdsByRoute.set(routeId, new Set());
    stopIdsByRoute.get(routeId).add(values[columns.stop_id]);
  });

  // 4. Un code peut avoir plusieurs variantes : on garde celle qui a le plus d'arrêts.
  const mainRouteByCode = new Map(); // code -> { routeId, name, stopCount }
  for (const [routeId, route] of zonalRoutes) {
    const stopCount = stopIdsByRoute.get(routeId)?.size ?? 0;
    const currentMain = mainRouteByCode.get(route.code);
    if (stopCount > 0 && (!currentMain || stopCount > currentMain.stopCount)) {
      mainRouteByCode.set(route.code, { routeId, name: route.name, stopCount });
    }
  }

  // 5. Tracés : on ne lit que ceux des routes retenues (shapes.txt est gros).
  // Hypothèse : les points sont déjà dans l'ordre dans le fichier (comme dans ton script troncal).
  const wantedShapeIds = new Set(
    [...mainRouteByCode.values()].map((route) => shapeIdByRoute.get(route.routeId))
  );
  const shapes = new Map(); // shape_id -> [[lon, lat], ...]
  await readRows("shapes.txt", (values, columns) => {
    const shapeId = values[columns.shape_id];
    if (!wantedShapeIds.has(shapeId)) return;
    if (!shapes.has(shapeId)) shapes.set(shapeId, []);
    shapes.get(shapeId).push([
      roundCoordinate(Number(values[columns.shape_pt_lon])),
      roundCoordinate(Number(values[columns.shape_pt_lat]))
    ]);
  });

  // 6. Nom et coordonnées des arrêts utilisés par les routes retenues.
  const usedStopIds = new Set();
  for (const { routeId } of mainRouteByCode.values()) {
    for (const stopId of stopIdsByRoute.get(routeId)) usedStopIds.add(stopId);
  }
  const stops = new Map(); // stop_id -> { name, lon, lat }
  await readRows("stops.txt", (values, columns) => {
    const stopId = values[columns.stop_id];
    if (!usedStopIds.has(stopId)) return;
    stops.set(stopId, {
      name: values[columns.stop_name],
      lon: roundCoordinate(Number(values[columns.stop_lon])),
      lat: roundCoordinate(Number(values[columns.stop_lat]))
    });
  });

  // 7. Écriture d'un fichier par service, en notant au passage les services de chaque arrêt.
  fs.mkdirSync(routesOutputFolder, { recursive: true });
  const servicesByStop = new Map(); // stop_id -> [codes des services]
  for (const [code, { routeId, name }] of mainRouteByCode) {
    const stopIds = [...stopIdsByRoute.get(routeId)];
    const routeData = {
      code,
      name, // "origine → destination" : indique le sens du service
      stopIds,
      geometry: {
        type: "LineString",
        coordinates: shapes.get(shapeIdByRoute.get(routeId)) ?? []
      }
    };
    fs.writeFileSync(`${routesOutputFolder}/${code}.json`, JSON.stringify(routeData));

    for (const stopId of stopIds) {
      if (!servicesByStop.has(stopId)) servicesByStop.set(stopId, []);
      servicesByStop.get(stopId).push(code);
    }
  }

  // 8. Fichier des arrêts : un point par arrêt, avec ses services sous forme "HH710,18-3".
  const features = [];
  for (const [stopId, services] of servicesByStop) {
    const stop = stops.get(stopId);
    if (!stop) continue; // arrêt absent de stops.txt : ignoré
    features.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: [stop.lon, stop.lat] },
      properties: { id: stopId, name: stop.name, services: services.join(",") }
    });
  }
  fs.writeFileSync(stopsOutputFile, JSON.stringify({ type: "FeatureCollection", features }));

  console.log(`${mainRouteByCode.size} services, ${features.length} arrêts.`);
}

main();