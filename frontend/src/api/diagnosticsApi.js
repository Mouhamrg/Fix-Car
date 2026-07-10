import client from "./axiosClient";

function extraireListe(data) {
  return Array.isArray(data) ? data : data.results;
}

export async function listerDiagnostics() {
  const { data } = await client.get("/diagnostics/");
  return extraireListe(data);
}

export async function obtenirDiagnostic(id) {
  const { data } = await client.get(`/diagnostics/${id}/`);
  return data;
}

export async function creerDiagnostic(donnees) {
  const { data } = await client.post("/diagnostics/", donnees);
  return data;
}

export async function modifierDiagnostic(id, donnees) {
  const { data } = await client.patch(`/diagnostics/${id}/`, donnees);
  return data;
}

export async function validerDiagnostic(id) {
  const { data } = await client.post(`/diagnostics/${id}/valider/`);
  return data;
}

export async function refuserDiagnostic(id, commentaire_client = "") {
  const { data } = await client.post(`/diagnostics/${id}/refuser/`, { commentaire_client });
  return data;
}
