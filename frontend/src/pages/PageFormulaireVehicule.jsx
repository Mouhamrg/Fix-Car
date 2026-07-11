import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { creerVehicule, modifierVehicule, obtenirVehicule } from "../api/vehiculesApi";
import { CARBURANTS, CATEGORIES } from "../constants/vehiculeChoix";
import { extraireErreurs } from "../utils/erreurs";
import Champ from "../components/Champ";
import AppLayout from '../components/AppLayout.jsx'


const VALEURS_INITIALES = {
  marque: "",
  modele: "",
  annee: new Date().getFullYear(),
  couleur: "",
  categorie: "PROMENADE",
  plaque_immatriculation: "",
  numero_certificat_immatriculation: "",
  vin: "",
  carburant: "ESSENCE",
  kilometrage: 0,
};

export default function PageFormulaireVehicule() {
  const { id } = useParams();
  const modeEdition = Boolean(id);
  const navigate = useNavigate();

  const [valeurs, setValeurs] = useState(VALEURS_INITIALES);
  const [erreurs, setErreurs] = useState({ champs: {}, generale: "" });
  const [chargement, setChargement] = useState(modeEdition);
  const [enregistrement, setEnregistrement] = useState(false);

  useEffect(() => {
    if (!modeEdition) return;
    obtenirVehicule(id)
      .then((vehicule) => setValeurs({ ...VALEURS_INITIALES, ...vehicule }))
      .catch(() => setErreurs({ champs: {}, generale: "Véhicule introuvable." }))
      .finally(() => setChargement(false));
  }, [id, modeEdition]);

  function gererChangement(evenement) {
    const { name, value } = evenement.target;
    setValeurs((precedent) => ({ ...precedent, [name]: value }));
  }

  async function gererSoumission(evenement) {
    evenement.preventDefault();
    setEnregistrement(true);
    setErreurs({ champs: {}, generale: "" });
    try {
      const donnees = {
        ...valeurs,
        annee: Number(valeurs.annee),
        kilometrage: Number(valeurs.kilometrage),
      };
      if (modeEdition) {
        await modifierVehicule(id, donnees);
      } else {
        await creerVehicule(donnees);
      }
      navigate("/vehicules");
    } catch (erreur) {
      setErreurs(extraireErreurs(erreur));
    } finally {
      setEnregistrement(false);
    }
  }

  if (chargement) {
    return <div className="chargement">Chargement du véhicule...</div>;
  }

  return (
    <AppLayout>
      <div className="entete-page">
        <h1>{modeEdition ? "Modifier le véhicule" : "Ajouter un véhicule"}</h1>
      </div>

      <div className="carte" style={{ maxWidth: 640 }}>
        {erreurs.generale && (
          <div className="alerte alerte--erreur" style={{ marginBottom: 16 }}>
            {erreurs.generale}
          </div>
        )}

        <form className="formulaire" onSubmit={gererSoumission}>
          <div className="grille-champs">
            <Champ
              label="Marque"
              name="marque"
              value={valeurs.marque}
              onChange={gererChangement}
              erreur={erreurs.champs.marque}
              required
            />
            <Champ
              label="Modèle"
              name="modele"
              value={valeurs.modele}
              onChange={gererChangement}
              erreur={erreurs.champs.modele}
              required
            />
          </div>

          <div className="grille-champs">
            <Champ
              label="Année"
              name="annee"
              type="number"
              value={valeurs.annee}
              onChange={gererChangement}
              erreur={erreurs.champs.annee}
              required
            />
            <Champ
              label="Couleur"
              name="couleur"
              value={valeurs.couleur}
              onChange={gererChangement}
              erreur={erreurs.champs.couleur}
            />
          </div>

          <div className="grille-champs">
            <Champ
              label="Catégorie"
              name="categorie"
              as="select"
              options={CATEGORIES}
              value={valeurs.categorie}
              onChange={gererChangement}
              erreur={erreurs.champs.categorie}
            />
            <Champ
              label="Carburant"
              name="carburant"
              as="select"
              options={CARBURANTS}
              value={valeurs.carburant}
              onChange={gererChangement}
              erreur={erreurs.champs.carburant}
            />
          </div>

          <div className="grille-champs">
            <Champ
              label="Plaque d'immatriculation"
              name="plaque_immatriculation"
              value={valeurs.plaque_immatriculation}
              onChange={gererChangement}
              erreur={erreurs.champs.plaque_immatriculation}
              aide="Format SAAQ, ex: ABC 123"
              required
            />
            <Champ
              label="Numéro de certificat (optionnel)"
              name="numero_certificat_immatriculation"
              value={valeurs.numero_certificat_immatriculation || ""}
              onChange={gererChangement}
              erreur={erreurs.champs.numero_certificat_immatriculation}
            />
          </div>

          <div className="grille-champs">
            <Champ
              label="NIV / VIN (optionnel)"
              name="vin"
              value={valeurs.vin || ""}
              onChange={gererChangement}
              erreur={erreurs.champs.vin}
              aide="17 caractères alphanumériques"
            />
            <Champ
              label="Kilométrage"
              name="kilometrage"
              type="number"
              value={valeurs.kilometrage}
              onChange={gererChangement}
              erreur={erreurs.champs.kilometrage}
              required
            />
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button type="submit" className="bouton bouton--principal" disabled={enregistrement}>
              {enregistrement ? "Enregistrement..." : modeEdition ? "Enregistrer" : "Ajouter le véhicule"}
            </button>
            <button
              type="button"
              className="bouton bouton--discret"
              onClick={() => navigate("/api/vehicules")}
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
