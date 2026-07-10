import client from "./axiosClient";

function extraireListe(data) {
  return Array.isArray(data) ? data : data.results;
}

export async function listerAffectations() {
  const { data } = await client.get("/affectations/");
  return extraireListe(data);
}

export async function obtenirAffectation(id) {
  const { data } = await client.get(`/affectations/${id}/`);
  return data;
}

export async function creerAffectation(donnees) {
  const { data } = await client.post("/affectations/", donnees);
  return data;
}

export async function modifierAffectation(id, donnees) {
  const { data } = await client.patch(`/affectations/${id}/`, donnees);
  return data;
}

export async function listerMecaniciensDisponibles() {
  const { data } = await client.get("/affectations/mecaniciens-disponibles/");
  return data;
}

export async function refuserAffectation(id) {
  const { data } = await client.post(`/affectations/${id}/refuser/`);
  return data;
}
