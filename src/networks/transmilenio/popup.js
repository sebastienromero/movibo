// Ce fichier fabrique le contenu HTML du popup affiché au clic sur une station
// (nom, services sous forme de badges colorés, adresse, état fermé ou temporaire).
// Il intervient à chaque clic sur une station, appelé depuis layers.js.

import { troncalColors, defaultLineColor, closedStationCodes, temporaryStationCodes } from "./config.js";

// Choisit un texte noir ou blanc selon la luminosité du fond, pour rester lisible.
function getReadableTextColor(hexColor) {
  const red = parseInt(hexColor.slice(1, 3), 16);
  const green = parseInt(hexColor.slice(3, 5), 16);
  const blue = parseInt(hexColor.slice(5, 7), 16);
  const brightness = (red * 299 + green * 587 + blue * 114) / 1000;
  return brightness > 150 ? "#000000" : "#ffffff";
}

// Fabrique le petit carré coloré d'un service (couleur selon la première lettre du code).
function buildServiceBadge(serviceCode) {
  const backgroundColor = troncalColors[serviceCode[0]] ?? defaultLineColor;
  const textColor = getReadableTextColor(backgroundColor);
  // On utilise un bouton cliquable avec un attribut data-service pour capter le clic
  return `<button class="service-badge" data-service="${serviceCode}" style="background:${backgroundColor};color:${textColor};border:none;padding:2px 5px;border-radius:3px;cursor:pointer;margin:2px;font-size:12px;">${serviceCode}</button>`;
}

// Fabrique le contenu du popup d'une station selon son état (fermée, temporaire ou ouverte).
// "properties" contient les champs de la station ; "services" est sa liste de services (ou undefined).
export function buildStationPopupHtml(properties, services) {
  const stationCode = Number(properties.cod_nodo);
  const nameHtml = `<strong>${properties.nom_est}</strong>`;
  const addressHtml = `Adresse: ${properties.ub_est}`;

  // Station fermée : on n'affiche pas de services, puisque aucun bus ne s'y arrête.
  if (closedStationCodes.includes(stationCode)) {
    return `${nameHtml}<br>Station fermée (travaux du métro)<br>${addressHtml}`;
  }

  const temporaryHtml = temporaryStationCodes.includes(stationCode) ? " (station temporaire)" : "";
  const servicesHtml = services
    ? services.map(buildServiceBadge).join("")
    : "information non disponible";

  return `${nameHtml}${temporaryHtml}<br>Arrêt de : ${servicesHtml}<br>${addressHtml}`;
}