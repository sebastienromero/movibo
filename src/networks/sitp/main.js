// Ce fichier est le point d'entrée de la page SITP : il crée la carte avec le fond commun,
// puis ajoute les arrêts définis dans layers.js.
// Il s'exécute au chargement de sitp.html.

import "../../shared/style.css"; // Styles communs : taille de la carte et boutons de contrôle
import { createBaseMap } from "../../shared/map.js";
import { addStops } from "./layers.js";

const mapElement = document.querySelector("#map"); // Le <div id="map"> de sitp.html

if (mapElement) { // Évite une erreur si la page n'a pas de carte
  const map = createBaseMap(mapElement);
  // Les couches ne peuvent être ajoutées qu'une fois le fond de carte chargé.
  map.on("load", () => addStops(map));
}