import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { inscrire } from "../api/comptesApi";
import { extraireErreurs } from "../utils/erreurs";
import Champ from "../components/Champ";

const VALEURS_INITIALES = {
  username: "",
  email: "",
  password: "",
  password2: "",
  first_name: "",
  last_name: "",
  telephone: "",
  code_postal: "",
};

export default function PageInscription() {
  const navigate = useNavigate();
  const [valeurs, setValeurs] = useState(VALEURS_INITIALES);
  const [erreurs, setErreurs] = useState({ champs: {}, generale: "" });
  const [enCours, setEnCours] = useState(false);

  function gererChangement(evenement) {
    const { name, value } = evenement.target;
    setValeurs((precedent) => ({ ...precedent, [name]: value }));
  }

  async function gererSoumission(evenement) {
    evenement.preventDefault();
    setEnCours(true);
    setErreurs({ champs: {}, generale: "" });
    try {
      await inscrire(valeurs);
      navigate("/connexion", {
        state: { messageSucces: "Compte créé avec succès. Vous pouvez maintenant vous connecter." },
      });
    } catch (erreur) {
      setErreurs(extraireErreurs(erreur));
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="carte carte-etroite" style={{ maxWidth: 560 }}>
      <h1 style={{ marginBottom: 6 }}>Créer un compte</h1>
      <p style={{ marginBottom: 20 }}>Rejoignez FixMyCar pour gérer vos véhicules et vos rendez-vous.</p>

      {erreurs.generale && (
        <div className="alerte alerte--erreur" style={{ marginBottom: 16 }}>
          {erreurs.generale}
        </div>
      )}

      <form className="formulaire" onSubmit={gererSoumission}>
        <div className="grille-champs">
          <Champ
            label="Prénom"
            name="first_name"
            value={valeurs.first_name}
            onChange={gererChangement}
            erreur={erreurs.champs.first_name}
          />
          <Champ
            label="Nom"
            name="last_name"
            value={valeurs.last_name}
            onChange={gererChangement}
            erreur={erreurs.champs.last_name}
          />
        </div>

        <Champ
          label="Nom d'utilisateur"
          name="username"
          value={valeurs.username}
          onChange={gererChangement}
          erreur={erreurs.champs.username}
          required
        />
        <Champ
          label="Courriel"
          name="email"
          type="email"
          value={valeurs.email}
          onChange={gererChangement}
          erreur={erreurs.champs.email}
          required
        />

        <div className="grille-champs">
          <Champ
            label="Mot de passe"
            name="password"
            type="password"
            value={valeurs.password}
            onChange={gererChangement}
            erreur={erreurs.champs.password}
            required
          />
          <Champ
            label="Confirmer le mot de passe"
            name="password2"
            type="password"
            value={valeurs.password2}
            onChange={gererChangement}
            erreur={erreurs.champs.password2}
            required
          />
        </div>

        <div className="grille-champs">
          <Champ
            label="Téléphone"
            name="telephone"
            value={valeurs.telephone}
            onChange={gererChangement}
            erreur={erreurs.champs.telephone}
            aide="Ex: 514-123-4567"
          />
          <Champ
            label="Code postal"
            name="code_postal"
            value={valeurs.code_postal}
            onChange={gererChangement}
            erreur={erreurs.champs.code_postal}
            aide="Ex: H2X 1Y6"
          />
        </div>

        <button type="submit" className="bouton bouton--principal bouton--pleine-largeur" disabled={enCours}>
          {enCours ? "Création en cours..." : "Créer mon compte"}
        </button>
      </form>

      <p style={{ marginTop: 20, fontSize: 13 }}>
        Déjà un compte ? <Link to="/connexion">Se connecter</Link>
      </p>
    </div>
  );
}
