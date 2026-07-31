import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import PageFormulaireDiagnostic from './PageFormulaireDiagnostic.jsx'
import { rendreAvecProviders } from '../test/rendre.jsx'
import api from '../api/client.js'
import { creerDiagnostic, modifierDiagnostic, obtenirDiagnostic } from '../api/diagnosticsApi'
import { obtenirDemande } from '../api/demandes'
import { listTypesReparations } from '../api/typesReparations.js'

vi.mock('../api/client.js', () => ({
  default: { get: vi.fn() },
  logout: vi.fn(),
  isAuthenticated: vi.fn(() => true),
}))

vi.mock('../api/diagnosticsApi', () => ({
  creerDiagnostic: vi.fn(),
  modifierDiagnostic: vi.fn(),
  obtenirDiagnostic: vi.fn(),
}))

vi.mock('../api/demandes', () => ({
  obtenirDemande: vi.fn(),
}))

vi.mock('../api/typesReparations.js', () => ({
  listTypesReparations: vi.fn(),
}))

const moi = { id: 1, username: 'mario', role: 'MECANICIEN' }

const demande = {
  id: 5,
  titre: 'Bruit moteur',
  vehicule_plaque: 'ABC 123',
  client_nom: 'testuser',
}

const typesReparations = [
  { id: 1, nom: 'Vidange' },
  { id: 2, nom: 'Changement de freins' },
]

const diagnosticExistant = {
  id: 7,
  demande: 5,
  demande_titre: 'Bruit moteur',
  demande_vehicule_plaque: 'ABC 123',
  demande_client_nom: 'testuser',
  notes_techniques: 'Observation.',
  travaux_a_effectuer: 'Remplacement.',
  cout_estime: '200.00',
  statut: 'EN_ATTENTE_VALIDATION',
  types_reparation: [1],
  types_reparation_noms: ['Vidange'],
}

beforeEach(() => {
  vi.clearAllMocks()
  api.get.mockResolvedValue({ data: moi })
  obtenirDemande.mockResolvedValue(demande)
  listTypesReparations.mockResolvedValue(typesReparations)
})

function elementAvecRoutes() {
  return (
    <Routes>
      <Route path="/diagnostics/nouveau" element={<PageFormulaireDiagnostic />} />
      <Route path="/diagnostics/:id/modifier" element={<PageFormulaireDiagnostic />} />
    </Routes>
  )
}

describe('PageFormulaireDiagnostic', () => {
  it('permet de sélectionner plusieurs types de réparation à la création', async () => {
    creerDiagnostic.mockResolvedValue({})
    const utilisateur = userEvent.setup()
    rendreAvecProviders(elementAvecRoutes(), {
      initialEntries: ['/diagnostics/nouveau?demande=5'],
    })

    await screen.findByText(/Bruit moteur/)

    await utilisateur.type(screen.getByLabelText(/Notes techniques/), 'Notes.')
    await utilisateur.type(screen.getByLabelText(/Travaux à effectuer/), 'Travaux.')
    await utilisateur.type(screen.getByLabelText(/Coût estimé/), '150')

    const [champTypes] = await screen.findAllByLabelText(/Types de réparation préconisés/)
    await utilisateur.click(champTypes)
    await utilisateur.click(await screen.findByText('Vidange'))
    await utilisateur.click(await screen.findByText('Changement de freins'))

    await utilisateur.click(screen.getByRole('button', { name: 'Envoyer le devis au client' }))

    await waitFor(() => {
      expect(creerDiagnostic).toHaveBeenCalled()
    })
    const donnees = creerDiagnostic.mock.calls[0][0]
    expect(donnees.demande).toBe(5)
    expect(donnees.types_reparation).toEqual(expect.arrayContaining([1, 2]))
  })

  it('pré-remplit les types de réparation déjà liés en mode édition', async () => {
    obtenirDiagnostic.mockResolvedValue(diagnosticExistant)
    rendreAvecProviders(elementAvecRoutes(), {
      initialEntries: ['/diagnostics/7/modifier'],
    })

    await screen.findByText(/Bruit moteur/)
    expect(screen.getAllByText('Vidange').length).toBeGreaterThan(0)
  })

  it("affiche l'erreur du serveur même quand elle porte sur le champ demande (sans champ visible)", async () => {
    creerDiagnostic.mockRejectedValue({
      response: {
        data: { demande: ["Vous n'êtes pas le mécanicien assigné à cette demande."] },
      },
    })
    const utilisateur = userEvent.setup()
    rendreAvecProviders(elementAvecRoutes(), {
      initialEntries: ['/diagnostics/nouveau?demande=5'],
    })

    await screen.findByText(/Bruit moteur/)
    await utilisateur.type(screen.getByLabelText(/Notes techniques/), 'Notes.')
    await utilisateur.type(screen.getByLabelText(/Travaux à effectuer/), 'Travaux.')
    await utilisateur.type(screen.getByLabelText(/Coût estimé/), '150')
    await utilisateur.click(screen.getByRole('button', { name: 'Envoyer le devis au client' }))

    expect(
      await screen.findByText("Vous n'êtes pas le mécanicien assigné à cette demande."),
    ).toBeInTheDocument()
  })
})
