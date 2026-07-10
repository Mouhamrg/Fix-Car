import { Link } from "react-router-dom";
import { CARBURANTS, CATEGORIES, libelleParValeur } from "../constants/vehiculeChoix";

export default function FicheVehicule({ vehicule, onSupprimer, onReactiver }) {
  const estActif = vehicule.actif;

  return (
    <article className={`fiche-vehicule ${estActif ? "" : "fiche-vehicule--inactif"}`}>
      <div className="fiche-vehicule__entete">
        <div>
          <h3 className="fiche-vehicule__titre">
            {vehicule.marque} {vehicule.modele}
          </h3>
          <p className="fiche-vehicule__sous-titre">
            {vehicule.annee} · {libelleParValeur(CATEGORIES, vehicule.categorie)}
          </p>
        </div>
        <span className="plaque">{vehicule.plaque_immatriculation}</span>
      </div>

      <dl className="fiche-vehicule__meta">
        <div>
          <dt>Kilométrage</dt>
          <dd>{vehicule.kilometrage.toLocaleString("fr-CA")} km</dd>
        </div>
        <div>
          <dt>Carburant</dt>
          <dd>{libelleParValeur(CARBURANTS, vehicule.carburant)}</dd>
        </div>
        <div>
          <dt>Couleur</dt>
          <dd>{vehicule.couleur || "—"}</dd>
        </div>
        <div>
          <dt>État</dt>
          <dd>
            <span className={`etat-actif ${estActif ? "etat-actif--oui" : "etat-actif--non"}`}>
              {estActif ? "Actif" : "Désactivé"}
            </span>
          </dd>
        </div>
      </dl>

      <div className="fiche-vehicule__actions">
        <Link to={`/vehicules/${vehicule.id}/modifier`} className="bouton bouton--discret">
          Modifier
        </Link>
        {estActif ? (
          <button
            type="button"
            className="bouton bouton--danger"
            onClick={() => onSupprimer(vehicule.id)}
          >
            Désactiver
          </button>
        ) : (
          <button
            type="button"
            className="bouton bouton--principal"
            onClick={() => onReactiver(vehicule.id)}
          >
            Réactiver
          </button>
        )}
      </div>
    </article>
  );
}
