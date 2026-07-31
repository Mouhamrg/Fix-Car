import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Badge, Button, Group, Modal, NumberInput, Select, Stack, Table, Text, Title } from '@mantine/core'
import AppLayout from '../components/AppLayout.jsx'
import { listMesDemandes } from '../api/demandes.js'
import { genererFacture, listerFactures, telechargerFacturePdf } from '../api/factures.js'
import { creerPaiement } from '../api/paiements.js'

const METHODES_PAIEMENT = [
    { value: 'carte', label: 'Carte de crédit/débit' },
    { value: 'virement', label: 'Virement bancaire' },
    { value: 'especes', label: 'Espèces' },
    { value: 'autre', label: 'Autre' },
]

const LIBELLE_STATUT = {
    en_attente: 'En attente',
    acceptee: 'Acceptée',
    refusee: 'Refusée',
    terminee: 'Terminée',
}

const STYLE_STATUT = {
    en_attente: { variant: 'outline', style: {} },
    acceptee: { variant: 'filled', style: {} },
    refusee: { variant: 'outline', style: { textDecoration: 'line-through', opacity: 0.5 } },
    terminee: { variant: 'outline', style: { borderStyle: 'dashed' } },
}

const formateurMontant = new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency: 'CAD',
})

function BadgeStatut({ statut }) {
    const config = STYLE_STATUT[statut] ?? STYLE_STATUT.en_attente
    return (
        <Badge variant={config.variant} style={config.style}>
            {LIBELLE_STATUT[statut] ?? statut}
        </Badge>
    )
}

function extraireErreur(e) {
    const donnees = e?.response?.data
    if (!donnees) return 'Une erreur est survenue.'
    if (donnees.detail) return donnees.detail
    return Object.values(donnees).flat().join(' ')
}

export default function SuiviReparationsPage() {
    const queryClient = useQueryClient()

    const { data: demandes = [], isPending } = useQuery({
        queryKey: ['demandes'],
        queryFn: listMesDemandes,
    })

    const { data: factures = [] } = useQuery({
        queryKey: ['factures'],
        queryFn: listerFactures,
    })

    const generation = useMutation({
        mutationFn: genererFacture,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['factures'] })
        },
    })

    const telechargement = useMutation({
        mutationFn: ({ id, numero }) => telechargerFacturePdf(id, numero),
    })

    const [factureAPayer, setFactureAPayer] = useState(null)
    const [montantPaiement, setMontantPaiement] = useState(0)
    const [methodePaiement, setMethodePaiement] = useState('carte')

    const paiement = useMutation({
        mutationFn: creerPaiement,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['factures'] })
            setFactureAPayer(null)
        },
    })

    function ouvrirPaiement(facture) {
        paiement.reset()
        setMontantPaiement(facture.montant_total)
        setMethodePaiement('carte')
        setFactureAPayer(facture)
    }

    function confirmerPaiement() {
        paiement.mutate({
            facture: factureAPayer.id,
            montant: montantPaiement,
            methode: methodePaiement,
        })
    }

    const facturesParDemande = new Map(factures.map((f) => [f.demande, f]))

    return (
        <AppLayout>
            <Stack gap="lg">
                <Title order={2}>Suivi de mes réparations</Title>

                {isPending ? (
                    <Text c="dimmed">Chargement des réparations…</Text>
                ) : demandes.length === 0 ? (
                    <Text c="dimmed">
                        Aucune demande de réparation pour le moment. Soumettez une demande
                        depuis la page « Demandes de réparation » pour suivre son avancement ici.
                    </Text>
                ) : (
                    <Table withTableBorder verticalSpacing="sm">
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Demande</Table.Th>
                                <Table.Th>Véhicule</Table.Th>
                                <Table.Th>État d'avancement</Table.Th>
                                <Table.Th>Dernière mise à jour</Table.Th>
                                <Table.Th>Facture</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {demandes.map((demande) => {
                                const facture = facturesParDemande.get(demande.id)
                                const enCours = generation.isPending && generation.variables === demande.id
                                const erreur =
                                    generation.isError && generation.variables === demande.id
                                        ? extraireErreur(generation.error)
                                        : null

                                return (
                                    <Table.Tr key={demande.id}>
                                        <Table.Td>{demande.titre}</Table.Td>
                                        <Table.Td>{demande.vehicule}</Table.Td>
                                        <Table.Td>
                                            <BadgeStatut statut={demande.statut} />
                                        </Table.Td>
                                        <Table.Td>
                                            {new Date(demande.date_modification).toLocaleString('fr-CA', {
                                                dateStyle: 'medium',
                                                timeStyle: 'short',
                                            })}
                                        </Table.Td>
                                        <Table.Td>
                                            {demande.statut !== 'terminee' ? (
                                                <Text c="dimmed" size="sm">—</Text>
                                            ) : facture ? (
                                                <Stack gap={4}>
                                                    <Group gap={6}>
                                                        <Text size="sm">
                                                            {facture.numero} — {formateurMontant.format(facture.montant_total)}
                                                        </Text>
                                                        <Badge
                                                            size="sm"
                                                            color={facture.statut === 'payee' ? 'teal' : 'orange'}
                                                            variant="light"
                                                        >
                                                            {facture.statut === 'payee' ? 'Payée' : 'En attente'}
                                                        </Badge>
                                                    </Group>
                                                    <Group gap={6}>
                                                        <Button
                                                            size="xs"
                                                            variant="outline"
                                                            loading={telechargement.isPending && telechargement.variables?.id === facture.id}
                                                            onClick={() => telechargement.mutate({ id: facture.id, numero: facture.numero })}
                                                        >
                                                            Télécharger le PDF
                                                        </Button>
                                                        {facture.statut !== 'payee' && (
                                                            <Button size="xs" onClick={() => ouvrirPaiement(facture)}>
                                                                Payer
                                                            </Button>
                                                        )}
                                                    </Group>
                                                </Stack>
                                            ) : (
                                                <Stack gap={4}>
                                                    <Button
                                                        size="xs"
                                                        loading={enCours}
                                                        onClick={() => generation.mutate(demande.id)}
                                                    >
                                                        Générer ma facture
                                                    </Button>
                                                    {erreur && (
                                                        <Text size="xs" fw={500}>{erreur}</Text>
                                                    )}
                                                </Stack>
                                            )}
                                        </Table.Td>
                                    </Table.Tr>
                                )
                            })}
                        </Table.Tbody>
                    </Table>
                )}
            </Stack>

            <Modal
                opened={Boolean(factureAPayer)}
                onClose={() => setFactureAPayer(null)}
                title={factureAPayer ? `Payer la facture ${factureAPayer.numero}` : ''}
            >
                <Stack gap="sm">
                    {paiement.isError && (
                        <Text c="red" size="sm">{extraireErreur(paiement.error)}</Text>
                    )}
                    <NumberInput
                        label="Montant"
                        min={0.01}
                        step={0.01}
                        decimalScale={2}
                        value={montantPaiement}
                        onChange={setMontantPaiement}
                    />
                    <Select
                        label="Méthode"
                        data={METHODES_PAIEMENT}
                        value={methodePaiement}
                        onChange={setMethodePaiement}
                    />
                    <Group justify="flex-end">
                        <Button variant="outline" onClick={() => setFactureAPayer(null)}>
                            Annuler
                        </Button>
                        <Button loading={paiement.isPending} onClick={confirmerPaiement}>
                            Confirmer le paiement
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </AppLayout>
    )
}
