import api from './client.js'

export const listComptes = async (params = '') => (await api.get('/api/comptes/', params ? { params: { role: params } } : {})).data
export const getCompte = async (id) => (await api.get(`/api/comptes/${id}/`)).data
export const createCompte = async (data) => (await api.post('/api/comptes/inscription/', data)).data
export const updateCompte = async (id, data) => (await api.patch(`/api/comptes/${id}/`, data)).data
export const desactiverCompte = async (id) => (await api.patch(`/api/comptes/${id}/desactiver/`)).data
export const supprimerMonCompte = async (id) => (await api.delete(`/api/comptes/${id}/supprimer-mon-compte/`)).data
export const changerRole = async (id, role) => (await api.patch(`/api/comptes/${id}/changer-role/`, { role })).data
export const reactiverCompte = async (id) => (await api.patch(`/api/comptes/${id}/reactiver/`)).data