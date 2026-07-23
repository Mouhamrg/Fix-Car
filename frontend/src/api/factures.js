import client from './client.js'

export async function listerFactures() {
  const { data } = await client.get('/api/factures/')
  return data
}

export async function genererFacture(demandeId) {
  const { data } = await client.post('/api/factures/generer/', { demande: demandeId })
  return data
}

export async function telechargerFacturePdf(id, numero) {
  const { data } = await client.get(`/api/factures/${id}/pdf/`, { responseType: 'blob' })
  const url = window.URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
  const lien = document.createElement('a')
  lien.href = url
  lien.download = `${numero}.pdf`
  document.body.appendChild(lien)
  lien.click()
  lien.remove()
  window.URL.revokeObjectURL(url)
}
