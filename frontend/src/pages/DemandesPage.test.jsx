import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DemandesPage from './DemandesPage.jsx'
import { rendreAvecProviders } from '../test/rendre.jsx'
import api from '../api/client.js'
import {
  createDemande,
  deleteDemande,
  listDemandes,
  updateDemande,
} from '../api/demandes.js'
import { listerDiagnostics } from '../api/diagnosticsApi'

vi.mock('../api/client.js', () => ({
  default: { get: vi.fn() },
  logout: vi.fn(),
  isAuthenticated: vi.fn(() => true),
}))

vi.mock('../api/demandes.js', () => ({
  listDemandes: vi.fn(),
  createDemande: vi.fn(),
  updateDemande: vi.fn(),
  deleteDemande: vi.fn(),
}))

vi.mock('../api/diagnosticsApi', () => ({
  listerDiagnostics: vi.fn(),
}))

const moi = { id: 1, username: 'testuser' }

const maDemande = {
  id: 10,
  titre: 'Bruit moteur',
  vehicule: 'Honda Civic 2018',
  description: 'Bruit metallique au demarrage',
  statut: 'en_attente',
  client: 1,
  client_nom: 'testuser',
}

const demandeDeJulie = {
  id: 11,
  titre: 'Chassis endommage',
  vehicule: 'Mazda 3 2020',
  description: 'Chassis endommage suite a un accident',
  statut: 'refusee',
  client: 2,
  client_nom: 'julie',
}

beforeEach(() => {
  vi.clearAllMocks()
  api.get.mockResolvedValue({ data: moi })
  listDemandes.mockResolvedValue([maDemande, demandeDeJulie])
  listerDiagnostics.mockResolvedValue([])
})

function ligneDe(titre) {
  return screen.getByText(titre).closest('tr')
}

