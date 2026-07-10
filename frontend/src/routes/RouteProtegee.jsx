import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RouteProtegee() {
  const { utilisateur, initialisation } = useAuth();

  if (initialisation) {
    return <div className="chargement">Vérification de la session...</div>;
  }

  if (!utilisateur) {
    return <Navigate to="/connexion" replace />;
  }

  return <Outlet />;
}
