import { useEffect, useState } from "react";
import { modifierProfil, changerMotDePasse, obtenirProfil } from "../api/comptesApi";
import { useAuth } from "../context/AuthContext";
import { extraireErreurs } from "../utils/erreurs";
import { libelleRole } from "../utils/roles";
import Champ from "../components/Champ";

export default function PageProfil() {
  const { majUtilisateur } = useAuth();

  const [profil, setProfil] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreursProfil, setErreursProfil] = useState({ champs: {}, generale: "" });
  const [succesProfil, setSuccesProfil] = useState("");
  const [enregistrementProfil, setEnregistrementProfil] = useState(false);

  const [motsDePasse, setMotsDePasse] = useState({
    ancien_mot_de_passe: "",
    nouveau_mot_de_passe: "",
    nouveau_mot_de_passe2: "",
  });
  const [erreursMdp, setErreursMdp] = useState({ champs: {}, generale: "" });
  const [succesMdp, setSuccesMdp] = useState("");
  const [enregistrementMdp, setEnregistrementMdp] = useState(false);

  useEffect(() => {
    obtenirProfil()
      .then(setProfil)
      .finally(() => setChargement(false));
  }, []);

  function gererChangementProfil(evenement) {
    const { name, value } = evenement.target;
    setProfil((precedent) => ({ ...precedent, [name]: value }));
  }

  async function gererSoumissionProfil(evenement) {
    evenement.preventDefault();
    setEnregistrementProfil(true);
    setErreursProfil({ champs: {}, generale: "" });
    setSuccesProfil("");
    try {
      const misAJour = await modifierProfil(profil);
      setProfil(misAJour);
      majUtilisateur(misAJour);
      setSuccesProfil("Profil mis à jour avec succès.");
    } catch (erreur) {
      setErreursProfil(extraireErreurs(erreur));
    } finally {
      setEnregistrementProfil(false);
    }
  }

  function gererChangementMdp(evenement) {
    const { name, value } = evenement.target;
    setMotsDePasse((precedent) => ({ ...precedent, [name]: value }));
  }

  async function gererSoumissionMdp(evenement) {
    evenement.preventDefault();
    setEnregistrementMdp(true);
    setErreursMdp({ champs: {}, generale: "" });
    setSuccesMdp("");
    try {
      await changerMotDePasse(motsDePasse);
      setSuccesMdp("Mot de passe modifié avec succès.");
      setMotsDePasse({
        ancien_mot_de_passe: "",
        nouveau_mot_de_passe: "",
        nouveau_mot_de_passe2: "",
      });
    } catch (erreur) {
      setErreursMdp(extraireErreurs(erreur));
    } finally {
      setEnregistrementMdp(false);
    }
  }

  if (chargement || !profil) {
    return <div className="chargement">Chargement du profil...</div>;
  }

  return (
    <>
      <div className="entete-page">
        <div>
          <h1>Mon profil</h1>
          <p>{libelleRole(profil)}</p>
        </div>
      </div>

      <div className="carte" style={{ maxWidth: 640, marginBottom: 24 }}>
        <h2 style={{ marginBottom: 18 }}>Informations personnelles</h2>

        {succesProfil && <div className="alerte alerte--succes" style={{ marginBottom: 16 }}>{succesProfil}</div>}
        {erreursProfil.generale && (
          <div className="alerte alerte--erreur" style={{ marginBottom: 16 }}>
            {erreursProfil.generale}
          </div>
        )}

        <form className="formulaire" onSubmit={gererSoumissionProfil}>
          <Champ label="Nom d'utilisateur" name="username" value={profil.username} disabled readOnly />

          <div className="grille-champs">
            <Champ
              label="Prénom"
              name="first_name"
              value={profil.first_name || ""}
              onChange={gererChangementProfil}
              erreur={erreursProfil.champs.first_name}
            />
            <Champ
              label="Nom"
              name="last_name"
              value={profil.last_name || ""}
              onChange={gererChangementProfil}
              erreur={erreursProfil.champs.last_name}
            />
          </div>

          <Champ
            label="Courriel"
            name="email"
            type="email"
            value={profil.email}
            onChange={gererChangementProfil}
            erreur={erreursProfil.champs.email}
          />

          <div className="grille-champs">
            <Champ
              label="Téléphone"
              name="telephone"
              value={profil.telephone || ""}
              onChange={gererChangementProfil}
              erreur={erreursProfil.champs.telephone}
            />
            <Champ
              label="Code postal"
              name="code_postal"
              value={profil.code_postal || ""}
              onChange={gererChangementProfil}
              erreur={erreursProfil.champs.code_postal}
            />
          </div>

          <div className="grille-champs">
            <Champ
              label="Adresse"
              name="adresse"
              value={profil.adresse || ""}
              onChange={gererChangementProfil}
              erreur={erreursProfil.champs.adresse}
            />
            <Champ
              label="Ville"
              name="ville"
              value={profil.ville || ""}
              onChange={gererChangementProfil}
              erreur={erreursProfil.champs.ville}
            />
          </div>

          {profil.role === "MECANICIEN" && (
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 13,
                color: "var(--ink-muted)",
              }}
            >
              <input
                type="checkbox"
                name="disponible"
                checked={Boolean(profil.disponible)}
                onChange={(e) =>
                  setProfil((precedent) => ({ ...precedent, disponible: e.target.checked }))
                }
              />
              Je suis disponible pour recevoir de nouvelles réparations
            </label>
          )}

          <button type="submit" className="bouton bouton--principal" disabled={enregistrementProfil}>
            {enregistrementProfil ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
        </form>
      </div>

      <div className="carte" style={{ maxWidth: 640 }}>
        <h2 style={{ marginBottom: 18 }}>Changer de mot de passe</h2>

        {succesMdp && <div className="alerte alerte--succes" style={{ marginBottom: 16 }}>{succesMdp}</div>}
        {erreursMdp.generale && (
          <div className="alerte alerte--erreur" style={{ marginBottom: 16 }}>
            {erreursMdp.generale}
          </div>
        )}

        <form className="formulaire" onSubmit={gererSoumissionMdp}>
          <Champ
            label="Mot de passe actuel"
            name="ancien_mot_de_passe"
            type="password"
            value={motsDePasse.ancien_mot_de_passe}
            onChange={gererChangementMdp}
            erreur={erreursMdp.champs.ancien_mot_de_passe}
            required
          />
          <div className="grille-champs">
            <Champ
              label="Nouveau mot de passe"
              name="nouveau_mot_de_passe"
              type="password"
              value={motsDePasse.nouveau_mot_de_passe}
              onChange={gererChangementMdp}
              erreur={erreursMdp.champs.nouveau_mot_de_passe}
              required
            />
            <Champ
              label="Confirmer le nouveau mot de passe"
              name="nouveau_mot_de_passe2"
              type="password"
              value={motsDePasse.nouveau_mot_de_passe2}
              onChange={gererChangementMdp}
              erreur={erreursMdp.champs.nouveau_mot_de_passe2}
              required
            />
          </div>
          <button type="submit" className="bouton bouton--discret" disabled={enregistrementMdp}>
            {enregistrementMdp ? "Modification..." : "Changer le mot de passe"}
          </button>
        </form>
      </div>
    </>
  );
}
