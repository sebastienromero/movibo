// Ce script analyse le GTFS et les services par station pour créer : public/data/routes-data.json.
// Il contient pour chaque ligne (H17) : sa géométrie et la liste des codes de stations (cod_nodo).
// Pour rester léger, il ne garde que les services présents dans servicios-por-estacion.json
// et arrondit les coordonnées.
// Usage : node scripts/build-routes-shapes.mjs

import fs from "node:fs";
import readline from "node:readline";

const gtfsFolder = "gtfs";
const outputFile = "public/data/routes-data.json";
const servicesByStationFile = "public/data/servicios-por-estacion.json";

// --- Réglages de l'allègement (à modifier librement) ---
const coordinateDecimals = 5; // décimales gardées pour chaque coordonnée (5 décimales = environ 1 m de précision)
const maxFileSizeMegabytes = 25; // limite de Cloudflare Pages : le script avertit si le fichier la dépasse

// Arrondit une coordonnée au nombre de décimales choisi (ex : -74.12108749 -> -74.12109).
function roundCoordinate(value) {
  return Number(value.toFixed(coordinateDecimals));
}

// Lit le fichier shapes.txt et retourne une Map : shape_id -> [[lon, lat], ...]
async function getShapes() {
  const shapes = new Map();
  const fileStream = fs.createReadStream(`${gtfsFolder}/shapes.txt`);
  const rl = readline.createInterface({ input: fileStream });

  let isFirstLine = true;
  for await (const line of rl) {
    if (isFirstLine) { isFirstLine = false; continue; }
    const [shape_id, lat, lon] = line.split(",");
    if (!shapes.has(shape_id)) shapes.set(shape_id, []);
    shapes.get(shape_id).push([roundCoordinate(parseFloat(lon)), roundCoordinate(parseFloat(lat))]);
  }
  return shapes;
}

async function main() {
  const shapes = await getShapes();
  
  // 1. Inverser services-por-estacion.json pour avoir Service -> [StationCodes]
  const servicesByStation = JSON.parse(fs.readFileSync(servicesByStationFile, "utf8"));
  const stationsByService = {};
  for (const [stationCode, services] of Object.entries(servicesByStation)) {
    for (const service of services) {
      if (!stationsByService[service]) stationsByService[service] = [];
      stationsByService[service].push(stationCode);
    }
  }

  // 2. Mapper route_id -> route_short_name (ex: 13545 -> "H17")
  const routeNames = new Map();
  const routesRaw = fs.readFileSync(`${gtfsFolder}/routes.txt`, "utf8").split("\n");
  routesRaw.slice(1).forEach(line => {
    const columns = line.split(",");
    if (columns.length > 4) {
      const route_id = columns[2];
      const short_name = columns[4];
      routeNames.set(route_id, short_name);
    }
  });

  // 3. Associer chaque service à son tracé et ses stations
  // On ignore les services absents de servicios-por-estacion.json (lignes zonales par exemple).
  const result = {};
  const tripsRaw = fs.readFileSync(`${gtfsFolder}/trips.txt`, "utf8").split("\n");
  tripsRaw.slice(1).forEach(line => {
    const columns = line.split(",");
    if (columns.length > 4) {
      const route_id = columns[0];
      const shape_id = columns[2];
      const serviceName = routeNames.get(route_id);

      if (serviceName && stationsByService[serviceName] && !result[serviceName]) {
        result[serviceName] = {
          stationCodes: stationsByService[serviceName] || [],
          geometry: {
            type: "LineString",
            coordinates: shapes.get(shape_id) || []
          }
        };
      }
    }
  });

  // JSON compact (sans indentation) : le fichier est beaucoup plus petit.
  fs.writeFileSync(outputFile, JSON.stringify(result));

  const fileSizeMegabytes = fs.statSync(outputFile).size / (1024 * 1024);
  console.log(
    `Fichier généré : ${outputFile} (${Object.keys(result).length} lignes, ${fileSizeMegabytes.toFixed(2)} Mo)`
  );
  if (fileSizeMegabytes > maxFileSizeMegabytes) {
    console.warn(
      `ATTENTION : ce fichier dépasse ${maxFileSizeMegabytes} Mo, Cloudflare Pages refusera de le publier.`
    );
  }
}

main();