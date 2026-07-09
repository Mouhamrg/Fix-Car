import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TypesReparationsPage from './TypesReparationsPage.jsx'
import { rendreAvecProviders } from '../test/rendre.jsx'
import {
  createTypeReparation,
  deleteTypeReparation,
  listTypesReparations,
  updateTypeReparation,
} from '../api/typesReparations.js'

vi.mock('../api/client.js', () => ({
  default: { get: vi.fn() },
  logout: vi.fn(),
  isAuthenticated: vi.fn(() => true),
}))

vi.mock('../api/typesReparations.js', () => ({
  listTypesReparations: vi.fn(),
  createTypeReparation: vi.fn(),
  updateTypeReparation: vi.fn(),
  deleteTypeReparation: vi.fn(),
}))

const vidange = {
  id: 1,
  nom: 'Vidange',
  description: "Vidange d'huile et remplacement du filtre.",
  duree_estimee_heures: '0.75',
  prix_standard: '49.99',
}

const freins = {
  id: 2,
  nom: 'Changement de freins',
  description: 'Remplacement des plaquettes avant.',
  duree_estimee_heures: '1.50',
  prix_standard: '120.00',
}

beforeEach(() => {
  vi.clearAllMocks()
  listTypesReparations.mockResolvedValue([vidange, freins])
})

function ligneDe(nom) {
  return screen.getByText(nom).closest('tr')
}

describe('TypesReparationsPage', () => {
  it('affiche la liste des types de reparation avec duree et prix', async () => {
    rendreAvecProviders(<TypesReparationsPage />)

    expect(await screen.findByText('Vidange')).toBeInTheDocument()
    expect(screen.getByText('Changement de freins')).toBeInTheDocument()
    expect(screen.getByText('0.75 h')).toBeInTheDocument()
    expect(screen.getByText('49.99 $')).toBeInTheDocument()
  })

  it("affiche un message quand le catalogue est vide", async () => {
    listTypesReparations.mockResolvedValue([])
    rendreAvecProviders(<TypesReparationsPage />)

    expect(
      await screen.findByText('Aucun type de réparation dans le catalogue pour le moment.'),
    ).toBeInTheDocument()
  })

  it('affiche Modifier et Supprimer pour tout le monde (catalogue partage)', async () => {
    rendreAvecProviders(<TypesReparationsPage />)
    await screen.findByText('Vidange')

    const ligne = within(ligneDe('Vidange'))
    expect(ligne.getByRole('button', { name: 'Modifier' })).toBeInTheDocument()
    expect(ligne.getByRole('button', { name: 'Supprimer' })).toBeInTheDocument()
  })

  it('crée un type de réparation depuis le formulaire du modal', async () => {
    createTypeReparation.mockResolvedValue({})
    const utilisateur = userEvent.setup()
    rendreAvecProviders(<TypesReparationsPage />)
    await screen.findByText('Vidange')

    await utilisateur.click(screen.getByRole('button', { name: '+ Nouveau type' }))
    await utilisateur.type(await screen.findByLabelText(/Nom/), 'Alignement')
    await utilisateur.click(screen.getByRole('button', { name: 'Enregistrer' }))

    await waitFor(() => {
      expect(createTypeReparation).toHaveBeenCalled()
    })
    expect(createTypeReparation.mock.calls[0][0]).toEqual(
      expect.objectContaining({ nom: 'Alignement' }),
    )
  })

  it('modifie un type de réparation existant', async () => {
    updateTypeReparation.mockResolvedValue({})
    const utilisateur = userEvent.setup()
    rendreAvecProviders(<TypesReparationsPage />)
    await screen.findByText('Vidange')

    const ligne = within(ligneDe('Vidange'))
    await utilisateur.click(ligne.getByRole('button', { name: 'Modifier' }))

    const champNom = await screen.findByLabelText(/Nom/)
    expect(champNom).toHaveValue('Vidange')

    await utilisateur.clear(champNom)
    await utilisateur.type(champNom, 'Vidange premium')
    await utilisateur.click(screen.getByRole('button', { name: 'Enregistrer' }))

    await waitFor(() => {
      expect(updateTypeReparation).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ nom: 'Vidange premium' }),
      )
    })
  })

  it('supprime un type de réparation après confirmation', async () => {
    deleteTypeReparation.mockResolvedValue()
    const confirmation = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const utilisateur = userEvent.setup()
    rendreAvecProviders(<TypesReparationsPage />)
    await screen.findByText('Vidange')

    const ligne = within(ligneDe('Vidange'))
    await utilisateur.click(ligne.getByRole('button', { name: 'Supprimer' }))

    expect(confirmation).toHaveBeenCalled()
    await waitFor(() => {
      expect(deleteTypeReparation).toHaveBeenCalled()
    })
    expect(deleteTypeReparation.mock.calls[0][0]).toBe(1)
  })

  it("ne supprime pas si l'utilisateur annule la confirmation", async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const utilisateur = userEvent.setup()
    rendreAvecProviders(<TypesReparationsPage />)
    await screen.findByText('Vidange')

    const ligne = within(ligneDe('Vidange'))
    await utilisateur.click(ligne.getByRole('button', { name: 'Supprimer' }))

    expect(deleteTypeReparation).not.toHaveBeenCalled()
  })

  it("affiche les erreurs de validation renvoyées par l'API", async () => {
    createTypeReparation.mockRejectedValue({
      response: { data: { nom: ['Ce champ est obligatoire.'] } },
    })
    const utilisateur = userEvent.setup()
    rendreAvecProviders(<TypesReparationsPage />)
    await screen.findByText('Vidange')

    await utilisateur.click(screen.getByRole('button', { name: '+ Nouveau type' }))
    await utilisateur.type(await screen.findByLabelText(/Nom/), 'Alignement')
    await utilisateur.click(screen.getByRole('button', { name: 'Enregistrer' }))

    expect(
      await screen.findByText('nom : Ce champ est obligatoire.'),
    ).toBeInTheDocument()
  })
})
