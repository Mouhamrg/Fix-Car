import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
    Badge,
    Button,
    Group,
    Modal,
    Stack,
    Table,
    Text,
    Textarea,
    TextInput,
    Title,
} from '@mantine/core'
import AppLayout from '../components/AppLayout.jsx'
import {
    annulerRendezVous,
    creerRendezVous,
    listerRendezVous,
    modifierRendezVous,
} from '../api/rendez-vous.js'

const STYLE_STATUT = {
    demande: { variant: 'outline', style: {} },
    confirme: { variant: 'filled', style: {} },
    annule: { variant: 'outline', style: { textDecoration: 'line-through', opacity: 0.5 } },
    complete: { variant: 'outline', style: { borderStyle: 'dashed' } },
}

function BadgeStatut({ statut, libelle }) {
    const config = STYLE_STATUT[statut] ?? STYLE_STATUT.demande
    return (
        <Badge variant={config.variant} style={config.style}>
            {libelle}
        </Badge>
    )
}

// datetime-local veut "AAAA-MM-JJTHH:MM" en heure locale
function versDatetimeLocal(iso) {
    const d = new Date(iso)
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    return d.toISOString().slice(0, 16)
}
// Arrondit la saisie au quart d'heure le plus proche (10:23 -> 10:30)
function arrondirAuQuartDHeure(valeur) {
    if (!valeur) return valeur
    const d = new Date(valeur)
    d.setMinutes(Math.round(d.getMinutes() / 15) * 15, 0, 0)
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    return d.toISOString().slice(0, 16)
}

const formVide = { date_heure: '', motif: '' }

