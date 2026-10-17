// Ce fichier ajoute les couches de la carte TransMilenio : les lignes des troncales,
// les points et les noms des stations, et le popup au clic.
// Il intervient une seule fois, quand le fond de carte est chargé (appelé depuis main.js).

import maplibregl from "maplibre-gl";
import {
  troncalColors,
  defaultLineColor,
  troncalLetterByTrazadoId,
  closedStationCodes,
  closedStationFillColor,
  closedStationStrokeColor,
  closedStationLabelColor,
  isPortalExpression,
  stationLabelMinZoom,
  stationLabelTextSize,
  stationLabelOffset,
  stationLabelMaxWidth,
  stationLabelHaloWidth,
  stationLabelFont,
  stationLabelColor,
  stationRadiusMinZoom,
  stationRadiusMaxZoom,
  stationRadiusAtMinZoom,
  stationRadiusAtMaxZoom,
  portalRadiusFactor,
  dimmedLinesOpacity,
  dimmedStationStrokeColor,
  dimmedStationOpacity,
  dimmedStationLabelOpacity
} from "./config.js";
import { buildStationPopupHtml } from "./popup.js";

// variable globale au module pour gérer la popup active
let activePopup = null;

// Construit l'expression MapLibre qui associe chaque id_trazado à la couleur de sa troncale.
// Elle sert aux lignes ET aux stations, pour qu'elles aient les mêmes couleurs.
function buildTroncalColorExpression() {
  const expression = ["match", ["get", "id_trazado"]];
  for (const [trazadoId, letter] of Object.entries(troncalLetterByTrazadoId)) {
    expression.push(trazadoId, troncalColors[letter]);
  }
  expression.push(defaultLineColor); // valeur par défaut, obligatoire en dernier
  return expression;
}

// Construit l'expression MapLibre du rayon des points : il grandit avec le zoom,
// et un portail est plus grand qu'une station classique.
function buildStationRadiusExpression() {
  // Pour un rayon de station donné, renvoie le rayon d'un portail ou d'une station.
  const portalOrStationRadius = (stationRadius) => [
    "case",
    isPortalExpression,
    stationRadius * portalRadiusFactor,
    stationRadius
  ];

  return [
    "interpolate",
    ["linear"],
    ["zoom"],
    stationRadiusMinZoom, portalOrStationRadius(stationRadiusAtMinZoom),
    stationRadiusMaxZoom, portalOrStationRadius(stationRadiusAtMaxZoom)
  ];
}

// Ajoute les lignes des troncales sur la carte.
export function addTroncales(map) {
  // 1. Charger les tracés complets des lignes (pré-générés)
  let routesData = {};
  fetch("/data/routes-data.json")
    .then((response) => response.json())
    .then((data) => {
      routesData = data;
    });

  // 2. Préparer une source de données vide pour le tracé de la ligne en surbrillance
  map.addSource("route-highlight", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] }
  });

  // 3. Ajouter la couche pour dessiner la ligne sélectionnée
  map.addLayer({
    id: "route-highlight-line",
    type: "line",
    source: "route-highlight",
    layout: { "line-join": "round", "line-cap": "round" },
    paint: {
      "line-color": ["coalesce", ["get", "color"], "#ff0000"],
      "line-width": 6,
      "line-opacity": 0.9,
      "line-blur": 1
    }
  });

  // Variable pour suivre la popup ouverte
  let activePopup = null;

  // Fonction pour réinitialiser la vue
  const resetView = () => {
    map.setFilter("stations-points", null);
    map.setFilter("stations-labels", null);
    map.setFilter("portals-labels", null);
    map.getSource("route-highlight").setData({ type: "FeatureCollection", features: [] });
    map.setPaintProperty("troncales-lines", "line-opacity", 0.8);
    
    // Remettre le contour par défaut des stations
    map.setPaintProperty("stations-points", "circle-stroke-color", [
      "case",
      ["in", ["get", "cod_nodo"], ["literal", closedStationCodes]],
      closedStationStrokeColor,
      buildTroncalColorExpression()
    ]);
    // Remettre l'opacité normale des stations (1 = 100%)
    map.setPaintProperty("stations-points", "circle-opacity", 1);
    map.setPaintProperty("stations-points", "circle-stroke-opacity", 1);

    // Remettre l'opacité normale des noms/textes de stations
    map.setPaintProperty("stations-labels", "text-opacity", 1);
    map.setPaintProperty("portals-labels", "text-opacity", 1);
  };

  // Réinitialisation si clic sur le vide
  map.on("click", (e) => {
    const features = map.queryRenderedFeatures(e.point, { layers: ["stations-points"] });
    if (features.length === 0) {
      if (activePopup) { activePopup.remove(); activePopup = null; }
      resetView();
    }
  });

  // Gestion du clic sur un badge de service dans les popups
  document.addEventListener("click", (e) => {
    const badge = e.target.closest(".service-badge");
    if (!badge) return;

    const serviceCode = badge.dataset.service;
    const route = routesData[serviceCode];

    if (route) {
      const firstLetter = serviceCode[0];
      const highlightColor = troncalColors[firstLetter] ?? defaultLineColor;

      map.getSource("route-highlight").setData({
        type: "Feature",
        geometry: route.geometry,
        properties: { color: highlightColor }
      });

      map.setPaintProperty("route-highlight-line", "line-color", highlightColor);

      // On garde toutes les stations mais on change la couleur de celles de la ligne
      const stationCodes = route.stationCodes.map(Number);
      map.setPaintProperty("stations-points", "circle-stroke-color", [
        "case",
        ["in", ["get", "cod_nodo"], ["literal", stationCodes]],
        highlightColor,
        dimmedStationStrokeColor // Paramétré dans config.js
      ]);

      // Opacité variable : stations de la ligne à 1, les autres atténuées
      const opacityExpression = [
        "case",
        ["in", ["get", "cod_nodo"], ["literal", stationCodes]],
        1,
        dimmedStationOpacity // Paramétré dans config.js
      ];
      map.setPaintProperty("stations-points", "circle-opacity", opacityExpression);
      map.setPaintProperty("stations-points", "circle-stroke-opacity", opacityExpression);

      // Opacité variable pour les noms des stations
      const labelOpacityExpression = [
        "case",
        ["in", ["get", "cod_nodo"], ["literal", stationCodes]],
        1,
        dimmedStationLabelOpacity // Paramétré dans config.js
      ];
      map.setPaintProperty("stations-labels", "text-opacity", labelOpacityExpression);
      map.setPaintProperty("portals-labels", "text-opacity", labelOpacityExpression);

      // On laisse les autres lignes visibles avec l'opacité paramétrée
      map.setPaintProperty("troncales-lines", "line-opacity", dimmedLinesOpacity);
    }
  });

  // Déclare la source de données GeoJSON contenant les tracés.
  map.addSource("troncales", {
    type: "geojson",
    data: "/data/Trazados_Troncales_de_TRANSMILENIO.geojson"
  });

  // Ajoute la couche visuelle pour dessiner les lignes.
  map.addLayer({
    id: "troncales-lines",
    type: "line",
    source: "troncales",
    paint: {
      // Couleur de la troncale selon l'identifiant du tracé.
      "line-color": buildTroncalColorExpression(),
      // Ajuste l'épaisseur de la ligne selon le niveau de zoom.
      "line-width": [
        "interpolate",
        ["linear"],
        ["zoom"],
        6, 2,
        12, 5
      ],
      "line-opacity": 0.8
    }
  });
}

