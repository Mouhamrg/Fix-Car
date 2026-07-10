import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { libelleRole, peutVoirAffectations, estClient } from "../utils/roles";

export default function BarreNav() {
  const { utilisateur, deconnexion } = useAuth();
  const navigate = useNavigate();

  function gererDeconnexion() {
    deconnexion();
    navigate("/connexion");
  }

  return (
    <header className="barre-nav">
      <div className="conteneur barre-nav__interieur">
        <Link to="/vehicules" className="marque">
          <span className="marque__pastille" aria-hidden="true" />
          FixMyCar
        </Link>

        <nav className="nav-liens">
          
          <NavLink to="/vehicules" className={({ isActive }) => (isActive ? "actif" : "")}>
            Véhicules
          </NavLink>

          {estClient(utilisateur) && (
            <NavLink to="/demandes" className={({ isActive }) => (isActive ? "actif" : "")}>
              Réparations
            </NavLink>
          )}
          {peutVoirAffectations(utilisateur) && (
            <NavLink to="/affectations" className={({ isActive }) => (isActive ? "actif" : "")}>
              Affectations
            </NavLink>
          )}
          <NavLink to="/profil" className={({ isActive }) => (isActive ? "actif" : "")}>
            Profil
          </NavLink>
        </nav>

        <div className="nav-compte">
          {utilisateur && <span className="badge-role">{libelleRole(utilisateur)}</span>}
          <button type="button" className="bouton bouton--discret" onClick={gererDeconnexion}>
            Déconnexion
          </button>
        </div>
      </div>
    </header>
  );
}
