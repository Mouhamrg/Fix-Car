import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { creerDemande, modifierDemande, obtenirDemande } from "../api/demandesApi";
import { listerVehicules } from "../api/vehiculesApi";
import { extraireErreurs } from "../utils/erreurs";
import Champ from "../components/Champ";

export default function PageFormulaireDemande() {
  const { id } = useParams();
  const modeEdition = Boolean(id);
  const navigate = useNavigate();

  const [vehicules, setVehicules] = useState([]);
  const [valeurs, setValeurs] = useState({
    vehicule: "",
    titre: "",
    description_probleme: "",
  });
  const [modifiable, setModifiable] = useState(true);
  const [erreurs, setErreurs] = useState({ champs: {}, generale: "" });
  const [chargement, setChargement] = useState(true);
  const [enregistrement, setEnregistrement] = useState(false);

  useEffect(() => {
    async function initialiser() {
      try {
        const listeVehicules = await listerVehicules();
        const vehiculesActifs = listeVehicules.filter((v) => v.actif);
        setVehicules(vehiculesActifs);

        if (modeEdition) {
          const demande = await obtenirDemande(id);
          setValeurs({
            vehicule: demande.vehicule,
            titre: demande.titre,
            description_probleme: demande.description_probleme,
          });
          setModifiable(demande.modifiable);
        } else if (vehiculesActifs.length > 0) {
          setValeurs((precedent) => ({ ...precedent, vehicule: vehiculesActifs[0].id }));
        }
      } catch {
        setErreurs({ champs: {}, generale: "Impossible de charger les données nécessaires." });
      } finally {
        setChargement(false);
      }
    }
    initialiser();
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
      if (modeEdition) {
        await modifierDemande(id, {
          titre: valeurs.titre,
          description_probleme: valeurs.description_probleme,
        });
      } else {
        await creerDemande({
          vehicule: Number(valeurs.vehicule),
          titre: valeurs.titre,
          description_probleme: valeurs.description_probleme,
        });
      }
      navigate("/demandes");
    } catch (erreur) {
      setErreurs(extraireErreurs(erreur));
    } finally {
      setEnregistrement(false);
    }
  }

  if (chargement) {
    return <div className="chargement">Chargement...</div>;
  }

  if (!modeEdition && vehicules.length === 0) {
    return (
      <div className="carte etat-vide">
        <p style={{ marginBottom: 16 }}>
          Vous devez avoir au moins un véhicule actif pour soumettre une demande de réparation.
        </p>
        <button type="button" className="bouton bouton--principal" onClick={() => navigate("/vehicules/nouveau")}>
          Ajouter un véhicule
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="entete-page">
        <h1>{modeEdition ? "Modifier la demande" : "Nouvelle demande de réparation"}</h1>
      </div>

      <div className="carte" style={{ maxWidth: 640 }}>
        {erreurs.generale && (
          <div className="alerte alerte--erreur" style={{ marginBottom: 16 }}>
            {erreurs.generale}
          </div>
        )}

        {modeEdition && !modifiable && (
          <div className="alerte alerte--erreur" style={{ marginBottom: 16 }}>
            Cette demande est déjà prise en charge par l'atelier et ne peut plus être modifiée.
          </div>
        )}

        <form className="formulaire" onSubmit={gererSoumission}>
          <Champ
            label="Véhicule concerné"
            name="vehicule"
            as="select"
            options={vehicules.map((v) => ({
              valeur: v.id,
              libelle: `${v.marque} ${v.modele} — ${v.plaque_immatriculation}`,
            }))}
            value={valeurs.vehicule}
            onChange={gererChangement}
            erreur={erreurs.champs.vehicule}
            disabled={modeEdition}
            required
          />

          <Champ
            label="Titre du problème"
            name="titre"
            value={valeurs.titre}
            onChange={gererChangement}
            erreur={erreurs.champs.titre}
            aide="Ex: Bruit anormal au freinage"
            disabled={modeEdition && !modifiable}
            required
          />

          <div className="champ">
            <label htmlFor="description_probleme">Description du problème *</label>
            <textarea
              id="description_probleme"
              name="description_probleme"
              rows={5}
              value={valeurs.description_probleme}
              onChange={gererChangement}
              disabled={modeEdition && !modifiable}
              required
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--line)",
                borderRadius: "var(--radius-sm)",
                padding: "10px 12px",
                color: "var(--ink)",
                fontFamily: "var(--font-body)",
                fontSize: 14,
                resize: "vertical",
              }}
            />
            {erreurs.champs.description_probleme && (
              <span className="message-erreur-champ">{erreurs.champs.description_probleme}</span>
            )}
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            {(!modeEdition || modifiable) && (
              <button type="submit" className="bouton bouton--principal" disabled={enregistrement}>
                {enregistrement ? "Enregistrement..." : modeEdition ? "Enregistrer" : "Soumettre la demande"}
              </button>
            )}
            <button type="button" className="bouton bouton--discret" onClick={() => navigate("/demandes")}>
              {modeEdition && !modifiable ? "Retour" : "Annuler"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
