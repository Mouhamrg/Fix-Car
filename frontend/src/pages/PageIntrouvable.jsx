import { Link } from "react-router-dom";

export default function PageIntrouvable() {
  return (
    <div className="etat-vide">
      <h1 style={{ marginBottom: 12 }}>Page introuvable</h1>
      <p style={{ marginBottom: 20 }}>Cette page n'existe pas ou a été déplacée.</p>
      <Link to="/vehicules" className="bouton bouton--principal">
        Retour à l'accueil
      </Link>
    </div>
  );
}
