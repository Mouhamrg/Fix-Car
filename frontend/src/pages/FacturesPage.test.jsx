import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FacturesPage from './FacturesPage.jsx'
import { rendreAvecProviders } from '../test/rendre.jsx'
import { creerFacture, listerFactures } from '../api/factures.js'
import { listDemandes } from '../api/demandes.js'

vi.mock('../api/client.js', () => ({
    default: { get: vi.fn() },
    logout: vi.fn(),
    isAuthenticated: vi.fn(() => true),
}))

vi.mock('../api/factures.js', () => ({
    listerFactures: vi.fn(),
    creerFacture: vi.fn(),
}))

vi.mock('../api/demandes.js', () => ({
    listDemandes: vi.fn(),
}))

const demandeTerminee = {
    id: 1,
    titre: 'Changement de freins',
    vehicule: 'Honda Civic 2019 — ABC 123',
    statut: 'terminee',
}

const demandeDejaFacturee = {
    id: 2,
    titre: 'Vidange',
    vehicule: 'Toyota Corolla 2021 — XYZ 456',
    statut: 'terminee',
}

const factureExistante = {
    id: 10,
    demande: 2,
    demande_titre: 'Vidange',
    numero: 'FAC-2026-0001',
    montant_main_oeuvre: '50.00',
    montant_pieces: '0.00',
    tps: '2.50',
    tvq: '4.99',
    montant_total: '57.49',
    statut: 'emise',
}

beforeEach(() => {
    vi.clearAllMocks()
    listerFactures.mockResolvedValue([factureExistante])
    listDemandes.mockResolvedValue([demandeTerminee, demandeDejaFacturee])
})

describe('FacturesPage', () => {
    it('affiche la liste des factures avec le détail des montants et taxes', async () => {
        rendreAvecProviders(<FacturesPage />)

        expect(await screen.findByText('FAC-2026-0001')).toBeInTheDocument()
        expect(screen.getByText('Vidange')).toBeInTheDocument()
        expect(screen.getByText('2,50 $')).toBeInTheDocument()
        expect(screen.getByText('4,99 $')).toBeInTheDocument()
        expect(screen.getByText('57,49 $')).toBeInTheDocument()
        expect(screen.getByText('Émise')).toBeInTheDocument()
    })

    it("affiche un message quand il n'y a aucune facture", async () => {
        listerFactures.mockResolvedValue([])
        rendreAvecProviders(<FacturesPage />)

        expect(
            await screen.findByText('Aucune facture émise pour le moment.'),
        ).toBeInTheDocument()
    })

    it('propose seulement les demandes non encore facturées dans le formulaire', async () => {
        const utilisateur = userEvent.setup()
        rendreAvecProviders(<FacturesPage />)
        await screen.findByText('FAC-2026-0001')

        await utilisateur.click(screen.getByRole('button', { name: 'Générer une facture' }))
        await utilisateur.click(await screen.findByRole('combobox', { name: /Demande de réparation/ }))

        expect(await screen.findByText('Changement de freins — Honda Civic 2019 — ABC 123')).toBeInTheDocument()
        expect(screen.queryByText('Vidange — Toyota Corolla 2021 — XYZ 456')).not.toBeInTheDocument()
    })

    it('génère une facture depuis le modal', async () => {
        creerFacture.mockResolvedValue({})
        const utilisateur = userEvent.setup()
        rendreAvecProviders(<FacturesPage />)
        await screen.findByText('FAC-2026-0001')

        await utilisateur.click(screen.getByRole('button', { name: 'Générer une facture' }))
        await utilisateur.click(await screen.findByRole('combobox', { name: /Demande de réparation/ }))
        await utilisateur.click(
            await screen.findByText('Changement de freins — Honda Civic 2019 — ABC 123'),
        )
        await utilisateur.type(screen.getByLabelText(/Montant main-d'œuvre/), '200')
        await utilisateur.type(screen.getByLabelText(/Montant pièces/), '100')
        await utilisateur.click(screen.getByRole('button', { name: 'Générer la facture' }))

        await waitFor(() => {
            expect(creerFacture).toHaveBeenCalled()
        })
        expect(creerFacture.mock.calls[0][0]).toEqual(
            expect.objectContaining({ demande: 1 }),
        )
    })

    it('refuse la soumission si un champ requis manque', async () => {
        const utilisateur = userEvent.setup()
        rendreAvecProviders(<FacturesPage />)
        await screen.findByText('FAC-2026-0001')

        await utilisateur.click(screen.getByRole('button', { name: 'Générer une facture' }))
        await utilisateur.click(await screen.findByRole('button', { name: 'Générer la facture' }, { timeout: 3000 }))

        expect(
            await screen.findByText(/sont requis/),
        ).toBeInTheDocument()
        expect(creerFacture).not.toHaveBeenCalled()
    })

    it("affiche l'erreur renvoyée par l'API dans le modal", async () => {
        creerFacture.mockRejectedValue({
            response: { data: { demande: ['Impossible de facturer une demande annulée.'] } },
        })
        const utilisateur = userEvent.setup()
        rendreAvecProviders(<FacturesPage />)
        await screen.findByText('FAC-2026-0001')

        await utilisateur.click(screen.getByRole('button', { name: 'Générer une facture' }))
        await utilisateur.click(await screen.findByRole('combobox', { name: /Demande de réparation/ }))
        await utilisateur.click(
            await screen.findByText('Changement de freins — Honda Civic 2019 — ABC 123'),
        )
        await utilisateur.type(screen.getByLabelText(/Montant main-d'œuvre/), '200')
        await utilisateur.type(screen.getByLabelText(/Montant pièces/), '100')
        await utilisateur.click(screen.getByRole('button', { name: 'Générer la facture' }))

        expect(
            await screen.findByText('Impossible de facturer une demande annulée.'),
        ).toBeInTheDocument()
    })
})
