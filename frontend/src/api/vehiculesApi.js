import client from "./client";

// Le backend pagine les listes (PageNumberPagination), la réponse
// contient { count, next, previous, results }. On s'assure de renvoyer
// systématiquement un tableau, paginé ou non.
function extraireListe(data) {
  return Array.isArray(data) ? data : data.results;
}

export async function listerVehicules() {
  const { data } = await client.get("/api/vehicules/");
  return extraireListe(data);
}

export async function obtenirVehicule(id) {
  const { data } = await client.get(`/api/vehicules/${id}/`);
  return data;
}

export async function creerVehicule(donnees) {
  const { data } = await client.post("/api/vehicules/", donnees);
  return data;
}

export async function modifierVehicule(id, donnees) {
  const { data } = await client.patch(`/api/vehicules/${id}/`, donnees);
  return data;
}

export async function supprimerVehicule(id) {
  await client.delete(`/api/vehicules/${id}/`);
}

export async function reactiverVehicule(id) {
  const { data } = await client.post(`/api/vehicules/${id}/reactiver/`);
  return data;
}
