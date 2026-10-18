// Ce fichier regroupe les réglages de la carte SITP : couleur, taille des arrêts, noms.
// Il ne contient aucune logique : pour changer l'apparence, on modifie une valeur ici.

export const sitpColor = "#1e40af"; // bleu des bus SITP, utilisé pour le contour des arrêts

// --- Taille des points d'arrêts ---
// Le rayon grandit régulièrement entre le zoom de départ et le zoom maximal.
export const stopRadiusMinZoom = 10;   // zoom de départ de l'agrandissement
export const stopRadiusMaxZoom = 16;   // à partir de ce zoom, les points ne grandissent plus
export const stopRadiusAtMinZoom = 1.5; // rayon d'un arrêt au zoom de départ, en pixels
export const stopRadiusAtMaxZoom = 6;   // rayon d'un arrêt au zoom maximal, en pixels

// --- Noms des arrêts ---
export const stopLabelMinZoom = 15;     // zoom à partir duquel les noms apparaissent
export const stopLabelTextSize = 11;    // taille du texte, en pixels
export const stopLabelOffset = [0, 0.8]; // décalage du texte sous le point : [horizontal, vertical], en "em"
export const stopLabelMaxWidth = 8;     // largeur maximale avant retour à la ligne, en "em"
export const stopLabelHaloWidth = 1.5;  // épaisseur du halo blanc autour du texte, en pixels
export const stopLabelFont = ["Noto Sans Regular"]; // police fournie par le fond de carte
export const stopLabelColor = "#1f2937"; // couleur du texte