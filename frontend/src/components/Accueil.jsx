import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { libelleRole, estMecanicien } from "../utils/roles";

export default function Accueil() {
  const { utilisateur } = useAuth();
 

  if (estMecanicien(utilisateur)) {
    return <Navigate to="/affectations" replace />;
  }

  return <Navigate to="/vehicules" replace />;
}