// Ajoute les stations sous forme de points cliquables.
export function addStations(map) {
  // Charge la liste des services qui s'arrêtent à chaque station (clé = code cod_nodo).
  // Ce fichier est produit par le script scripts/build-services-by-station.mjs.
  let servicesByStation = {};
  fetch("/data/servicios-por-estacion.json")
    .then((response) => response.json())
    .then((data) => {
      servicesByStation = data;
    });

  // Déclare la source de données GeoJSON contenant les stations.
  map.addSource("stations", {
    type: "geojson",
    data: "/data/Estaciones_Troncales_de_TRANSMILENIO.geojson"
  });

  // Affiche les stations comme des cercles.
  map.addLayer({
    id: "stations-points",
    type: "circle",
    source: "stations",
    paint: {
      // Le rayon grandit avec le zoom ; les portails sont plus grands que les stations.
      "circle-radius": buildStationRadiusExpression(),

      // Une station fermée est grisée, un portail est rempli de la couleur de sa troncale,
      // les autres stations sont blanches.
      "circle-color": [
        "case",
        ["in", ["get", "cod_nodo"], ["literal", closedStationCodes]],
        closedStationFillColor,
        isPortalExpression,
        buildTroncalColorExpression(),
        "#ffffff"
      ],
      "circle-stroke-width": 2,
      // Contour : gris pour une station fermée, sinon la couleur de la troncale.
      "circle-stroke-color": [
        "case",
        ["in", ["get", "cod_nodo"], ["literal", closedStationCodes]],
        closedStationStrokeColor,
        buildTroncalColorExpression()
      ]
    }
  });

  // Ajoute les noms des portails sur la carte de manière permanente.
  map.addLayer({
    id: "portals-labels",
    type: "symbol",
    source: "stations",
    // Ne filtre que les entités dont le nom commence par "Portal".
    filter: ["==", ["slice", ["get", "nom_est"], 0, 6], "Portal"],
    layout: {
      "text-field": ["get", "nom_est"],
      "text-size": 12,
      "text-offset": [0, 1.5],
      "text-anchor": "top"
    },
    paint: {
      "text-color": "#000"
    }
  });

  // Ajoute les noms des stations (sauf les portails, qui ont déjà leur propre couche).
  // MapLibre masque automatiquement les noms qui se chevauchent : plus on zoome, plus il y en a.
  map.addLayer({
    id: "stations-labels",
    type: "symbol",
    source: "stations",
    minzoom: stationLabelMinZoom,
    filter: ["!", isPortalExpression],
    layout: {
      "text-field": ["get", "nom_est"],
      "text-font": stationLabelFont,
      "text-size": stationLabelTextSize,
      "text-offset": stationLabelOffset,
      "text-anchor": "top", // le texte est placé sous le point
      "text-max-width": stationLabelMaxWidth
    },
    paint: {
      // Texte gris pour une station fermée, sombre sinon.
      "text-color": [
        "case",
        ["in", ["get", "cod_nodo"], ["literal", closedStationCodes]],
        closedStationLabelColor,
        stationLabelColor
      ],
      "text-halo-color": "#ffffff", // le halo garde le texte lisible sur les lignes colorées
      "text-halo-width": stationLabelHaloWidth
    }
  });

  // Gestion du clic sur une station pour afficher les infos.
  map.on("click", "stations-points", (e) => {
    // Si une popup est déjà ouverte, on la ferme
    if (activePopup) {
      activePopup.remove();
      activePopup = null;
    }

    const feature = e.features[0];
    const services = servicesByStation[feature.properties.cod_nodo];

    activePopup = new maplibregl.Popup()
      .setLngLat(e.lngLat)
      .setHTML(buildStationPopupHtml(feature.properties, services))
      .addTo(map);
  });

  // Change le curseur en pointeur (la main) lorsqu'il survole une station.
  map.on("mouseenter", "stations-points", () => map.getCanvas().style.cursor = "pointer");
  map.on("mouseleave", "stations-points", () => map.getCanvas().style.cursor = "");
}