import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  creerAffectation,
  modifierAffectation,
  obtenirAffectation,
  listerMecaniciensDisponibles,
} from "../api/affectationsApi";
import { listerDemandes } from "../api/demandesApi";
import { extraireErreurs } from "../utils/erreurs";
import Champ from "../components/Champ";

export default function PageFormulaireAffectation() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const demandePreselectionnee = searchParams.get("demande");
  const modeEdition = Boolean(id);
  const navigate = useNavigate();

  const [demandesDisponibles, setDemandesDisponibles] = useState([]);
  const [mecaniciens, setMecaniciens] = useState([]);
  const [demandeAffichage, setDemandeAffichage] = useState(null); // pour le mode édition (lecture seule)

  const [valeurs, setValeurs] = useState({
    demande: demandePreselectionnee || "",
    mecanicien: "",
    commentaire: "",
  });
  const [erreurs, setErreurs] = useState({ champs: {}, generale: "" });
  const [chargement, setChargement] = useState(true);
  const [enregistrement, setEnregistrement] = useState(false);

  useEffect(() => {
    async function initialiser() {
      try {
        const listeMecaniciens = await listerMecaniciensDisponibles();
        setMecaniciens(listeMecaniciens);

        if (modeEdition) {
          const affectation = await obtenirAffectation(id);
          setDemandeAffichage(affectation);
          setValeurs({
            demande: affectation.demande,
            mecanicien: affectation.mecanicien,
            commentaire: affectation.commentaire || "",
          });
        } else {
          const demandes = await listerDemandes();
          const eligibles = demandes.filter(
            (d) => d.statut === "EN_ATTENTE" && !d.mecanicien_assigne
          );
          setDemandesDisponibles(eligibles);
          if (!demandePreselectionnee && eligibles.length > 0) {
            setValeurs((precedent) => ({ ...precedent, demande: eligibles[0].id }));
          }
        }
      } catch {
        setErreurs({ champs: {}, generale: "Impossible de charger les données nécessaires." });
      } finally {
        setChargement(false);
      }
    }
    initialiser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        await modifierAffectation(id, {
          mecanicien: Number(valeurs.mecanicien),
          commentaire: valeurs.commentaire,
        });
      } else {
        await creerAffectation({
          demande: Number(valeurs.demande),
          mecanicien: Number(valeurs.mecanicien),
          commentaire: valeurs.commentaire,
        });
      }
      navigate("/affectations");
    } catch (erreur) {
      setErreurs(extraireErreurs(erreur));
    } finally {
      setEnregistrement(false);
    }
  }

  if (chargement) {
    return <div className="chargement">Chargement...</div>;
  }

  if (!modeEdition && demandesDisponibles.length === 0 && !demandePreselectionnee) {
    return (
      <div className="carte etat-vide">
        <p>Aucune demande en attente d'affectation pour le moment.</p>
      </div>
    );
  }

  return (
    <>
      <div className="entete-page">
        <h1>{modeEdition ? "Réaffecter la réparation" : "Affecter une réparation"}</h1>
      </div>

      <div className="carte" style={{ maxWidth: 560 }}>
        {erreurs.generale && (
          <div className="alerte alerte--erreur" style={{ marginBottom: 16 }}>
            {erreurs.generale}
          </div>
        )}

        <form className="formulaire" onSubmit={gererSoumission}>
          {modeEdition ? (
            <div className="champ">
              <label>Demande</label>
              <p style={{ margin: 0, fontSize: 14 }}>
                {demandeAffichage?.demande_titre} — {demandeAffichage?.demande_vehicule_plaque}
              </p>
              <span className="texte-aide">
                Le véhicule/demande d'une affectation ne peut pas être changé.
              </span>
            </div>
          ) : (
            <Champ
              label="Demande de réparation"
              name="demande"
              as="select"
              options={demandesDisponibles.map((d) => ({
                valeur: d.id,
                libelle: `${d.titre} — ${d.vehicule_plaque} (${d.client_nom})`,
              }))}
              value={valeurs.demande}
              onChange={gererChangement}
              erreur={erreurs.champs.demande}
              required
            />
          )}

          <Champ
            label="Mécanicien"
            name="mecanicien"
            as="select"
            options={[
              { valeur: "", libelle: "Sélectionner..." },
              ...mecaniciens.map((m) => ({
                valeur: m.id,
                libelle: `${m.nom_complet} ${m.disponible ? "" : "(indisponible)"}`,
              })),
            ]}
            value={valeurs.mecanicien}
            onChange={gererChangement}
            erreur={erreurs.champs.mecanicien}
            required
          />

          <div className="champ">
            <label htmlFor="commentaire">Note interne (optionnel)</label>
            <textarea
              id="commentaire"
              name="commentaire"
              rows={3}
              value={valeurs.commentaire}
              onChange={gererChangement}
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
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button type="submit" className="bouton bouton--principal" disabled={enregistrement}>
              {enregistrement ? "Enregistrement..." : modeEdition ? "Réaffecter" : "Affecter"}
            </button>
            <button
              type="button"
              className="bouton bouton--discret"
              onClick={() => navigate("/affectations")}
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
