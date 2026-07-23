import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { seConnecter, seDeconnecter } from "../api/authApi";
import { obtenirProfil } from "../api/comptesApi";
import { stockageJetons } from "../api/axiosClient";

const ContexteAuth = createContext(null);

export function AuthProvider({ children }) {
  const [utilisateur, setUtilisateur] = useState(null);
  const [initialisation, setInitialisation] = useState(true);

  useEffect(() => {
    async function restaurerSession() {
      const access = stockageJetons.obtenirAccess();
      if (!access) {
        setInitialisation(false);
        return;
      }
      try {
        const profil = await obtenirProfil();
        setUtilisateur(profil);
      } catch {
        stockageJetons.effacer();
        setUtilisateur(null);
      } finally {
        setInitialisation(false);
      }
    }
    restaurerSession();
  }, []);

  const connexion = useCallback(async (username, password) => {
    await seConnecter(username, password);
    // On repasse par /comptes/profil/ pour avoir une forme de données
    // identique, que la session vienne d'un login ou d'un rechargement.
    const profil = await obtenirProfil();
    setUtilisateur(profil);
    return profil;
  }, []);

  const deconnexion = useCallback(() => {
    seDeconnecter();
    setUtilisateur(null);
  }, []);

  const majUtilisateur = useCallback((profil) => {
    setUtilisateur(profil);
  }, []);

  return (
    <ContexteAuth.Provider
      value={{ utilisateur, initialisation, connexion, deconnexion, majUtilisateur }}
    >
      {children}
    </ContexteAuth.Provider>
  );
}

export function useAuth() {
  const contexte = useContext(ContexteAuth);
  if (!contexte) {
    throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider");
  }
  return contexte;
}
