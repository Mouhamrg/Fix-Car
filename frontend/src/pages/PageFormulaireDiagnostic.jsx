import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MultiSelect } from "@mantine/core";
import {
  creerDiagnostic,
  modifierDiagnostic,
  obtenirDiagnostic,
} from "../api/diagnosticsApi";
import { obtenirDemande } from "../api/demandes";
import { listTypesReparations } from "../api/typesReparations.js";
import { extraireErreurs } from "../utils/erreurs";
import { libelleStatutDevis } from "../constants/diagnosticsChoix";
import Champ from "../components/Champ";
import AppLayout from '../components/AppLayout.jsx'


export default function PageFormulaireDiagnostic() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const demandeId = searchParams.get("demande");
  const modeEdition = Boolean(id);
  const navigate = useNavigate();

  const [demande, setDemande] = useState(null);
  const [diagnostic, setDiagnostic] = useState(null);
  const [valeurs, setValeurs] = useState({
    notes_techniques: "",
    travaux_a_effectuer: "",
    cout_estime: "",
    types_reparation: [],
  });
  const [erreurs, setErreurs] = useState({ champs: {}, generale: "" });
  const [chargement, setChargement] = useState(true);
  const [enregistrement, setEnregistrement] = useState(false);

  const { data: typesReparations } = useQuery({
    queryKey: ["types-reparations"],
    queryFn: listTypesReparations,
  });

  useEffect(() => {
    async function initialiser() {
      try {
        if (modeEdition) {
          const data = await obtenirDiagnostic(id);
          setDiagnostic(data);
          setValeurs({
            notes_techniques: data.notes_techniques,
            travaux_a_effectuer: data.travaux_a_effectuer,
            cout_estime: data.cout_estime,
            types_reparation: (data.types_reparation ?? []).map(String),
          });
        } else if (demandeId) {
          const d = await obtenirDemande(demandeId);
          setDemande(d);
        }
      } catch {
        setErreurs({ champs: {}, generale: "Impossible de charger les données nécessaires." });
      } finally {
        setChargement(false);
      }
    }
    initialiser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, modeEdition, demandeId]);

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
        cout_estime: Number(valeurs.cout_estime),
        types_reparation: valeurs.types_reparation.map(Number),
      };
      if (modeEdition) {
        await modifierDiagnostic(id, donnees);
      } else {
        await creerDiagnostic({ demande: Number(demandeId), ...donnees });
      }
      navigate("/demandes", {
        state: {
          message: modeEdition
            ? "Devis révisé renvoyé au client."
            : "Devis envoyé au client.",
        },
      });
    } catch (erreur) {
      const erreursExtraites = extraireErreurs(erreur);
      // "demande" n'a pas de champ visible dans ce formulaire (dérivé
      // de l'URL) : sans ceci, une erreur dessus (ex. mécanicien non
      // assigné) resterait invisible pour l'utilisateur.
      if (!erreursExtraites.generale && erreursExtraites.champs.demande) {
        erreursExtraites.generale = erreursExtraites.champs.demande;
      }
      setErreurs(erreursExtraites);
    } finally {
      setEnregistrement(false);
    }
  }

  if (chargement) {
    return <div className="chargement">Chargement...</div>;
  }

  const verrouille = modeEdition && diagnostic?.statut === "ACCEPTE";

  return (
    <AppLayout>
      <div className="entete-page">
        <h1>{modeEdition ? "Diagnostic et devis" : "Nouveau diagnostic"} </h1>
      </div>

      <div className="carte" style={{ maxWidth: 640 }}>
        {erreurs.generale && (
          <div className="alerte alerte--erreur" style={{ marginBottom: 16 }}>
            {erreurs.generale}
          </div>
        )}

        {(demande || diagnostic) && (
          <p style={{ marginBottom: 16, fontSize: 13, color: "var(--ink-muted)" }}>
            {modeEdition
              ? `${diagnostic.demande_titre} — ${diagnostic.demande_vehicule_plaque} (client : ${diagnostic.demande_client_nom})`
              : `${demande.titre} — ${demande.vehicule_plaque} (client : ${demande.client_nom})`}
          </p>
        )}

        {modeEdition && diagnostic?.statut === "REFUSE" && (
          <div className="alerte alerte--erreur" style={{ marginBottom: 16 }}>
            Le client a refusé ce devis
            {diagnostic.commentaire_client ? ` : « ${diagnostic.commentaire_client} »` : ""}. Vous
            pouvez réviser les informations ci-dessous et renvoyer le devis.
          </div>
        )}

        {verrouille && (
          <div className="alerte alerte--succes" style={{ marginBottom: 16 }}>
            Ce devis a été accepté par le client — il n'est plus modifiable.
          </div>
        )}

        <form className="formulaire" onSubmit={gererSoumission}>
          <div className="champ">
            <label htmlFor="notes_techniques">Notes techniques *</label>
            <textarea
              id="notes_techniques"
              name="notes_techniques"
              rows={4}
              value={valeurs.notes_techniques}
              onChange={gererChangement}
              disabled={verrouille}
              required
              style={styleTextarea}
            />
            {erreurs.champs.notes_techniques && (
              <span className="message-erreur-champ">{erreurs.champs.notes_techniques}</span>
            )}
          </div>

          <div className="champ">
            <label htmlFor="travaux_a_effectuer">Travaux à effectuer *</label>
            <textarea
              id="travaux_a_effectuer"
              name="travaux_a_effectuer"
              rows={4}
              value={valeurs.travaux_a_effectuer}
              onChange={gererChangement}
              disabled={verrouille}
              required
              style={styleTextarea}
            />
            {erreurs.champs.travaux_a_effectuer && (
              <span className="message-erreur-champ">{erreurs.champs.travaux_a_effectuer}</span>
            )}
          </div>

          <Champ
            label="Coût estimé ($ CAD)"
            name="cout_estime"
            type="number"
            step="0.01"
            min="0"
            value={valeurs.cout_estime}
            onChange={gererChangement}
            erreur={erreurs.champs.cout_estime}
            disabled={verrouille}
            required
          />

          <MultiSelect
            label="Types de réparation préconisés"
            placeholder="Sélectionner un ou plusieurs types"
            data={(typesReparations ?? []).map((type) => ({
              value: String(type.id),
              label: type.nom,
            }))}
            value={valeurs.types_reparation}
            onChange={(valeur) =>
              setValeurs((precedent) => ({ ...precedent, types_reparation: valeur }))
            }
            disabled={verrouille}
            searchable
            clearable
            mt="sm"
          />
          {erreurs.champs.types_reparation && (
            <span className="message-erreur-champ">{erreurs.champs.types_reparation}</span>
          )}

          {modeEdition && diagnostic?.statut && (
            <p className="texte-aide">Statut actuel : {libelleStatutDevis(diagnostic.statut)}</p>
          )}

          <div style={{ display: "flex", gap: 12 }}>
            {!verrouille && (
              <button type="submit" className="bouton bouton--principal" disabled={enregistrement}>
                {enregistrement
                  ? "Enregistrement..."
                  : modeEdition
                  ? "Renvoyer le devis révisé"
                  : "Envoyer le devis au client"}
              </button>
            )}
            <button type="button" className="bouton bouton--discret" onClick={() => navigate("/demandes")}>
              {verrouille ? "Retour" : "Annuler"}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}

const styleTextarea = {
  background: "var(--surface-2)",
  border: "1px solid var(--line)",
  borderRadius: "var(--radius-sm)",
  padding: "10px 12px",
  color: "var(--ink)",
  fontFamily: "var(--font-body)",
  fontSize: 14,
  resize: "vertical",
};
