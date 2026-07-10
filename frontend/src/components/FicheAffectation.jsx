import { Link } from "react-router-dom";
import { CLASSES_STATUT, STATUTS } from "../constants/demandeChoix";
import { CLASSES_STATUT_DEVIS, libelleStatutDevis } from "../constants/diagnosticChoix";

function libelleStatut(valeur) {
  return STATUTS.find((s) => s.valeur === valeur)?.libelle || valeur;
}

export default function FicheAffectation({ affectation, peutGerer, peutTraiter, devis, onRefuser }) {
  return (
    <div className="fiche-affectation">
      <div className="fiche-affectation__info">
        <span className="fiche-affectation__titre">{affectation.demande_titre}</span>
        <span className="fiche-affectation__meta">
          Client : {affectation.demande_client_nom} · Véhicule : {affectation.demande_vehicule_plaque}
        </span>
        {affectation.commentaire && (
          <span className="fiche-affectation__meta">Note : {affectation.commentaire}</span>
        )}
      </div>

      <div className="fiche-affectation__actions">
        <span className={`badge-statut ${CLASSES_STATUT[affectation.demande_statut] || ""}`}>
          {libelleStatut(affectation.demande_statut)}
        </span>
        <span className="fiche-affectation__mecanicien">👤 {affectation.mecanicien_nom}</span>

        {peutGerer && (
          <Link to={`/affectations/${affectation.id}/modifier`} className="bouton bouton--discret">
            Réaffecter
          </Link>
        )}

        {peutTraiter && !devis && (
          <>
            <button type="button" className="bouton bouton--danger" onClick={() => onRefuser(affectation.id)}>
              Refuser
            </button>
            <Link
              to={`/diagnostics/nouveau?demande=${affectation.demande}`}
              className="bouton bouton--principal"
            >
              Ajouter un diagnostic
            </Link>
          </>
        )}

        {peutTraiter && devis && (
          <>
            <span className={`badge-statut ${CLASSES_STATUT_DEVIS[devis.statut] || ""}`}>
              Devis : {libelleStatutDevis(devis.statut)}
            </span>
            <Link to={`/diagnostics/${devis.id}/modifier`} className="bouton bouton--discret">
              {devis.statut === "REFUSE" ? "Réviser le devis" : "Voir le diagnostic"}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
