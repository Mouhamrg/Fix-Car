import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RendezVousPage from './RendezVousPage.jsx'
import { rendreAvecProviders } from '../test/rendre.jsx'
import {
    annulerRendezVous,
    creerRendezVous,
    listerRendezVous,
    modifierRendezVous,
} from '../api/rendez-vous.js'

vi.mock('../api/client.js', () => ({
    default: { get: vi.fn() },
    logout: vi.fn(),
    isAuthenticated: vi.fn(() => true),
}))

vi.mock('../api/rendez-vous.js', () => ({
    listerRendezVous: vi.fn(),
    creerRendezVous: vi.fn(),
    modifierRendezVous: vi.fn(),
    annulerRendezVous: vi.fn(),
}))

const rdvDemande = {
    id: 1,
    client: 1,
    date_heure: '2026-09-17T13:30:00-04:00',
    motif: 'Inspection des freins',
    statut: 'demande',
    statut_affiche: 'Demandé',
}

const rdvAnnule = {
    id: 2,
    client: 1,
    date_heure: '2026-07-08T17:15:00-04:00',
    motif: 'Changement de pneus',
    statut: 'annule',
    statut_affiche: 'Annulé',
}

beforeEach(() => {
    vi.clearAllMocks()
    listerRendezVous.mockResolvedValue([rdvDemande, rdvAnnule])
})

function ligneDe(motif) {
    return screen.getByText(motif).closest('tr')
}

describe('RendezVousPage', () => {
    it('affiche la liste des rendez-vous avec leur statut', async () => {
        rendreAvecProviders(<RendezVousPage />)

        expect(await screen.findByText('Inspection des freins')).toBeInTheDocument()
        expect(screen.getByText('Changement de pneus')).toBeInTheDocument()
        expect(screen.getByText('Demandé')).toBeInTheDocument()
        expect(screen.getByText('Annulé')).toBeInTheDocument()
    })

    it("affiche un message quand il n'y a aucun rendez-vous", async () => {
        listerRendezVous.mockResolvedValue([])
        rendreAvecProviders(<RendezVousPage />)

        expect(
            await screen.findByText(/Aucun rendez-vous pour le moment/),
        ).toBeInTheDocument()
    })

    it('désactive Modifier et Annuler pour un rendez-vous annulé', async () => {
        rendreAvecProviders(<RendezVousPage />)
        await screen.findByText('Inspection des freins')

        const ligneActive = within(ligneDe('Inspection des freins'))
        expect(ligneActive.getByRole('button', { name: 'Modifier' })).toBeEnabled()
        expect(ligneActive.getByRole('button', { name: 'Annuler' })).toBeEnabled()

        const ligneAnnulee = within(ligneDe('Changement de pneus'))
        expect(ligneAnnulee.getByRole('button', { name: 'Modifier' })).toBeDisabled()
        expect(ligneAnnulee.getByRole('button', { name: 'Annuler' })).toBeDisabled()
    })

    it('crée un rendez-vous depuis le modal', async () => {
        creerRendezVous.mockResolvedValue({})
        const utilisateur = userEvent.setup()
        rendreAvecProviders(<RendezVousPage />)
        await screen.findByText('Inspection des freins')

        await utilisateur.click(
            screen.getByRole('button', { name: 'Prendre un rendez-vous' }),
        )
        const champDate = await screen.findByLabelText(/Date et heure/)
        await utilisateur.type(champDate, '2026-10-05T14:00')
        await utilisateur.type(
            screen.getByLabelText(/Motif de la visite/),
            'Bruit au démarrage',
        )
        await utilisateur.click(
            screen.getByRole('button', { name: 'Prendre le rendez-vous' }),
        )

        await waitFor(() => {
            expect(creerRendezVous).toHaveBeenCalled()
        })
        expect(creerRendezVous.mock.calls[0][0]).toEqual(
            expect.objectContaining({ motif: 'Bruit au démarrage' }),
        )
    })

    it('refuse la soumission si la date ou le motif manquent', async () => {
        const utilisateur = userEvent.setup()
        rendreAvecProviders(<RendezVousPage />)
        await screen.findByText('Inspection des freins')

        await utilisateur.click(
            screen.getByRole('button', { name: 'Prendre un rendez-vous' }),
        )
        await utilisateur.click(
            await screen.findByRole('button', { name: 'Prendre le rendez-vous' }),
        )

        expect(
            await screen.findByText('La date et le motif sont requis.'),
        ).toBeInTheDocument()
        expect(creerRendezVous).not.toHaveBeenCalled()
    })

    it("annule un rendez-vous après confirmation et pas sans elle", async () => {
        annulerRendezVous.mockResolvedValue({})
        const confirmation = vi.spyOn(window, 'confirm').mockReturnValue(true)
        const utilisateur = userEvent.setup()
        rendreAvecProviders(<RendezVousPage />)
        await screen.findByText('Inspection des freins')

        const ligneActive = within(ligneDe('Inspection des freins'))
        await utilisateur.click(ligneActive.getByRole('button', { name: 'Annuler' }))

        expect(confirmation).toHaveBeenCalled()
        await waitFor(() => {
            expect(annulerRendezVous).toHaveBeenCalled()
        })
        expect(annulerRendezVous.mock.calls[0][0]).toBe(1)

        confirmation.mockReturnValue(false)
        await utilisateur.click(ligneActive.getByRole('button', { name: 'Annuler' }))
        expect(annulerRendezVous).toHaveBeenCalledTimes(1)
    })

    it("affiche l'erreur renvoyée par l'API dans le modal", async () => {
        creerRendezVous.mockRejectedValue({
            response: {
                data: { date_heure: ['La date du rendez-vous doit être dans le futur.'] },
            },
        })
        const utilisateur = userEvent.setup()
        rendreAvecProviders(<RendezVousPage />)
        await screen.findByText('Inspection des freins')

        await utilisateur.click(
            screen.getByRole('button', { name: 'Prendre un rendez-vous' }),
        )
        await utilisateur.type(
            await screen.findByLabelText(/Date et heure/),
            '2026-10-05T14:00',
        )
        await utilisateur.type(screen.getByLabelText(/Motif de la visite/), 'Test erreur')
        await utilisateur.click(
            screen.getByRole('button', { name: 'Prendre le rendez-vous' }),
        )

        expect(
            await screen.findByText('La date du rendez-vous doit être dans le futur.'),
        ).toBeInTheDocument()
    })
})