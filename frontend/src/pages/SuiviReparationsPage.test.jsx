import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SuiviReparationsPage from './SuiviReparationsPage.jsx'
import { rendreAvecProviders } from '../test/rendre.jsx'
import { listMesDemandes } from '../api/demandes.js'
import { genererFacture, listerFactures, telechargerFacturePdf } from '../api/factures.js'

vi.mock('../api/client.js', () => ({
    default: { get: vi.fn() },
    logout: vi.fn(),
    isAuthenticated: vi.fn(() => true),
}))

vi.mock('../api/demandes.js', () => ({
    listMesDemandes: vi.fn(),
}))

vi.mock('../api/factures.js', () => ({
    listerFactures: vi.fn(),
    genererFacture: vi.fn(),
    telechargerFacturePdf: vi.fn(),
}))

const demandeEnAttente = {
    id: 1,
    titre: 'Vidange',
    vehicule: 'Toyota Corolla 2021 — XYZ 456',
    statut: 'en_attente',
    date_modification: '2026-07-01T10:00:00Z',
}

const demandeTermineeNonFacturee = {
    id: 2,
    titre: 'Changement de freins',
    vehicule: 'Honda Civic 2019 — ABC 123',
    statut: 'terminee',
    date_modification: '2026-07-02T10:00:00Z',
}

const demandeTermineeFacturee = {
    id: 3,
    titre: 'Remplacement pare-brise',
    vehicule: 'Mazda 3 2020 — DEF 789',
    statut: 'terminee',
    date_modification: '2026-07-03T10:00:00Z',
}

const factureExistante = {
    id: 10,
    demande: 3,
    numero: 'FAC-2026-0001',
    montant_total: '229.95',
}

beforeEach(() => {
    vi.clearAllMocks()
    listMesDemandes.mockResolvedValue([
        demandeEnAttente,
        demandeTermineeNonFacturee,
        demandeTermineeFacturee,
    ])
    listerFactures.mockResolvedValue([factureExistante])
})

describe('SuiviReparationsPage', () => {
    it('affiche le bouton de génération uniquement pour une demande terminée non facturée', async () => {
        rendreAvecProviders(<SuiviReparationsPage />)

        await screen.findByText('Changement de freins')
        expect(screen.getByRole('button', { name: 'Générer ma facture' })).toBeInTheDocument()
    })

    it("n'affiche pas de bouton pour une demande qui n'est pas terminée", async () => {
        rendreAvecProviders(<SuiviReparationsPage />)

        await screen.findByText('Vidange')
        const ligne = screen.getByText('Vidange').closest('tr')
        expect(ligne).not.toHaveTextContent('Générer ma facture')
    })

    it('affiche le numéro et le total de la facture existante au lieu du bouton', async () => {
        rendreAvecProviders(<SuiviReparationsPage />)

        await screen.findByText('Remplacement pare-brise')
        const ligne = screen.getByText('Remplacement pare-brise').closest('tr')
        expect(ligne).toHaveTextContent('FAC-2026-0001')
        expect(ligne).toHaveTextContent('229,95 $')
        expect(ligne).not.toHaveTextContent('Générer ma facture')
    })

    it('déclenche la génération de la facture au clic sur le bouton', async () => {
        genererFacture.mockResolvedValue({})
        const utilisateur = userEvent.setup()
        rendreAvecProviders(<SuiviReparationsPage />)

        await screen.findByText('Changement de freins')
        await utilisateur.click(screen.getByRole('button', { name: 'Générer ma facture' }))

        await waitFor(() => {
            expect(genererFacture).toHaveBeenCalled()
        })
        expect(genererFacture.mock.calls[0][0]).toBe(2)
    })

    it('déclenche le téléchargement du PDF au clic sur le bouton', async () => {
        telechargerFacturePdf.mockResolvedValue()
        const utilisateur = userEvent.setup()
        rendreAvecProviders(<SuiviReparationsPage />)

        await screen.findByText('Remplacement pare-brise')
        await utilisateur.click(screen.getByRole('button', { name: 'Télécharger le PDF' }))

        await waitFor(() => {
            expect(telechargerFacturePdf).toHaveBeenCalledWith(10, 'FAC-2026-0001')
        })
    })
})
