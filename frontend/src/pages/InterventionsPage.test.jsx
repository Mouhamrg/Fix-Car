import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import InterventionsPage from './InterventionsPage.jsx'
import { rendreAvecProviders } from '../test/rendre.jsx'
import api from '../api/client.js'
import {
  createIntervention,
  deleteIntervention,
  listInterventions,
  updateIntervention,
} from '../api/interventions.js'

vi.mock('../api/client.js', () => ({
  default: { get: vi.fn() },
  logout: vi.fn(),
  isAuthenticated: vi.fn(() => true),
}))

vi.mock('../api/interventions.js', () => ({
  listInterventions: vi.fn(),
  createIntervention: vi.fn(),
  updateIntervention: vi.fn(),
  deleteIntervention: vi.fn(),
}))

const moi = { id: 1, username: 'marc', first_name: 'Marc', last_name: 'Tremblay' }

const monIntervention = {
  id: 10,
  titre: 'Changement de freins',
  vehicule: 'Honda Civic 2019 — ABC 123',
  description: 'Remplacement des plaquettes avant.',
  date_intervention: '2026-07-01',
  duree_heures: '1.50',
  pieces_utilisees: '',
  statut: 'en_cours',
  mecanicien: 1,
  mecanicien_nom: 'Marc Tremblay',
}

const interventionDeJulie = {
  id: 11,
  titre: 'Réparation embrayage',
  vehicule: 'Mazda 3 2020 — DEF 789',
  description: "Remplacement du disque d'embrayage.",
  date_intervention: '2026-06-15',
  duree_heures: '4.00',
  pieces_utilisees: 'Disque, butée',
  statut: 'terminee',
  mecanicien: 2,
  mecanicien_nom: 'Julie Roy',
}

beforeEach(() => {
  vi.clearAllMocks()
  api.get.mockResolvedValue({ data: moi })
  listInterventions.mockResolvedValue([monIntervention, interventionDeJulie])
})

function ligneDe(titre) {
  return screen.getByText(titre).closest('tr')
}

