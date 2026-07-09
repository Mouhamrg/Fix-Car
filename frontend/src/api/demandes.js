import api from './client.js'

export async function listDemandes() {
  const { data } = await api.get('/api/demandes/')
  return data
}

export async function createDemande(demande) {
  const { data } = await api.post('/api/demandes/', demande)
  return data
}

export async function updateDemande(id, demande) {
  const { data } = await api.put(`/api/demandes/${id}/`, demande)
  return data
}

export async function deleteDemande(id) {
  await api.delete(`/api/demandes/${id}/`)
}
