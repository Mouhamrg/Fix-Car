import client from "./axiosClient";

export async function inscrire(donnees) {
  const { data } = await client.post("/comptes/inscription/", donnees);
  return data;
}

export async function obtenirProfil() {
  const { data } = await client.get("/comptes/profil/");
  return data;
}

export async function modifierProfil(donnees) {
  const { data } = await client.patch("/comptes/profil/", donnees);
  return data;
}

export async function changerMotDePasse(donnees) {
  const { data } = await client.post("/comptes/changer-mot-de-passe/", donnees);
  return data;
}
