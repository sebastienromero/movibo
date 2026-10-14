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
  portalRadiusFactor
} from "./config.js";
import { buildStationPopupHtml } from "./popup.js";

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
    const feature = e.features[0];
    const services = servicesByStation[feature.properties.cod_nodo];

    new maplibregl.Popup()
      .setLngLat(e.lngLat)
      .setHTML(buildStationPopupHtml(feature.properties, services))
      .addTo(map);
  });

  // Change le curseur en pointeur (la main) lorsqu'il survole une station.
  map.on("mouseenter", "stations-points", () => map.getCanvas().style.cursor = "pointer");
  map.on("mouseleave", "stations-points", () => map.getCanvas().style.cursor = "");
}