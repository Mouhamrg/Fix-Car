/**
 * DRF renvoie les erreurs de validation sous la forme
 * { champ: ["message"], autre_champ: ["message"] } ou parfois
 * { detail: "message" }. Cette fonction normalise ça pour l'affichage.
 */
export function extraireErreurs(erreur) {
  const donnees = erreur?.response?.data;

  if (!donnees) {
    return { champs: {}, generale: "Une erreur de connexion est survenue. Réessayez." };
  }

  if (typeof donnees === "string") {
    return { champs: {}, generale: donnees };
  }

  if (donnees.detail) {
    return { champs: {}, generale: donnees.detail };
  }

  const champs = {};
  let generale = "";

  Object.entries(donnees).forEach(([cle, valeur]) => {
    const message = Array.isArray(valeur) ? valeur.join(" ") : String(valeur);
    if (cle === "non_field_errors") {
      generale = message;
    } else {
      champs[cle] = message;
    }
  });

  if (!generale && Object.keys(champs).length === 0) {
    generale = "Une erreur est survenue. Vérifiez les champs et réessayez.";
  }

  return { champs, generale };
}
