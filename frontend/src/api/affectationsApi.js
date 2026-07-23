import api from "./client";

function extraireListe(data) {
  return Array.isArray(data) ? data : data.results;
}

export async function listerAffectations() {
  const { data } = await api.get('/api/affectations/');
  return extraireListe(data);
}

export async function obtenirAffectation(id) {
  const { data } = await api.get(`/api/affectations/${id}/`);
  return data;
}

export async function creerAffectation(donnees) {
  const { data } = await api.post("/api/affectations/", donnees);
  return data;
}

export async function modifierAffectation(id, donnees) {
  const { data } = await api.patch(`/api/affectations/${id}/`, donnees);
  return data;
}

export async function listerMecaniciensDisponibles() {
  const { data } = await api.get("/api/affectations/mecaniciens-disponibles/");
  return data;
}

export async function refuserAffectation(id) {
  const { data } = await api.post(`/api/affectations/${id}/refuser/`);
  return data;
}