export default function RendezVousPage() {
    const queryClient = useQueryClient()
    const [modalOuvert, setModalOuvert] = useState(false)
    const [rdvEnEdition, setRdvEnEdition] = useState(null)
    const [formulaire, setFormulaire] = useState(formVide)
    const [erreur, setErreur] = useState(null)

    const { data: rendezVous = [], isPending } = useQuery({
        queryKey: ['rendez-vous'],
        queryFn: listerRendezVous,
    })

    const invalider = () => queryClient.invalidateQueries({ queryKey: ['rendez-vous'] })

    const extraireErreur = (e) => {
        const donnees = e?.response?.data
        if (!donnees) return 'Une erreur est survenue.'
        if (donnees.detail) return donnees.detail
        return Object.values(donnees).flat().join(' ')
    }

    const creation = useMutation({
        mutationFn: creerRendezVous,
        onSuccess: () => { invalider(); fermerModal() },
        onError: (e) => setErreur(extraireErreur(e)),
    })

    const modification = useMutation({
        mutationFn: ({ id, donnees }) => modifierRendezVous(id, donnees),
        onSuccess: () => { invalider(); fermerModal() },
        onError: (e) => setErreur(extraireErreur(e)),
    })

    const annulation = useMutation({
        mutationFn: annulerRendezVous,
        onSuccess: invalider,
        onError: (e) => setErreur(extraireErreur(e)),
    })

    function ouvrirCreation() {
        setRdvEnEdition(null)
        setFormulaire(formVide)
        setErreur(null)
        setModalOuvert(true)
    }

    function ouvrirModification(rdv) {
        setRdvEnEdition(rdv)
        setFormulaire({ date_heure: versDatetimeLocal(rdv.date_heure), motif: rdv.motif })
        setErreur(null)
        setModalOuvert(true)
    }

    function fermerModal() {
        setModalOuvert(false)
        setErreur(null)
    }

    function soumettre() {
        if (!formulaire.date_heure || !formulaire.motif.trim()) {
            setErreur('La date et le motif sont requis.')
            return
        }
        const date = new Date(formulaire.date_heure)
        if (date.getMinutes() % 15 !== 0) {
            setErreur('Les rendez-vous se prennent aux 15 minutes (ex. 13 h 00, 13 h 15, 13 h 30).')
            return
        }
        const donnees = {
            date_heure: date.toISOString(),
            motif: formulaire.motif.trim(),
        }
        if (rdvEnEdition) {
            modification.mutate({ id: rdvEnEdition.id, donnees })
        } else {
            creation.mutate(donnees)
        }
    }

    return (
        <AppLayout>
            <Stack gap="lg">
                <Group justify="space-between">
                    <Title order={2}>Mes rendez-vous</Title>
                    <Button onClick={ouvrirCreation}>Prendre un rendez-vous</Button>
                </Group>

                {erreur && !modalOuvert && <Text size="sm" fw={500}>{erreur}</Text>}

                {isPending ? (
                    <Text c="dimmed">Chargement des rendez-vous…</Text>
                ) : rendezVous.length === 0 ? (
                    <Text c="dimmed">
                        Aucun rendez-vous pour le moment. Prenez votre premier rendez-vous pour
                        planifier votre visite au garage.
                    </Text>
                ) : (
                    <Table withTableBorder verticalSpacing="sm">
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Date et heure</Table.Th>
                                <Table.Th>Motif</Table.Th>
                                <Table.Th>Statut</Table.Th>
                                <Table.Th />
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {rendezVous.map((rdv) => {
                                const terminal = rdv.statut === 'annule' || rdv.statut === 'complete'
                                return (
                                    <Table.Tr key={rdv.id}>
                                        <Table.Td>
                                            {new Date(rdv.date_heure).toLocaleString('fr-CA', {
                                                dateStyle: 'medium',
                                                timeStyle: 'short',
                                            })}
                                        </Table.Td>
                                        <Table.Td>{rdv.motif}</Table.Td>
                                        <Table.Td>
                                            <BadgeStatut statut={rdv.statut} libelle={rdv.statut_affiche} />
                                        </Table.Td>
                                        <Table.Td>
                                            <Group gap="xs" justify="flex-end">
                                                <Button
                                                    size="xs"
                                                    variant="default"
                                                    disabled={terminal}
                                                    onClick={() => ouvrirModification(rdv)}
                                                >
                                                    Modifier
                                                </Button>
                                                <Button
                                                    size="xs"
                                                    variant="outline"
                                                    disabled={terminal}
                                                    onClick={() => {
                                                        if (window.confirm('Annuler ce rendez-vous ?')) {
                                                            annulation.mutate(rdv.id)
                                                        }
                                                    }}
                                                >
                                                    Annuler
                                                </Button>
                                            </Group>
                                        </Table.Td>
                                    </Table.Tr>
                                )
                            })}
                        </Table.Tbody>
                    </Table>
                )}
            </Stack>

            <Modal
                opened={modalOuvert}
                onClose={fermerModal}
                title={rdvEnEdition ? 'Modifier le rendez-vous' : 'Prendre un rendez-vous'}
                centered
            >
                <Stack gap="md">
                    <TextInput
                        type="datetime-local"
                        label="Date et heure"
                        value={formulaire.date_heure}
                        onChange={(e) =>
                            setFormulaire({ ...formulaire, date_heure: arrondirAuQuartDHeure(e.currentTarget.value) })
                        }
                        step={900}
                        required
                    />
                    <Textarea
                        label="Motif de la visite"
                        placeholder="Décrivez la raison de votre visite"
                        value={formulaire.motif}
                        onChange={(e) => setFormulaire({ ...formulaire, motif: e.currentTarget.value })}
                        maxLength={200}
                        required
                    />
                    {rdvEnEdition?.statut === 'confirme' && (
                        <Text size="xs" c="dimmed">
                            Ce rendez-vous est confirmé : toute modification le remettra en attente de
                            confirmation par le garage.
                        </Text>
                    )}
                    {erreur && <Text size="sm" fw={500}>{erreur}</Text>}
                    <Group justify="flex-end">
                        <Button variant="default" onClick={fermerModal}>Fermer</Button>
                        <Button
                            loading={creation.isPending || modification.isPending}
                            onClick={soumettre}
                        >
                            {rdvEnEdition ? 'Enregistrer' : 'Prendre le rendez-vous'}
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </AppLayout>
    )
}