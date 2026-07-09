import api from './client.js'

export async function listTypesReparations() {
  const { data } = await api.get('/api/types-reparations/')
  return data
}

export async function createTypeReparation(typeReparation) {
  const { data } = await api.post('/api/types-reparations/', typeReparation)
  return data
}

export async function updateTypeReparation(id, typeReparation) {
  const { data } = await api.put(`/api/types-reparations/${id}/`, typeReparation)
  return data
}

export async function deleteTypeReparation(id) {
  await api.delete(`/api/types-reparations/${id}/`)
}
