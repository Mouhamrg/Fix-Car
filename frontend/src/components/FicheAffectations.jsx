import { Link } from "react-router-dom";


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

        <span className="fiche-affectation__mecanicien">👤 {affectation.mecanicien_nom}</span>

        {peutGerer && (
          <Link to={`/affectations/${affectation.id}/modifier`} className="bouton bouton--discret">
            Réaffecter
          </Link>
        )}

      </div>
    </div>
  );
}
