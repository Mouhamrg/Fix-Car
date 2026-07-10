import axios from "axios";

const URL_API = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const CLE_ACCESS = "fixmycar_access_token";
const CLE_REFRESH = "fixmycar_refresh_token";

export const stockageJetons = {
  obtenirAccess: () => localStorage.getItem(CLE_ACCESS),
  obtenirRefresh: () => localStorage.getItem(CLE_REFRESH),
  enregistrer: (access, refresh) => {
    localStorage.setItem(CLE_ACCESS, access);
    if (refresh) localStorage.setItem(CLE_REFRESH, refresh);
  },
  effacer: () => {
    localStorage.removeItem(CLE_ACCESS);
    localStorage.removeItem(CLE_REFRESH);
  },
};

export const client = axios.create({
  baseURL: URL_API,
});

// Attache automatiquement le token d'accès à chaque requête.
client.interceptors.request.use((config) => {
  const access = stockageJetons.obtenirAccess();
  if (access) {
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

let rafraichissementEnCours = null;

// En cas de 401 (token expiré), tente un unique rafraîchissement puis
// rejoue la requête d'origine. Si le refresh échoue, on déconnecte.
client.interceptors.response.use(
  (reponse) => reponse,
  async (erreur) => {
    const requeteOriginale = erreur.config;
    const estErreur401 = erreur.response && erreur.response.status === 401;
    const urlAuth = requeteOriginale?.url?.includes("/auth/");

    if (!estErreur401 || urlAuth || requeteOriginale._dejaTentee) {
      return Promise.reject(erreur);
    }
    requeteOriginale._dejaTentee = true;

    const refresh = stockageJetons.obtenirRefresh();
    if (!refresh) {
      stockageJetons.effacer();
      return Promise.reject(erreur);
    }

    try {
      if (!rafraichissementEnCours) {
        rafraichissementEnCours = axios
          .post(`${URL_API}/auth/rafraichir/`, { refresh })
          .then((reponse) => {
            stockageJetons.enregistrer(reponse.data.access, refresh);
            return reponse.data.access;
          })
          .finally(() => {
            rafraichissementEnCours = null;
          });
      }
      const nouvelAccess = await rafraichissementEnCours;
      requeteOriginale.headers.Authorization = `Bearer ${nouvelAccess}`;
      return client(requeteOriginale);
    } catch (erreurRafraichissement) {
      stockageJetons.effacer();
      return Promise.reject(erreurRafraichissement);
    }
  }
);

export default client;
