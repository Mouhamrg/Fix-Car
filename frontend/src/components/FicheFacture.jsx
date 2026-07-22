import { useState } from "react";
import { METHODES, LIBELLES_STATUT_FACTURE } from "../constants/paiementChoix";

const CLASSES_STATUT = {
  en_attente: "badge-statut--attente",
  payee: "badge-statut--traitement",
  annulee: "badge-statut--annulee",
};

export default function FicheFacture({ facture, peutPayer, onPayer }) {
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [montant, setMontant] = useState(facture.solde_du);
  const [methode, setMethode] = useState("carte");
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const estPayee = facture.statut === "payee";

  async function gererSoumission(evenement) {
    evenement.preventDefault();
    setEnvoi(true);
    setErreur("");
    try {
      await onPayer(facture.id, { facture: facture.id, montant: Number(montant), methode });
      setFormulaireOuvert(false);
    } catch (e) {
      setErreur(e?.response?.data?.montant || e?.response?.data?.facture || "Le paiement a échoué.");
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <article className="carte" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h3 style={{ margin: 0 }}>{facture.demande_titre}</h3>
          <p style={{ margin: 0, color: "var(--muted, #666)" }}>{facture.client_nom}</p>
        </div>
        <span className={`badge-statut ${CLASSES_STATUT[facture.statut] || ""}`}>
          {LIBELLES_STATUT_FACTURE[facture.statut] || facture.statut}
        </span>
      </div>

      <dl className="fiche-vehicule__meta" style={{ margin: 0 }}>
        <div>
          <dt>Montant</dt>
          <dd>{Number(facture.montant).toFixed(2)} $</dd>
        </div>
        <div>
          <dt>Solde dû</dt>
          <dd>{Number(facture.solde_du).toFixed(2)} $</dd>
        </div>
      </dl>

      {peutPayer && !estPayee && (
        <div>
          {!formulaireOuvert ? (
            <button
              type="button"
              className="bouton bouton--principal"
              onClick={() => setFormulaireOuvert(true)}
            >
              Payer
            </button>
          ) : (
            <form className="formulaire" onSubmit={gererSoumission} style={{ gap: 8 }}>
              {erreur && <div className="alerte alerte--erreur">{erreur}</div>}
              <div className="champ">
                <label htmlFor={`montant-${facture.id}`}>Montant</label>
                <input
                  id={`montant-${facture.id}`}
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={montant}
                  onChange={(e) => setMontant(e.target.value)}
                  required
                />
              </div>
              <div className="champ">
                <label htmlFor={`methode-${facture.id}`}>Méthode</label>
                <select
                  id={`methode-${facture.id}`}
                  value={methode}
                  onChange={(e) => setMethode(e.target.value)}
                >
                  {METHODES.map((option) => (
                    <option key={option.valeur} value={option.valeur}>
                      {option.libelle}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button type="submit" className="bouton bouton--principal" disabled={envoi}>
                  {envoi ? "Paiement..." : "Confirmer le paiement"}
                </button>
                <button
                  type="button"
                  className="bouton bouton--discret"
                  onClick={() => setFormulaireOuvert(false)}
                >
                  Annuler
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </article>
  );
}
