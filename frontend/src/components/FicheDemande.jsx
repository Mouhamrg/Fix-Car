import { Link } from "react-router-dom";
import { CLASSES_STATUT } from "../constants/demandeChoix";
import { CLASSES_STATUT_DEVIS, libelleStatutDevis } from "../constants/diagnosticChoix";

export default function FicheDemande({ demande, onAnnuler, onValiderDevis, onRefuserDevis }) {
  const devis = demande.devis;

  return (
    <article className="fiche-demande">
      <div className="fiche-demande__entete">
        <div>
          <h3 className="fiche-demande__titre">{demande.titre}</h3>
          <p className="fiche-demande__vehicule">
            {demande.vehicule_marque} {demande.vehicule_modele} · {demande.vehicule_plaque}
          </p>
        </div>
        <span className={`badge-statut ${CLASSES_STATUT[demande.statut] || ""}`}>
          {demande.statut_affichage}
        </span>
      </div>

      <p className="fiche-demande__description">{demande.description_probleme}</p>

      {devis && (
        <div className="bloc-devis">
          <div className="bloc-devis__entete">
            <span>Devis proposé</span>
            <span className={`badge-statut ${CLASSES_STATUT_DEVIS[devis.statut] || ""}`}>
              {libelleStatutDevis(devis.statut)}
            </span>
          </div>
          <div className="bloc-devis__montant">{Number(devis.cout_estime).toFixed(2)} $</div>

          {devis.statut === "EN_ATTENTE_VALIDATION" && (
            <div className="fiche-demande__actions">
              <button
                type="button"
                className="bouton bouton--principal"
                onClick={() => onValiderDevis(devis.id)}
              >
                Accepter le devis
              </button>
              <button
                type="button"
                className="bouton bouton--danger"
                onClick={() => onRefuserDevis(devis.id)}
              >
                Refuser le devis
              </button>
            </div>
          )}
        </div>
      )}

      <div className="fiche-demande__actions">
        {demande.modifiable && (
          <>
            <Link to={`/demandes/${demande.id}/modifier`} className="bouton bouton--discret">
              Modifier
            </Link>
            <button type="button" className="bouton bouton--danger" onClick={() => onAnnuler(demande.id)}>
              Annuler
            </button>
          </>
        )}
      </div>
    </article>
  );
}
