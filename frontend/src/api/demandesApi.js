import client from "./axiosClient";

function extraireListe(data) {
  return Array.isArray(data) ? data : data.results;
}

export async function listerDemandes() {
  const { data } = await client.get("/demandes-reparation/");
  return extraireListe(data);
}

export async function obtenirDemande(id) {
  const { data } = await client.get(`/demandes-reparation/${id}/`);
  return data;
}

export async function creerDemande(donnees) {
  const { data } = await client.post("/demandes-reparation/", donnees);
  return data;
}

export async function modifierDemande(id, donnees) {
  const { data } = await client.patch(`/demandes-reparation/${id}/`, donnees);
  return data;
}

export async function annulerDemande(id) {
  const { data } = await client.post(`/demandes-reparation/${id}/annuler/`);
  return data;
}
