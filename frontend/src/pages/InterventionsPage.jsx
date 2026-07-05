import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Badge,
  Button,
  Group,
  Loader,
  Modal,
  NumberInput,
  Select,
  Table,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core'
import AppLayout from '../components/AppLayout.jsx'
import api from '../api/client.js'
import {
  createIntervention,
  deleteIntervention,
  listInterventions,
  updateIntervention,
} from '../api/interventions.js'

const formVide = {
  titre: '',
  vehicule: '',
  description: '',
  date_intervention: new Date().toISOString().slice(0, 10),
  duree_heures: 1,
  pieces_utilisees: '',
  statut: 'en_cours',
}

export default function InterventionsPage() {
  const queryClient = useQueryClient()
  const [modalOuvert, setModalOuvert] = useState(false)
  const [enEdition, setEnEdition] = useState(null) // intervention en cours d'édition, sinon null
  const [form, setForm] = useState(formVide)
  const [erreur, setErreur] = useState(null)

  const { data: moi } = useQuery({
    queryKey: ['me'],
    queryFn: async () => (await api.get('/api/me/')).data,
  })

  const { data: interventions, isLoading } = useQuery({
    queryKey: ['interventions'],
    queryFn: listInterventions,
  })

  function surSucces() {
    queryClient.invalidateQueries({ queryKey: ['interventions'] })
    fermerModal()
  }

  function surErreur(err) {
    const details = err.response?.data
    setErreur(
      details && typeof details === 'object'
        ? Object.entries(details)
            .map(([champ, messages]) => `${champ} : ${[].concat(messages).join(' ')}`)
            .join(' — ')
        : "L'enregistrement a échoué. Réessayez.",
    )
  }

  const creation = useMutation({
    mutationFn: createIntervention,
    onSuccess: surSucces,
    onError: surErreur,
  })
  const modification = useMutation({
    mutationFn: ({ id, ...donnees }) => updateIntervention(id, donnees),
    onSuccess: surSucces,
    onError: surErreur,
  })
  const suppression = useMutation({
    mutationFn: deleteIntervention,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['interventions'] }),
  })

  function ouvrirCreation() {
    setEnEdition(null)
    setForm(formVide)
    setErreur(null)
    setModalOuvert(true)
  }

  function ouvrirEdition(intervention) {
    setEnEdition(intervention)
    setForm({
      titre: intervention.titre,
      vehicule: intervention.vehicule,
      description: intervention.description,
      date_intervention: intervention.date_intervention,
      duree_heures: Number(intervention.duree_heures),
      pieces_utilisees: intervention.pieces_utilisees,
      statut: intervention.statut,
    })
    setErreur(null)
    setModalOuvert(true)
  }

  function fermerModal() {
    setModalOuvert(false)
    setEnEdition(null)
    setErreur(null)
  }

  function soumettre(event) {
    event.preventDefault()
    if (enEdition) {
      modification.mutate({ id: enEdition.id, ...form })
    } else {
      creation.mutate(form)
    }
  }

  function supprimer(intervention) {
    if (window.confirm(`Supprimer l'intervention « ${intervention.titre} » ?`)) {
      suppression.mutate(intervention.id)
    }
  }

  function champ(nom, valeur) {
    setForm((precedent) => ({ ...precedent, [nom]: valeur }))
  }

  const lignes = (interventions ?? []).map((intervention) => (
    <Table.Tr key={intervention.id}>
      <Table.Td fw={600}>{intervention.titre}</Table.Td>
      <Table.Td>{intervention.vehicule}</Table.Td>
      <Table.Td>{intervention.date_intervention}</Table.Td>
      <Table.Td>{Number(intervention.duree_heures)} h</Table.Td>
      <Table.Td>
        <Badge
          variant={intervention.statut === 'terminee' ? 'filled' : 'outline'}
          color="mono.9"
        >
          {intervention.statut === 'terminee' ? 'Terminée' : 'En cours'}
        </Badge>
      </Table.Td>
      <Table.Td>{intervention.mecanicien_nom}</Table.Td>
      <Table.Td>
        {moi?.id === intervention.mecanicien && (
          <Group gap="xs" wrap="nowrap">
            <Button
              size="compact-sm"
              variant="outline"
              onClick={() => ouvrirEdition(intervention)}
            >
              Modifier
            </Button>
            <Button
              size="compact-sm"
              variant="subtle"
              onClick={() => supprimer(intervention)}
            >
              Supprimer
            </Button>
          </Group>
        )}
      </Table.Td>
    </Table.Tr>
  ))

  return (
    <AppLayout>
      <Group justify="space-between" mb="lg">
        <Title order={2}>Interventions mécaniques</Title>
        <Button onClick={ouvrirCreation}>+ Nouvelle intervention</Button>
      </Group>

      {isLoading ? (
        <Loader color="black" />
      ) : lignes.length === 0 ? (
        <Text>Aucune intervention documentée pour le moment.</Text>
      ) : (
        <Table withTableBorder withColumnBorders style={{ borderColor: '#000' }}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Titre</Table.Th>
              <Table.Th>Véhicule</Table.Th>
              <Table.Th>Date</Table.Th>
              <Table.Th>Durée</Table.Th>
              <Table.Th>Statut</Table.Th>
              <Table.Th>Mécanicien</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{lignes}</Table.Tbody>
        </Table>
      )}

      <Modal
        opened={modalOuvert}
        onClose={fermerModal}
        title={enEdition ? "Modifier l'intervention" : 'Nouvelle intervention'}
        centered
      >
        <form onSubmit={soumettre}>
          {erreur && (
            <Alert color="mono.9" variant="outline" mb="md">
              {erreur}
            </Alert>
          )}
          <TextInput
            label="Titre"
            value={form.titre}
            onChange={(e) => champ('titre', e.target.value)}
            required
          />
          <TextInput
            label="Véhicule"
            placeholder="ex. Honda Civic 2019 — ABC 123"
            value={form.vehicule}
            onChange={(e) => champ('vehicule', e.target.value)}
            required
            mt="sm"
          />
          <Textarea
            label="Travaux effectués"
            value={form.description}
            onChange={(e) => champ('description', e.target.value)}
            required
            autosize
            minRows={3}
            mt="sm"
          />
          <Group grow mt="sm">
            <TextInput
              type="date"
              label="Date de l'intervention"
              value={form.date_intervention}
              onChange={(e) => champ('date_intervention', e.target.value)}
              required
            />
            <NumberInput
              label="Durée (heures)"
              value={form.duree_heures}
              onChange={(valeur) => champ('duree_heures', valeur)}
              min={0.25}
              step={0.25}
              decimalScale={2}
              required
            />
          </Group>
          <Textarea
            label="Pièces utilisées (optionnel)"
            value={form.pieces_utilisees}
            onChange={(e) => champ('pieces_utilisees', e.target.value)}
            autosize
            minRows={2}
            mt="sm"
          />
          <Select
            label="Statut"
            value={form.statut}
            onChange={(valeur) => champ('statut', valeur)}
            data={[
              { value: 'en_cours', label: 'En cours' },
              { value: 'terminee', label: 'Terminée' },
            ]}
            allowDeselect={false}
            mt="sm"
          />
          <Group justify="flex-end" mt="lg">
            <Button variant="outline" onClick={fermerModal}>
              Annuler
            </Button>
            <Button
              type="submit"
              loading={creation.isPending || modification.isPending}
            >
              Enregistrer
            </Button>
          </Group>
        </form>
      </Modal>
    </AppLayout>
  )
}
