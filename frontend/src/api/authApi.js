import client, { stockageJetons } from "./axiosClient";

export async function seConnecter(username, password) {
  const { data } = await client.post("/auth/connexion/", { username, password });
  stockageJetons.enregistrer(data.access, data.refresh);
  return data.user;
}

export function seDeconnecter() {
  stockageJetons.effacer();
}
