// Ce fichier regroupe tous les réglages de la carte TransMilenio : couleurs, états des stations
// (fermées, temporaires), tailles des points et des noms.
// Il ne contient aucune logique : pour changer l'apparence ou l'état d'une station,
// on modifie une valeur ici, sans toucher aux autres fichiers.

// Couleur de chaque troncale, selon sa lettre (champ "le_troncal" du fichier).
// Ces couleurs sont celles du champ "color" des tracés de l'API de TransMilenio
// (api.buscador-rutas.transmilenio.gov.co, couche trazados_troncal).
// Modifier une couleur ici suffit : le reste du code n'a pas à changer.
export const troncalColors = {
  A: "#26358C", // Caracas
  B: "#80BA27", // Autopista Norte
  C: "#FCBD1B", // Suba
  D: "#8064A9", // Calle 80
  E: "#AE6B00", // NQS Central
  F: "#DC0814", // Américas
  G: "#009CDE", // NQS Sur
  H: "#F18500", // Caracas Sur
  J: "#E1A2AC", // Eje Ambiental
  K: "#D5B079", // Calle 26
  L: "#009A9D", // Carrera 10
  M: "#009A9D", // Carrera 7 (même couleur que la Carrera 10 dans l'API)
  Z: "#BD202A"  // Avenida Ciudad de Cali
};

// Couleur utilisée quand une troncale n'est pas reconnue.
export const defaultLineColor = "#808080";

// Stations fermées à cause des travaux du métro (code cod_nodo de la station).
// Pour fermer une station, ajoute son code ici ; pour la rouvrir, retire-le.
export const closedStationCodes = [
  9109, // Tercer Milenio
  9108, // Hospital
  9111, // Calle 19
  9117, // Calle 45 - American School Way
  9120, // Calle 63
  9123  // Calle 76 - San Felipe
];

// Stations temporaires ouvertes pendant les travaux du métro (code cod_nodo).
export const temporaryStationCodes = [
  9115,  // Temporal Calle 34
  14003  // Temporal AV. Jiménez - Inter Eléctricas
];

// Couleurs d'une station fermée : point gris clair, contour gris.
export const closedStationFillColor = "#d1d5db";
export const closedStationStrokeColor = "#9ca3af";

// Condition MapLibre : vraie quand le nom de la station commence par "Portal" (6 premières lettres).
export const isPortalExpression = ["==", ["slice", ["get", "nom_est"], 0, 6], "Portal"];

// --- Réglages des noms de stations (à modifier librement pour tester) ---
export const stationLabelMinZoom = 11;       // zoom à partir duquel les noms apparaissent (plus petit = plus tôt)
export const stationLabelTextSize = 11;      // taille du texte, en pixels
export const stationLabelOffset = [0, 0.9];  // décalage du texte par rapport au point : [horizontal, vertical], en "em"
export const stationLabelMaxWidth = 8;       // largeur maximale avant retour à la ligne, en "em"
export const stationLabelHaloWidth = 1.5;    // épaisseur du halo blanc autour du texte, en pixels
export const stationLabelFont = ["Noto Sans Regular"]; // police fournie par le fond de carte OpenFreeMap
export const stationLabelColor = "#1f2937";  // couleur du texte d'une station ouverte
export const closedStationLabelColor = "#9ca3af"; // couleur du texte d'une station fermée

// --- Réglages de la taille des points de stations (à modifier librement pour tester) ---
// Le rayon grandit de façon régulière entre le zoom de départ et le zoom maximal.
export const stationRadiusMinZoom = 10;     // zoom de départ de l'agrandissement
export const stationRadiusMaxZoom = 16;    // à partir de ce zoom, les points ne grandissent plus
export const stationRadiusAtMinZoom = 2;   // rayon d'une station au zoom de départ, en pixels (petit = moins de chevauchement)
export const stationRadiusAtMaxZoom = 12;   // rayon d'une station au zoom maximal, en pixels (grand = plus facile à toucher)
export const portalRadiusFactor = 1.6;     // un portail est ce nombre de fois plus grand qu'une station

// Lettre de troncale de chaque tracé (id_trazado -> le_troncal).
// Cette table vient du fichier Trazados_Troncales_de_TRANSMILENIO.geojson.
export const troncalLetterByTrazadoId = {
  TZ001: "A",
  TZ002: "B",
  TZ003: "C",
  TZ004: "C",
  TZ005: "D",
  TZ006: "D",
  TZ007: "E",
  TZ008: "E",
  TZ009: "F",
  TZ010: "G",
  TZ011: "G",
  TZ012: "H",
  TZ013: "H",
  TZ014: "H",
  TZ015: "J",
  TZ016: "K",
  TZ017: "K",
  TZ018: "L",
  TZ019: "M",
  TZ020: "M",
  TZ022: "Z",
  TZ022A: "Z"
};