import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listerVehicules, supprimerVehicule, reactiverVehicule } from "../api/vehiculesApi";
import FicheVehicule from "../components/FicheVehicules";
import AppLayout from '../components/AppLayout.jsx'

export default function PageVehicules() {
  const [vehicules, setVehicules] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  async function chargerVehicules() {
    setChargement(true);
    setErreur("");
    try {
      const donnees = await listerVehicules();
      setVehicules(donnees);
    } catch {
      setErreur("Impossible de charger vos véhicules pour le moment.");
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    chargerVehicules();
  }, []);

  async function gererSuppression(id) {
    if (!window.confirm("Désactiver ce véhicule ? Il restera visible mais marqué inactif.")) {
      return;
    }
    await supprimerVehicule(id);
    chargerVehicules();
  }

  async function gererReactivation(id) {
    await reactiverVehicule(id);
    chargerVehicules();
  }

  return (
    <AppLayout>
      <div className="entete-page">
        <div>
          <h1>Mes véhicules</h1>
          <p>Gérez les véhicules associés à votre compte.</p>
        </div>
        <Link to="/vehicules/nouveau" className="bouton bouton--principal">
          + Ajouter un véhicule
        </Link>
      </div>

      {chargement && <div className="chargement">Chargement des véhicules...</div>}

      {!chargement && erreur && <div className="alerte alerte--erreur">{erreur}</div>}

      {!chargement && !erreur && vehicules.length === 0 && (
        <div className="etat-vide carte">
          <p style={{ marginBottom: 16 }}>Vous n'avez encore aucun véhicule enregistré.</p>
          <Link to="/vehicules/nouveau" className="bouton bouton--principal">
            Ajouter mon premier véhicule
          </Link>
        </div>
      )}

      {!chargement && !erreur && vehicules.length > 0 && (
        <div className="grille-vehicules">
          {vehicules.map((vehicule) => (
            <FicheVehicule
              key={vehicule.id}
              vehicule={vehicule}
              onSupprimer={gererSuppression}
              onReactiver={gererReactivation}
            />
          ))}
        </div>
      )}
    </AppLayout>
  );
}