describe('DemandesPage', () => {
  it('affiche la liste des demandes avec statut et client', async () => {
    rendreAvecProviders(<DemandesPage />)

    expect(await screen.findByText('Bruit moteur')).toBeInTheDocument()
    expect(screen.getByText('Chassis endommage')).toBeInTheDocument()
    expect(screen.getByText('En attente')).toBeInTheDocument()
    expect(screen.getByText('Refusée')).toBeInTheDocument()
    expect(screen.getByText('testuser')).toBeInTheDocument()
    expect(screen.getByText('julie')).toBeInTheDocument()
  })

  it("affiche un message quand il n'y a aucune demande", async () => {
    listDemandes.mockResolvedValue([])
    rendreAvecProviders(<DemandesPage />)

    expect(
      await screen.findByText('Aucune demande de réparation pour le moment.'),
    ).toBeInTheDocument()
  })

  it("n'affiche Modifier et Supprimer que pour ses propres demandes", async () => {
    rendreAvecProviders(<DemandesPage />)
    await screen.findByText('Bruit moteur')

    const maLigne = within(ligneDe('Bruit moteur'))
    await waitFor(() => {
      expect(maLigne.getByRole('button', { name: 'Modifier' })).toBeInTheDocument()
    })
    expect(maLigne.getByRole('button', { name: 'Supprimer' })).toBeInTheDocument()

    const ligneJulie = within(ligneDe('Chassis endommage'))
    expect(ligneJulie.queryByRole('button', { name: 'Modifier' })).toBeNull()
    expect(ligneJulie.queryByRole('button', { name: 'Supprimer' })).toBeNull()
  })

  it('ne propose pas de champ statut dans le formulaire', async () => {
    const utilisateur = userEvent.setup()
    rendreAvecProviders(<DemandesPage />)
    await screen.findByText('Bruit moteur')

    await utilisateur.click(
      screen.getByRole('button', { name: '+ Nouvelle demande' }),
    )
    await screen.findByLabelText(/Titre/)

    expect(screen.queryByLabelText(/Statut/)).toBeNull()
  })

  it('crée une demande depuis le formulaire du modal', async () => {
    createDemande.mockResolvedValue({})
    const utilisateur = userEvent.setup()
    rendreAvecProviders(<DemandesPage />)
    await screen.findByText('Bruit moteur')

    await utilisateur.click(
      screen.getByRole('button', { name: '+ Nouvelle demande' }),
    )
    await utilisateur.type(await screen.findByLabelText(/Titre/), 'Vidange')
    await utilisateur.type(
      screen.getByLabelText(/Véhicule/),
      'Toyota Corolla 2021',
    )
    await utilisateur.type(
      screen.getByLabelText(/Description du problème/),
      "Vidange d'huile requise.",
    )
    await utilisateur.click(screen.getByRole('button', { name: 'Enregistrer' }))

    await waitFor(() => {
      expect(createDemande).toHaveBeenCalled()
    })
    expect(createDemande.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        titre: 'Vidange',
        vehicule: 'Toyota Corolla 2021',
        description: "Vidange d'huile requise.",
      }),
    )
  })

  it('modifie une demande existante', async () => {
    updateDemande.mockResolvedValue({})
    const utilisateur = userEvent.setup()
    rendreAvecProviders(<DemandesPage />)
    await screen.findByText('Bruit moteur')

    const maLigne = within(ligneDe('Bruit moteur'))
    await waitFor(() => {
      expect(maLigne.getByRole('button', { name: 'Modifier' })).toBeInTheDocument()
    })
    await utilisateur.click(maLigne.getByRole('button', { name: 'Modifier' }))

    const champTitre = await screen.findByLabelText(/Titre/)
    expect(champTitre).toHaveValue('Bruit moteur')

    await utilisateur.clear(champTitre)
    await utilisateur.type(champTitre, 'Bruit moteur persistant')
    await utilisateur.click(screen.getByRole('button', { name: 'Enregistrer' }))

    await waitFor(() => {
      expect(updateDemande).toHaveBeenCalledWith(
        10,
        expect.objectContaining({ titre: 'Bruit moteur persistant' }),
      )
    })
  })

  it('supprime une demande après confirmation', async () => {
    deleteDemande.mockResolvedValue()
    const confirmation = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const utilisateur = userEvent.setup()
    rendreAvecProviders(<DemandesPage />)
    await screen.findByText('Bruit moteur')

    const maLigne = within(ligneDe('Bruit moteur'))
    await waitFor(() => {
      expect(maLigne.getByRole('button', { name: 'Supprimer' })).toBeInTheDocument()
    })
    await utilisateur.click(maLigne.getByRole('button', { name: 'Supprimer' }))

    expect(confirmation).toHaveBeenCalled()
    await waitFor(() => {
      expect(deleteDemande).toHaveBeenCalled()
    })
    expect(deleteDemande.mock.calls[0][0]).toBe(10)
  })

  it("ne supprime pas si l'utilisateur annule la confirmation", async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const utilisateur = userEvent.setup()
    rendreAvecProviders(<DemandesPage />)
    await screen.findByText('Bruit moteur')

    const maLigne = within(ligneDe('Bruit moteur'))
    await waitFor(() => {
      expect(maLigne.getByRole('button', { name: 'Supprimer' })).toBeInTheDocument()
    })
    await utilisateur.click(maLigne.getByRole('button', { name: 'Supprimer' }))

    expect(deleteDemande).not.toHaveBeenCalled()
  })

  it("affiche les erreurs de validation renvoyées par l'API", async () => {
    createDemande.mockRejectedValue({
      response: { data: { titre: ['Ce champ est obligatoire.'] } },
    })
    const utilisateur = userEvent.setup()
    rendreAvecProviders(<DemandesPage />)
    await screen.findByText('Bruit moteur')

    await utilisateur.click(
      screen.getByRole('button', { name: '+ Nouvelle demande' }),
    )
    await utilisateur.type(await screen.findByLabelText(/Titre/), 'Vidange')
    await utilisateur.type(screen.getByLabelText(/Véhicule/), 'Toyota Corolla')
    await utilisateur.type(
      screen.getByLabelText(/Description du problème/),
      'Probleme quelconque.',
    )
    await utilisateur.click(screen.getByRole('button', { name: 'Enregistrer' }))

    expect(
      await screen.findByText('titre : Ce champ est obligatoire.'),
    ).toBeInTheDocument()
  })

  it("affiche le statut du devis quand un diagnostic existe déjà pour la demande", async () => {
    listerDiagnostics.mockResolvedValue([
      {
        id: 42,
        demande: 10,
        statut: 'EN_ATTENTE_VALIDATION',
        statut_affichage: 'En attente de validation du client',
      },
    ])
    rendreAvecProviders(<DemandesPage />)
    await screen.findByText('Bruit moteur')

    const maLigne = within(ligneDe('Bruit moteur'))
    expect(
      await maLigne.findByText('En attente de validation du client'),
    ).toBeInTheDocument()
    expect(maLigne.queryByText('Ajouter un diagnostic')).toBeNull()

    const ligneJulie = within(ligneDe('Chassis endommage'))
    expect(ligneJulie.getByText('Ajouter un diagnostic')).toBeInTheDocument()
  })

  it("affiche le message de succès reçu après l'envoi d'un devis", async () => {
    rendreAvecProviders(<DemandesPage />, {
      initialEntries: [
        { pathname: '/demandes', state: { message: 'Devis envoyé au client.' } },
      ],
    })

    expect(await screen.findByText('Devis envoyé au client.')).toBeInTheDocument()
  })
})
