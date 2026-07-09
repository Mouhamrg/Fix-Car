import client from "./client";

export async function listerRendezVous() {
    const { data } = await client.get("/api/rendez-vous/");
    return data;
}

export async function creerRendezVous(donnees) {
    const { data } = await client.post("/api/rendez-vous/", donnees);
    return data;
}

export async function modifierRendezVous(id, donnees) {
    const { data } = await client.patch(`/api/rendez-vous/${id}/`, donnees);
    return data;
}

export async function annulerRendezVous(id) {
    const { data } = await client.post(`/api/rendez-vous/${id}/annuler/`);
    return data;
}