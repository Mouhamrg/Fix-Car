import { useEffect, useState } from "react";
import { useContext } from "react";
import { Link } from "react-router-dom";
import { listerAffectations, refuserAffectation } from "../api/affectationsApi";
import { listDemandes } from "../api/demandes";
import {UserContext} from "../utils/user.jsx";
import FicheAffectation from "../components/FicheAffectations";
import AppLayout from "../components/AppLayout.jsx";

export default function PageAffectations() {
  const utilisateur = useContext(UserContext);


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
      console.log(listeAffectations);
      
        const demandes = await listDemandes();
        setDemandesEnAttente(
          demandes.filter((d) => d.statut === "en_attente")
        );
      

      
        // Pour connaître l'état du devis (s'il existe) de chaque
        // réparation qui m'est assignée.
        const mesDemandes = await listDemandes();
        const carte = {};
        mesDemandes.forEach((d) => {
          carte[d.id] = d;
        });listDemandes
        setDemandesParId(carte);
    
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

  if (utilisateur?.role !== "GESTIONNAIRE") {
    return (
      <AppLayout>
      <div className="carte etat-vide">
        <p>Cette section est réservée aux gestionnaires, mécaniciens et administrateurs.</p>
      </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="entete-page">
        <div>
          <h1>{utilisateur?.role === "GESTIONNAIRE" ? "Affectation des réparations" : "Mes réparations assignées"}</h1>
          <p>
            {utilisateur?.role === "GESTIONNAIRE" ? "Affectez les demandes en attente à un mécanicien disponible."
              : "Réparations qui vous ont été confiées par le gestionnaire."}
          </p>
        </div>
      </div>

      {chargement && <div className="chargement">Chargement...</div>}
      {!chargement && erreur && <div className="alerte alerte--erreur">{erreur}</div>}

      {!chargement && !erreur && (
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
                    {utilisateur?.role === "GESTIONNAIRE" && (
                      <Link
                        to={"http://localhost:8000/admin/affectations/"}
                        className="bouton bouton--principal"
                        target="_blank"
                      >
                        Affecter
                      </Link>
                    )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {!chargement && !erreur && (
        <>
          <h2 style={{ marginBottom: 14 }}>
            {utilisateur?.role === "MECANICIEN" ? `Réparations affectées (${affectations.length})` : `Utilisateur (${utilisateur?.role ?? ""})`}
          </h2>
          {affectations.length === 0 ? (
            <div className="etat-vide carte">
              <p>
                {utilisateur?.role === "MECANICIEN" 
                  ? "Aucune affectation pour le moment."
                  : "Aucune réparation ne vous a été assignée pour le moment. "}
              </p>
            </div>
          ) : (
            <div className="grille-affectations">
              {affectations.map((affectation) => (
                <FicheAffectation
                  key={affectation.id}
                  affectation={affectation}
                  devis={demandesParId[affectation.demande]?.devis}
                  onRefuser={gererRefus}
                />
              ))}
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
}
