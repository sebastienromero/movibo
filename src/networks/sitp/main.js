// Ce fichier est le point d'entrée de la page SITP : il crée la carte avec le fond commun.
// Il s'exécute au chargement de sitp.html.
// Pour l'instant la carte est vide : les arrêts seront ajoutés à l'étape suivante.

import "../../shared/style.css"; // Styles communs : taille de la carte et boutons de contrôle
import { createBaseMap } from "../../shared/map.js";

const mapElement = document.querySelector("#map"); // Le <div id="map"> de sitp.html

if (mapElement) { // Évite une erreur si la page n'a pas de carte
  createBaseMap(mapElement);
}