describe('InterventionsPage', () => {
  it('affiche la liste des interventions avec statut et mécanicien', async () => {
    rendreAvecProviders(<InterventionsPage />)

    expect(await screen.findByText('Changement de freins')).toBeInTheDocument()
    expect(screen.getByText('Réparation embrayage')).toBeInTheDocument()
    expect(screen.getByText('En cours')).toBeInTheDocument()
    expect(screen.getByText('Terminée')).toBeInTheDocument()
    expect(screen.getByText('Marc Tremblay')).toBeInTheDocument()
    expect(screen.getByText('Julie Roy')).toBeInTheDocument()
    expect(screen.getByText('1.5 h')).toBeInTheDocument()
  })

  it("affiche un message quand il n'y a aucune intervention", async () => {
    listInterventions.mockResolvedValue([])
    rendreAvecProviders(<InterventionsPage />)

    expect(
      await screen.findByText('Aucune intervention documentée pour le moment.'),
    ).toBeInTheDocument()
  })

  it("n'affiche Modifier et Supprimer que pour ses propres interventions", async () => {
    rendreAvecProviders(<InterventionsPage />)
    await screen.findByText('Changement de freins')

    const maLigne = within(ligneDe('Changement de freins'))
    await waitFor(() => {
      expect(maLigne.getByRole('button', { name: 'Modifier' })).toBeInTheDocument()
    })
    expect(maLigne.getByRole('button', { name: 'Supprimer' })).toBeInTheDocument()

    const ligneJulie = within(ligneDe('Réparation embrayage'))
    expect(ligneJulie.queryByRole('button', { name: 'Modifier' })).toBeNull()
    expect(ligneJulie.queryByRole('button', { name: 'Supprimer' })).toBeNull()
  })

  it('crée une intervention depuis le formulaire du modal', async () => {
    createIntervention.mockResolvedValue({})
    const utilisateur = userEvent.setup()
    rendreAvecProviders(<InterventionsPage />)
    await screen.findByText('Changement de freins')

    await utilisateur.click(
      screen.getByRole('button', { name: '+ Nouvelle intervention' }),
    )
    await utilisateur.type(await screen.findByLabelText(/Titre/), 'Vidange')
    await utilisateur.type(
      screen.getByLabelText(/Véhicule/),
      'Toyota Corolla 2021 — XYZ 456',
    )
    await utilisateur.type(
      screen.getByLabelText(/Travaux effectués/),
      "Vidange d'huile et remplacement du filtre.",
    )
    await utilisateur.click(screen.getByRole('button', { name: 'Enregistrer' }))

    await waitFor(() => {
      expect(createIntervention).toHaveBeenCalled()
    })
    expect(createIntervention.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        titre: 'Vidange',
        vehicule: 'Toyota Corolla 2021 — XYZ 456',
        description: "Vidange d'huile et remplacement du filtre.",
        statut: 'en_cours',
      }),
    )
  })

  it('modifie une intervention existante', async () => {
    updateIntervention.mockResolvedValue({})
    const utilisateur = userEvent.setup()
    rendreAvecProviders(<InterventionsPage />)
    await screen.findByText('Changement de freins')

    const maLigne = within(ligneDe('Changement de freins'))
    await waitFor(() => {
      expect(maLigne.getByRole('button', { name: 'Modifier' })).toBeInTheDocument()
    })
    await utilisateur.click(maLigne.getByRole('button', { name: 'Modifier' }))

    const champTitre = await screen.findByLabelText(/Titre/)
    expect(champTitre).toHaveValue('Changement de freins')

    await utilisateur.clear(champTitre)
    await utilisateur.type(champTitre, 'Freins avant et arrière')
    await utilisateur.click(screen.getByRole('button', { name: 'Enregistrer' }))

    await waitFor(() => {
      expect(updateIntervention).toHaveBeenCalledWith(
        10,
        expect.objectContaining({ titre: 'Freins avant et arrière' }),
      )
    })
  })

  it('supprime une intervention après confirmation', async () => {
    deleteIntervention.mockResolvedValue()
    const confirmation = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const utilisateur = userEvent.setup()
    rendreAvecProviders(<InterventionsPage />)
    await screen.findByText('Changement de freins')

    const maLigne = within(ligneDe('Changement de freins'))
    await waitFor(() => {
      expect(maLigne.getByRole('button', { name: 'Supprimer' })).toBeInTheDocument()
    })
    await utilisateur.click(maLigne.getByRole('button', { name: 'Supprimer' }))

    expect(confirmation).toHaveBeenCalled()
    await waitFor(() => {
      expect(deleteIntervention).toHaveBeenCalled()
    })
    expect(deleteIntervention.mock.calls[0][0]).toBe(10)
  })

  it("ne supprime pas si l'utilisateur annule la confirmation", async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const utilisateur = userEvent.setup()
    rendreAvecProviders(<InterventionsPage />)
    await screen.findByText('Changement de freins')

    const maLigne = within(ligneDe('Changement de freins'))
    await waitFor(() => {
      expect(maLigne.getByRole('button', { name: 'Supprimer' })).toBeInTheDocument()
    })
    await utilisateur.click(maLigne.getByRole('button', { name: 'Supprimer' }))

    expect(deleteIntervention).not.toHaveBeenCalled()
  })

  it("affiche les erreurs de validation renvoyées par l'API", async () => {
    createIntervention.mockRejectedValue({
      response: { data: { titre: ['Ce champ est obligatoire.'] } },
    })
    const utilisateur = userEvent.setup()
    rendreAvecProviders(<InterventionsPage />)
    await screen.findByText('Changement de freins')

    await utilisateur.click(
      screen.getByRole('button', { name: '+ Nouvelle intervention' }),
    )
    await utilisateur.type(await screen.findByLabelText(/Titre/), 'Vidange')
    await utilisateur.type(screen.getByLabelText(/Véhicule/), 'Toyota Corolla')
    await utilisateur.type(screen.getByLabelText(/Travaux effectués/), 'Vidange.')
    await utilisateur.click(screen.getByRole('button', { name: 'Enregistrer' }))

    expect(
      await screen.findByText('titre : Ce champ est obligatoire.'),
    ).toBeInTheDocument()
  })
})
