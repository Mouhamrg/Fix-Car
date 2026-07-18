import { createContext, useEffect, useState } from "react";
import api from '../api/client.js'

export const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);

 useEffect(() => {

    api.get("/api/me/")
      .then((response) => {

        console.log("Utilisateur reçu :", response.data);

        setUser(response.data);

      })
      .catch((error) => {

        console.error(
          "Erreur récupération utilisateur :",
          error
        );

      });

  }, []);



  return (
    <UserContext.Provider value={user}>
      {children}
    </UserContext.Provider>
  );
}

export const LIBELLES_ROLE = {
  CLIENT: "Client",
  MECANICIEN: "Mécanicien",
  GESTIONNAIRE: "Gestionnaire",
};

export function libelleRole(utilisateur) {
  if (!utilisateur) return "";
  if (utilisateur.est_administrateur) return "Administrateur";
  return LIBELLES_ROLE[utilisateur.role] || utilisateur.role;
}

export function peutGererAffectations(utilisateur) {
  return Boolean(utilisateur?.est_administrateur || utilisateur?.role === "GESTIONNAIRE");
}

export function peutVoirAffectations(utilisateur) {
  return Boolean(
    utilisateur?.est_administrateur ||
      utilisateur?.role === "GESTIONNAIRE" ||
      utilisateur?.role === "MECANICIEN"
  );
}

export function estMecanicien(utilisateur) {
  return utilisateur?.role === "MECANICIEN";
}

export function estClient(utilisateur) {
  return utilisateur?.role === "CLIENT";
}
