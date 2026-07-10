import { useQuery } from '@tanstack/react-query'
import { Badge, Stack, Table, Text, Title } from '@mantine/core'
import AppLayout from '../components/AppLayout.jsx'
import { listDemandes } from '../api/demandes.js'

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

function BadgeStatut({ statut }) {
    const config = STYLE_STATUT[statut] ?? STYLE_STATUT.en_attente
    return (
        <Badge variant={config.variant} style={config.style}>
            {LIBELLE_STATUT[statut] ?? statut}
        </Badge>
    )
}

export default function SuiviReparationsPage() {
    const { data: demandes = [], isPending } = useQuery({
        queryKey: ['demandes'],
        queryFn: listDemandes,
    })

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
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {demandes.map((demande) => (
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
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                )}
            </Stack>
        </AppLayout>
    )
}