import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listerAffectations, refuserAffectation } from "../api/affectationsApi";
import { listerDemandes } from "../api/demandesApi";
import { useAuth } from "../context/AuthContext";
import { estMecanicien, peutGererAffectations, peutVoirAffectations } from "../utils/roles";
import FicheAffectation from "../components/FicheAffectation";

export default function PageAffectations() {
  const { utilisateur } = useAuth();
  const gerer = peutGererAffectations(utilisateur);
  const traiter = estMecanicien(utilisateur);

  const [affectations, setAffectations] = useState([]);
  const [demandesEnAttente, setDemandesEnAttente] = useState([]);
  const [demandesParId, setDemandesParId] = useState({});
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  async function chargerDonnees() {
    setChargement(true);
    setErreur("");
    try {
      const listeAffectations = await listerAffectations();
      setAffectations(listeAffectations);

      if (gerer) {
        const demandes = await listerDemandes();
        setDemandesEnAttente(
          demandes.filter((d) => d.statut === "EN_ATTENTE" && !d.mecanicien_assigne)
        );
      }

      if (traiter) {
        // Pour connaître l'état du devis (s'il existe) de chaque
        // réparation qui m'est assignée.
        const mesDemandes = await listerDemandes();
        const carte = {};
        mesDemandes.forEach((d) => {
          carte[d.id] = d;
        });
        setDemandesParId(carte);
      }
    } catch {
      setErreur("Impossible de charger les affectations pour le moment.");
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    chargerDonnees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function gererRefus(affectationId) {
    if (!window.confirm("Refuser cette réparation ? Elle repassera en attente d'affectation.")) {
      return;
    }
    await refuserAffectation(affectationId);
    chargerDonnees();
  }

  if (!peutVoirAffectations(utilisateur)) {
    return (
      <div className="carte etat-vide">
        <p>Cette section est réservée aux gestionnaires, mécaniciens et administrateurs.</p>
      </div>
    );
  }

  return (
    <>
      <div className="entete-page">
        <div>
          <h1>{gerer ? "Affectation des réparations" : "Mes réparations assignées"}</h1>
          <p>
            {gerer
              ? "Affectez les demandes en attente à un mécanicien disponible."
              : "Réparations qui vous ont été confiées par le gestionnaire."}
          </p>
        </div>
      </div>

      {chargement && <div className="chargement">Chargement...</div>}
      {!chargement && erreur && <div className="alerte alerte--erreur">{erreur}</div>}

      {!chargement && !erreur && gerer && (
        <>
          <h2 style={{ marginBottom: 14 }}>
            Demandes en attente d'affectation ({demandesEnAttente.length})
          </h2>
          {demandesEnAttente.length === 0 ? (
            <p style={{ marginBottom: 32 }}>Aucune demande en attente pour le moment.</p>
          ) : (
            <div className="liste-demandes-attente">
              {demandesEnAttente.map((demande) => (
                <div className="ligne-demande-attente" key={demande.id}>
                  <div>
                    <div className="ligne-demande-attente__titre">{demande.titre}</div>
                    <div className="ligne-demande-attente__meta">
                      {demande.client_nom} · {demande.vehicule_marque} {demande.vehicule_modele} ·{" "}
                      {demande.vehicule_plaque}
                    </div>
                  </div>
                  <Link
                    to={`/affectations/nouvelle?demande=${demande.id}`}
                    className="bouton bouton--principal"
                  >
                    Affecter
                  </Link>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {!chargement && !erreur && (
        <>
          <h2 style={{ marginBottom: 14 }}>
            {gerer ? `Réparations affectées (${affectations.length})` : null}
          </h2>
          {affectations.length === 0 ? (
            <div className="etat-vide carte">
              <p>
                {gerer
                  ? "Aucune affectation pour le moment."
                  : "Aucune réparation ne vous a été assignée pour le moment."}
              </p>
            </div>
          ) : (
            <div className="grille-affectations">
              {affectations.map((affectation) => (
                <FicheAffectation
                  key={affectation.id}
                  affectation={affectation}
                  peutGerer={gerer}
                  peutTraiter={traiter}
                  devis={demandesParId[affectation.demande]?.devis}
                  onRefuser={gererRefus}
                />
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
