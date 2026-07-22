import client from "./client";

function extraireListe(data) {
  return Array.isArray(data) ? data : data.results;
}

export async function listerFactures() {
  const { data } = await client.get("/api/factures/");
  return extraireListe(data);
}

export async function creerFacture(donnees) {
  const { data } = await client.post("/api/factures/", donnees);
  return data;
}

export async function creerPaiement(donnees) {
  const { data } = await client.post("/api/paiements/", donnees);
  return data;
}
