import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
    Badge,
    Button,
    Group,
    Modal,
    NumberInput,
    Select,
    Stack,
    Table,
    Text,
    Title,
} from '@mantine/core'
import AppLayout from '../components/AppLayout.jsx'
import { creerFacture, listerFactures } from '../api/factures.js'
import { listDemandes } from '../api/demandes.js'

const STATUTS = {
    emise: 'Émise',
    payee: 'Payée',
    annulee: 'Annulée',
}

const formateurMontant = new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency: 'CAD',
})

function BadgeStatut({ statut }) {
    return (
        <Badge variant={statut === 'emise' ? 'outline' : 'filled'} color="mono.9">
            {STATUTS[statut] ?? statut}
        </Badge>
    )
}

const formVide = { demande: '', montant_main_oeuvre: '', montant_pieces: '' }

export default function FacturesPage() {
    const queryClient = useQueryClient()
    const [modalOuvert, setModalOuvert] = useState(false)
    const [formulaire, setFormulaire] = useState(formVide)
    const [erreur, setErreur] = useState(null)

    const { data: factures = [], isPending } = useQuery({
        queryKey: ['factures'],
        queryFn: listerFactures,
    })

    const { data: demandes = [] } = useQuery({
        queryKey: ['demandes'],
        queryFn: listDemandes,
    })

    const demandesDejaFacturees = new Set(factures.map((f) => f.demande))
    const demandesFacturables = demandes.filter((d) => !demandesDejaFacturees.has(d.id))

    const extraireErreur = (e) => {
        const donnees = e?.response?.data
        if (!donnees) return 'Une erreur est survenue.'
        if (donnees.detail) return donnees.detail
        return Object.values(donnees).flat().join(' ')
    }

    const creation = useMutation({
        mutationFn: creerFacture,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['factures'] })
            fermerModal()
        },
        onError: (e) => setErreur(extraireErreur(e)),
    })

    function ouvrirCreation() {
        setFormulaire(formVide)
        setErreur(null)
        setModalOuvert(true)
    }

    function fermerModal() {
        setModalOuvert(false)
        setErreur(null)
    }

    function soumettre() {
        if (!formulaire.demande || formulaire.montant_main_oeuvre === '' || formulaire.montant_pieces === '') {
            setErreur("La demande, le montant de main-d'œuvre et le montant des pièces sont requis.")
            return
        }
        creation.mutate({
            demande: Number(formulaire.demande),
            montant_main_oeuvre: formulaire.montant_main_oeuvre,
            montant_pieces: formulaire.montant_pieces,
        })
    }

    return (
        <AppLayout>
            <Stack gap="lg">
                <Group justify="space-between">
                    <Title order={2}>Factures</Title>
                    <Button onClick={ouvrirCreation}>Générer une facture</Button>
                </Group>

                {isPending ? (
                    <Text c="dimmed">Chargement des factures…</Text>
                ) : factures.length === 0 ? (
                    <Text c="dimmed">Aucune facture émise pour le moment.</Text>
                ) : (
                    <Table withTableBorder verticalSpacing="sm">
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Numéro</Table.Th>
                                <Table.Th>Demande</Table.Th>
                                <Table.Th>Main-d'œuvre</Table.Th>
                                <Table.Th>Pièces</Table.Th>
                                <Table.Th>TPS</Table.Th>
                                <Table.Th>TVQ</Table.Th>
                                <Table.Th>Total</Table.Th>
                                <Table.Th>Statut</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {factures.map((facture) => (
                                <Table.Tr key={facture.id}>
                                    <Table.Td fw={600}>{facture.numero}</Table.Td>
                                    <Table.Td>{facture.demande_titre}</Table.Td>
                                    <Table.Td>{formateurMontant.format(facture.montant_main_oeuvre)}</Table.Td>
                                    <Table.Td>{formateurMontant.format(facture.montant_pieces)}</Table.Td>
                                    <Table.Td>{formateurMontant.format(facture.tps)}</Table.Td>
                                    <Table.Td>{formateurMontant.format(facture.tvq)}</Table.Td>
                                    <Table.Td fw={600}>{formateurMontant.format(facture.montant_total)}</Table.Td>
                                    <Table.Td>
                                        <BadgeStatut statut={facture.statut} />
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                )}
            </Stack>

            <Modal opened={modalOuvert} onClose={fermerModal} title="Générer une facture" centered>
                <Stack gap="md">
                    <Select
                        label="Demande de réparation"
                        placeholder="Choisir une demande"
                        data={demandesFacturables.map((d) => ({
                            value: String(d.id),
                            label: `${d.titre} — ${d.vehicule}`,
                        }))}
                        value={formulaire.demande}
                        onChange={(valeur) => setFormulaire({ ...formulaire, demande: valeur })}
                        required
                    />
                    <NumberInput
                        label="Montant main-d'œuvre ($)"
                        min={0}
                        decimalScale={2}
                        fixedDecimalScale
                        value={formulaire.montant_main_oeuvre}
                        onChange={(valeur) => setFormulaire({ ...formulaire, montant_main_oeuvre: valeur })}
                        required
                    />
                    <NumberInput
                        label="Montant pièces ($)"
                        min={0}
                        decimalScale={2}
                        fixedDecimalScale
                        value={formulaire.montant_pieces}
                        onChange={(valeur) => setFormulaire({ ...formulaire, montant_pieces: valeur })}
                        required
                    />
                    <Text size="xs" c="dimmed">
                        La TPS (5 %), la TVQ (9,975 %) et le total sont calculés automatiquement à l'émission.
                    </Text>
                    {erreur && <Text size="sm" fw={500}>{erreur}</Text>}
                    <Group justify="flex-end">
                        <Button variant="default" onClick={fermerModal}>Fermer</Button>
                        <Button loading={creation.isPending} onClick={soumettre}>
                            Générer la facture
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </AppLayout>
    )
}
