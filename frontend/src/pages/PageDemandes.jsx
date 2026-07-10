import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listerDemandes, annulerDemande } from "../api/demandesApi";
import { validerDiagnostic, refuserDiagnostic } from "../api/diagnosticsApi";
import FicheDemande from "../components/FicheDemande";

export default function PageDemandes() {
  const [demandes, setDemandes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  async function chargerDemandes() {
    setChargement(true);
    setErreur("");
    try {
      const donnees = await listerDemandes();
      setDemandes(donnees);
    } catch {
      setErreur("Impossible de charger vos demandes pour le moment.");
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    chargerDemandes();
  }, []);

  async function gererAnnulation(id) {
    if (!window.confirm("Annuler cette demande de réparation ?")) return;
    await annulerDemande(id);
    chargerDemandes();
  }

  async function gererValidationDevis(devisId) {
    if (!window.confirm("Accepter ce devis ? Le mécanicien pourra procéder aux réparations.")) return;
    await validerDiagnostic(devisId);
    chargerDemandes();
  }

  async function gererRefusDevis(devisId) {
    const commentaire = window.prompt(
      "Pourquoi refusez-vous ce devis ? (optionnel, le mécanicien pourra le réviser)",
      ""
    );
    if (commentaire === null) return; // annulé
    await refuserDiagnostic(devisId, commentaire);
    chargerDemandes();
  }

  return (
    <>
      <div className="entete-page">
        <div>
          <h1>Mes demandes de réparation</h1>
          <p>Suivez l'état de vos demandes soumises à l'atelier.</p>
        </div>
        <Link to="/demandes/nouvelle" className="bouton bouton--principal">
          + Nouvelle demande
        </Link>
      </div>

      {chargement && <div className="chargement">Chargement des demandes...</div>}

      {!chargement && erreur && <div className="alerte alerte--erreur">{erreur}</div>}

      {!chargement && !erreur && demandes.length === 0 && (
        <div className="etat-vide carte">
          <p style={{ marginBottom: 16 }}>Vous n'avez encore soumis aucune demande de réparation.</p>
          <Link to="/demandes/nouvelle" className="bouton bouton--principal">
            Créer ma première demande
          </Link>
        </div>
      )}

      {!chargement && !erreur && demandes.length > 0 && (
        <div className="grille-demandes">
          {demandes.map((demande) => (
            <FicheDemande
              key={demande.id}
              demande={demande}
              onAnnuler={gererAnnulation}
              onValiderDevis={gererValidationDevis}
              onRefuserDevis={gererRefusDevis}
            />
          ))}
        </div>
      )}
    </>
  );
}
