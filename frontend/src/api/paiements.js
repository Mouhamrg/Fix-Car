import client from './client.js'

export async function creerPaiement(donnees) {
  const { data } = await client.post('/api/paiements/', donnees)
  return data
}
