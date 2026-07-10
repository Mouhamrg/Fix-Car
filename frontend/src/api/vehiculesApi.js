import client from "./axiosClient";

// Le backend pagine les listes (PageNumberPagination), la réponse
// contient { count, next, previous, results }. On s'assure de renvoyer
// systématiquement un tableau, paginé ou non.
function extraireListe(data) {
  return Array.isArray(data) ? data : data.results;
}

export async function listerVehicules() {
  const { data } = await client.get("/vehicules/");
  return extraireListe(data);
}

export async function obtenirVehicule(id) {
  const { data } = await client.get(`/vehicules/${id}/`);
  return data;
}

export async function creerVehicule(donnees) {
  const { data } = await client.post("/vehicules/", donnees);
  return data;
}

export async function modifierVehicule(id, donnees) {
  const { data } = await client.patch(`/vehicules/${id}/`, donnees);
  return data;
}

export async function supprimerVehicule(id) {
  await client.delete(`/vehicules/${id}/`);
}

export async function reactiverVehicule(id) {
  const { data } = await client.post(`/vehicules/${id}/reactiver/`);
  return data;
}
