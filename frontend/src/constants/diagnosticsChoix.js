export const STATUTS_DEVIS = [
  { valeur: "EN_ATTENTE_VALIDATION", libelle: "En attente de votre validation" },
  { valeur: "ACCEPTE", libelle: "Accepté" },
  { valeur: "REFUSE", libelle: "Refusé" },
];

export const CLASSES_STATUT_DEVIS = {
  EN_ATTENTE_VALIDATION: "badge-statut--attente",
  ACCEPTE: "badge-statut--traitement",
  REFUSE: "badge-statut--annulee",
};

export function libelleStatutDevis(valeur) {
  return STATUTS_DEVIS.find((s) => s.valeur === valeur)?.libelle || valeur;
}
