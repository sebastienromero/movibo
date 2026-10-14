// Ce fichier est le point d'entrée de la page TransMilenio : il crée la carte
// avec le fond commun, puis ajoute les couches définies dans layers.js.
// Il s'exécute au chargement de la page.

import "../../shared/style.css";
import "./style.css";
import { createBaseMap } from "../../shared/map.js";
import { addTroncales, addStations } from "./layers.js";

const mapElement = document.querySelector("#map");

// Fonction principale qui initialise la carte et ajoute les couches.
function createTransmilenioMap() {
  const map = createBaseMap(mapElement);

  map.on("load", () => {
    addTroncales(map);
    addStations(map);
  });
}

if (mapElement) {
  createTransmilenioMap();
}
