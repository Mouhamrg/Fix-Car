import client from './client.js'

export async function listerFactures() {
  const { data } = await client.get('/api/factures/')
  return data
}

export async function creerFacture(donnees) {
  const { data } = await client.post('/api/factures/', donnees)
  return data
}
