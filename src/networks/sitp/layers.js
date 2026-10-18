// Ce fichier ajoute les couches de la carte SITP : les points d'arrêts, leurs noms,
// et le popup affiché au clic sur un arrêt.
// Il intervient une seule fois, quand le fond de carte est chargé (appelé depuis main.js).

import maplibregl from "maplibre-gl";
import {
  sitpColor,
  stopRadiusMinZoom,
  stopRadiusMaxZoom,
  stopRadiusAtMinZoom,
  stopRadiusAtMaxZoom,
  stopLabelMinZoom,
  stopLabelTextSize,
  stopLabelOffset,
  stopLabelMaxWidth,
  stopLabelHaloWidth,
  stopLabelFont,
  stopLabelColor
} from "./config.js";

let activePopup = null; // popup actuellement ouvert, pour le fermer avant d'en ouvrir un autre

// Fabrique le contenu du popup d'un arrêt : son nom et la liste de ses services.
// "properties" vient du fichier sitp-stops.geojson ; "services" y est un texte "HH710,18-3".
function buildStopPopupHtml(properties) {
  const serviceCodes = properties.services.split(","); // transforme le texte en liste de codes
  const badgesHtml = serviceCodes
    .map((code) => `<span style="display:inline-block;background:${sitpColor};color:#fff;padding:2px 5px;border-radius:3px;margin:2px;font-size:12px;">${code}</span>`)
    .join("");
  // max-height + overflow : si un arrêt a beaucoup de services, la liste défile dans le popup.
  return `<strong>${properties.name}</strong><br>Arrêt de :<div style="max-height:150px;overflow-y:auto;">${badgesHtml}</div>`;
}

// Ajoute les arrêts sous forme de points cliquables, avec leurs noms.
export function addStops(map) {
  // Source : le fichier produit par scripts/build-sitp-data.mjs.
  map.addSource("sitp-stops", {
    type: "geojson",
    data: "/data/sitp-stops.geojson"
  });

  // Les points : visibles à tous les zooms, de plus en plus grands quand on zoome.
  map.addLayer({
    id: "sitp-stops-points",
    type: "circle",
    source: "sitp-stops",
    paint: {
      "circle-radius": [
        "interpolate", ["linear"], ["zoom"],
        stopRadiusMinZoom, stopRadiusAtMinZoom,
        stopRadiusMaxZoom, stopRadiusAtMaxZoom
      ],
      "circle-color": "#ffffff",
      "circle-stroke-width": 1.5,
      "circle-stroke-color": sitpColor
    }
  });

  // Les noms : n'apparaissent qu'à partir d'un certain zoom. MapLibre masque
  // automatiquement ceux qui se chevauchent.
  map.addLayer({
    id: "sitp-stops-labels",
    type: "symbol",
    source: "sitp-stops",
    minzoom: stopLabelMinZoom,
    layout: {
      "text-field": ["get", "name"],
      "text-font": stopLabelFont,
      "text-size": stopLabelTextSize,
      "text-offset": stopLabelOffset,
      "text-anchor": "top", // le texte est placé sous le point
      "text-max-width": stopLabelMaxWidth
    },
    paint: {
      "text-color": stopLabelColor,
      "text-halo-color": "#ffffff", // le halo garde le texte lisible sur le fond de carte
      "text-halo-width": stopLabelHaloWidth
    }
  });

  // Clic sur un arrêt : on ferme l'ancien popup et on ouvre celui de l'arrêt touché.
  map.on("click", "sitp-stops-points", (event) => {
    if (activePopup) activePopup.remove();
    const stop = event.features[0]; // si plusieurs arrêts se superposent, on prend le premier
    activePopup = new maplibregl.Popup()
      .setLngLat(stop.geometry.coordinates) // le popup s'ancre sur l'arrêt, pas sur le doigt
      .setHTML(buildStopPopupHtml(stop.properties))
      .addTo(map);
  });

  // Le curseur devient une main au survol d'un arrêt (utile sur ordinateur).
  map.on("mouseenter", "sitp-stops-points", () => (map.getCanvas().style.cursor = "pointer"));
  map.on("mouseleave", "sitp-stops-points", () => (map.getCanvas().style.cursor = ""));
}