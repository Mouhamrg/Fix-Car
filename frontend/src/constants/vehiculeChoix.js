export const CATEGORIES = [
  { valeur: "PROMENADE", libelle: "Véhicule de promenade" },
  { valeur: "CAMION_LEGER", libelle: "Camion léger / VUS" },
  { valeur: "MOTO", libelle: "Motocyclette" },
  { valeur: "REMORQUE", libelle: "Remorque" },
  { valeur: "VEHICULE_LOURD", libelle: "Véhicule lourd" },
  { valeur: "AUTRE", libelle: "Autre" },
];

export const CARBURANTS = [
  { valeur: "ESSENCE", libelle: "Essence" },
  { valeur: "DIESEL", libelle: "Diesel" },
  { valeur: "HYBRIDE", libelle: "Hybride" },
  { valeur: "HYBRIDE_RECHARGEABLE", libelle: "Hybride rechargeable" },
  { valeur: "ELECTRIQUE", libelle: "Électrique" },
  { valeur: "AUTRE", libelle: "Autre" },
];

export function libelleParValeur(liste, valeur) {
  return liste.find((item) => item.valeur === valeur)?.libelle || valeur;
}