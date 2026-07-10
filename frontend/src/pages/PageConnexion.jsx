import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { extraireErreurs } from "../utils/erreurs";
import Champ from "../components/Champ";

export default function PageConnexion() {
  const { connexion } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const messageSucces = location.state?.messageSucces;

  const [identifiants, setIdentifiants] = useState({ username: "", password: "" });
  const [erreurs, setErreurs] = useState({ champs: {}, generale: "" });
  const [enCours, setEnCours] = useState(false);

  function gererChangement(evenement) {
    const { name, value } = evenement.target;
    setIdentifiants((precedent) => ({ ...precedent, [name]: value }));
  }

  async function gererSoumission(evenement) {
    evenement.preventDefault();
    setEnCours(true);
    setErreurs({ champs: {}, generale: "" });
    try {
      await connexion(identifiants.username, identifiants.password);
      navigate("/vehicules");
    } catch (erreur) {
      const estAuthEchouee = erreur?.response?.status === 401;
      setErreurs({
        champs: {},
        generale: estAuthEchouee
          ? "Nom d'utilisateur ou mot de passe incorrect."
          : extraireErreurs(erreur).generale,
      });
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="carte carte-etroite">
      <h1 style={{ marginBottom: 6 }}>Connexion</h1>
      <p style={{ marginBottom: 20 }}>Accédez à votre espace FixMyCar.</p>

      {messageSucces && <div className="alerte alerte--succes" style={{ marginBottom: 16 }}>{messageSucces}</div>}
      {erreurs.generale && (
        <div className="alerte alerte--erreur" style={{ marginBottom: 16 }}>
          {erreurs.generale}
        </div>
      )}

      <form className="formulaire" onSubmit={gererSoumission}>
        <Champ
          label="Nom d'utilisateur"
          name="username"
          value={identifiants.username}
          onChange={gererChangement}
          required
          autoComplete="username"
        />
        <Champ
          label="Mot de passe"
          name="password"
          type="password"
          value={identifiants.password}
          onChange={gererChangement}
          required
          autoComplete="current-password"
        />
        <button type="submit" className="bouton bouton--principal bouton--pleine-largeur" disabled={enCours}>
          {enCours ? "Connexion en cours..." : "Se connecter"}
        </button>
      </form>

      <p style={{ marginTop: 20, fontSize: 13 }}>
        Pas encore de compte ? <Link to="/inscription">Créer un compte</Link>
      </p>
    </div>
  );
}
