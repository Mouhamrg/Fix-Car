import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProfilPage from './ProfilPage.jsx'
import { rendreAvecProviders } from '../test/rendre.jsx'
import api from '../api/client.js'
import { listComptes, updateCompte, desactiverCompte } from '../api/comptes.js'

vi.mock('../api/client.js', () => ({
  default: { get: vi.fn() },
  logout: vi.fn(),
  isAuthenticated: vi.fn(() => true),
}))

vi.mock('../api/comptes.js', () => ({
  listComptes: vi.fn(),
  updateCompte: vi.fn(),
  desactiverCompte: vi.fn(),
  supprimerMonCompte: vi.fn(),
  changerRole: vi.fn(),
  reactiverCompte: vi.fn(),
}))

vi.mock('../components/AppLayout.jsx', () => ({
  default: ({ children }) => <div>{children}</div>,
}))

const moi = {
  id: 1,
  username: 'Aboubacar',
  first_name: 'Aboubacar',
  last_name: 'Niang',
  email: 'test@test.com',
  telephone: '1234567890',
  role: 'ADMINISTRATEUR',
  is_active: true,
}

const autreCompte = {
  id: 2,
  username: 'marie',
  first_name: 'Marie',
  last_name: 'Dupont',
  email: 'marie@test.com',
  telephone: '0987654321',
  role: 'client',
  is_active: true,
}

beforeEach(() => {
  vi.clearAllMocks()
  api.get.mockResolvedValue({ data: moi })
  listComptes.mockResolvedValue([moi, autreCompte])
})

describe('ProfilPage', () => {
  it('affiche la liste des comptes', async () => {
    rendreAvecProviders(<ProfilPage />)
    expect(await screen.findByText('Aboubacar')).toBeInTheDocument()
    expect(screen.getByText('marie')).toBeInTheDocument()
  })

  it('affiche un message quand il n\'y a aucun compte', async () => {
    listComptes.mockResolvedValue([])
    rendreAvecProviders(<ProfilPage />)
    expect(await screen.findByText('Aucun compte enregistré.')).toBeInTheDocument()
  })

  it('affiche le bouton Modifier uniquement pour son propre compte', async () => {
    rendreAvecProviders(<ProfilPage />)
    await screen.findByText('Aboubacar')

    const maLigne = within(screen.getByText('Aboubacar').closest('tr'))
    await waitFor(() => {
      expect(maLigne.getByRole('button', { name: 'Modifier' })).toBeInTheDocument()
    })

    const ligneAutre = within(screen.getByText('marie').closest('tr'))
    expect(ligneAutre.queryByRole('button', { name: 'Modifier' })).toBeNull()
  })

  it('modifie son propre compte', async () => {
    updateCompte.mockResolvedValue({})
    const utilisateur = userEvent.setup()
    rendreAvecProviders(<ProfilPage />)
    await screen.findByText('Aboubacar')

    const maLigne = within(screen.getByText('Aboubacar').closest('tr'))
    await waitFor(() => {
      expect(maLigne.getByRole('button', { name: 'Modifier' })).toBeInTheDocument()
    })
    await utilisateur.click(maLigne.getByRole('button', { name: 'Modifier' }))

    const champPrenom = await screen.findByLabelText(/Prénom/)
    await utilisateur.clear(champPrenom)
    await utilisateur.type(champPrenom, 'Aboubacar As-siddiq')
    await utilisateur.click(screen.getByRole('button', { name: 'Enregistrer' }))

    await waitFor(() => {
      expect(updateCompte).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ first_name: 'Aboubacar As-siddiq' }),
      )
    })
  })

  it('désactive un compte (admin)', async () => {
    desactiverCompte.mockResolvedValue({})
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const utilisateur = userEvent.setup()
    rendreAvecProviders(<ProfilPage />)
    await screen.findByText('marie')

    const ligneAutre = within(screen.getByText('marie').closest('tr'))
    await waitFor(() => {
      expect(ligneAutre.getByRole('button', { name: 'Désactiver' })).toBeInTheDocument()
    })
    await utilisateur.click(ligneAutre.getByRole('button', { name: 'Désactiver' }))

    await waitFor(() => {
      expect(desactiverCompte).toHaveBeenCalledWith(2, expect.anything())
    })
  })
  it('affiche le bouton Réactiver pour les comptes inactifs (admin)', async () => {
    const compteInactif = { ...autreCompte, is_active: false }
    listComptes.mockResolvedValue([moi, compteInactif])
    rendreAvecProviders(<ProfilPage />)
    await screen.findByText('marie')

    const ligneAutre = within(screen.getByText('marie').closest('tr'))
    await waitFor(() => {
      expect(ligneAutre.getByRole('button', { name: 'Réactiver' })).toBeInTheDocument()
    })
  })

  it('ne montre pas Désactiver pour un compte inactif', async () => {
    const compteInactif = { ...autreCompte, is_active: false }
    listComptes.mockResolvedValue([moi, compteInactif])
    rendreAvecProviders(<ProfilPage />)
    await screen.findByText('marie')

    const ligneAutre = within(screen.getByText('marie').closest('tr'))
    await waitFor(() => {
      expect(ligneAutre.queryByRole('button', { name: 'Désactiver' })).toBeNull()
    })
  })
})

