import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "../components/AppLayout.jsx";
import FicheFacture from "../components/FicheFacture.jsx";
import api from "../api/client.js";
import { listerFactures, creerFacture, creerPaiement } from "../api/paiementsApi";
import { listDemandes } from "../api/demandes";
import { extraireErreurs } from "../utils/erreurs";

const ROLES_STAFF = ["MECANICIEN", "GESTIONNAIRE", "ADMINISTRATEUR"];

export default function PageFactures() {
  const { data: moi } = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await api.get("/api/me/")).data,
  });
  const estStaff = ROLES_STAFF.includes(moi?.role);

  const [factures, setFactures] = useState([]);
  const [demandes, setDemandes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  const [nouvelleFacture, setNouvelleFacture] = useState({ demande: "", montant: "" });
  const [erreursFacture, setErreursFacture] = useState({ champs: {}, generale: "" });
  const [creation, setCreation] = useState(false);

  async function chargerFactures() {
    setChargement(true);
    setErreur("");
    try {
      const donnees = await listerFactures();
      setFactures(donnees);
    } catch {
      setErreur("Impossible de charger les factures pour le moment.");
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    chargerFactures();
  }, []);

  useEffect(() => {
    if (!estStaff) return;
    listDemandes().then((donnees) => setDemandes(Array.isArray(donnees) ? donnees : donnees.results));
  }, [estStaff]);

  async function gererPaiement(_id, donnees) {
    await creerPaiement(donnees);
    await chargerFactures();
  }

  async function gererCreationFacture(evenement) {
    evenement.preventDefault();
    setCreation(true);
    setErreursFacture({ champs: {}, generale: "" });
    try {
      await creerFacture({
        demande: Number(nouvelleFacture.demande),
        montant: nouvelleFacture.montant,
      });
      setNouvelleFacture({ demande: "", montant: "" });
      await chargerFactures();
    } catch (e) {
      setErreursFacture(extraireErreurs(e));
    } finally {
      setCreation(false);
    }
  }

  return (
    <AppLayout>
      <div className="entete-page">
        <div>
          <h1>Factures</h1>
          <p>
            {estStaff
              ? "Émettez des factures et suivez leur paiement."
              : "Consultez et payez vos factures."}
          </p>
        </div>
      </div>

      {estStaff && (
        <div className="carte" style={{ marginBottom: 24, maxWidth: 640 }}>
          <h3 style={{ marginTop: 0 }}>Émettre une facture</h3>
          {erreursFacture.generale && (
            <div className="alerte alerte--erreur">{erreursFacture.generale}</div>
          )}
          <form className="formulaire" onSubmit={gererCreationFacture}>
            <div className="grille-champs">
              <div className="champ">
                <label htmlFor="demande">Demande de réparation</label>
                <select
                  id="demande"
                  value={nouvelleFacture.demande}
                  onChange={(e) => setNouvelleFacture((v) => ({ ...v, demande: e.target.value }))}
                  required
                >
                  <option value="" disabled>
                    Sélectionner une demande
                  </option>
                  {demandes.map((d) => (
                    <option key={d.id} value={d.id}>
                      #{d.id} — {d.titre}
                    </option>
                  ))}
                </select>
                {erreursFacture.champs.demande && (
                  <span className="message-erreur-champ">{erreursFacture.champs.demande}</span>
                )}
              </div>
              <div className="champ">
                <label htmlFor="montant">Montant</label>
                <input
                  id="montant"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={nouvelleFacture.montant}
                  onChange={(e) => setNouvelleFacture((v) => ({ ...v, montant: e.target.value }))}
                  required
                />
                {erreursFacture.champs.montant && (
                  <span className="message-erreur-champ">{erreursFacture.champs.montant}</span>
                )}
              </div>
            </div>
            <button type="submit" className="bouton bouton--principal" disabled={creation}>
              {creation ? "Création..." : "Créer la facture"}
            </button>
          </form>
        </div>
      )}

      {chargement && <div className="chargement">Chargement des factures...</div>}

      {!chargement && erreur && <div className="alerte alerte--erreur">{erreur}</div>}

      {!chargement && !erreur && factures.length === 0 && (
        <div className="etat-vide carte">
          <p>Aucune facture pour le moment.</p>
        </div>
      )}

      {!chargement && !erreur && factures.length > 0 && (
        <div className="grille-vehicules">
          {factures.map((facture) => (
            <FicheFacture
              key={facture.id}
              facture={facture}
              peutPayer={!estStaff}
              onPayer={gererPaiement}
            />
          ))}
        </div>
      )}
    </AppLayout>
  );
}
