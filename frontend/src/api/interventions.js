import api from './client.js'

export async function listInterventions() {
  const { data } = await api.get('/api/interventions/')
  return data
}

export async function createIntervention(intervention) {
  const { data } = await api.post('/api/interventions/', intervention)
  return data
}

export async function updateIntervention(id, intervention) {
  const { data } = await api.put(`/api/interventions/${id}/`, intervention)
  return data
}

export async function deleteIntervention(id) {
  await api.delete(`/api/interventions/${id}/`)
}
