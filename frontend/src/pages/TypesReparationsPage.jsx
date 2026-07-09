import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Button,
  Group,
  Loader,
  Modal,
  NumberInput,
  Table,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core'
import AppLayout from '../components/AppLayout.jsx'
import {
  createTypeReparation,
  deleteTypeReparation,
  listTypesReparations,
  updateTypeReparation,
} from '../api/typesReparations.js'

const formVide = {
  nom: '',
  description: '',
  duree_estimee_heures: 1,
  prix_standard: 0,
}

export default function TypesReparationsPage() {
  const queryClient = useQueryClient()
  const [modalOuvert, setModalOuvert] = useState(false)
  const [enEdition, setEnEdition] = useState(null) // type en cours d'édition, sinon null
  const [form, setForm] = useState(formVide)
  const [erreur, setErreur] = useState(null)

  const { data: typesReparations, isLoading } = useQuery({
    queryKey: ['types-reparations'],
    queryFn: listTypesReparations,
  })

  function surSucces() {
    queryClient.invalidateQueries({ queryKey: ['types-reparations'] })
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
    mutationFn: createTypeReparation,
    onSuccess: surSucces,
    onError: surErreur,
  })
  const modification = useMutation({
    mutationFn: ({ id, ...donnees }) => updateTypeReparation(id, donnees),
    onSuccess: surSucces,
    onError: surErreur,
  })
  const suppression = useMutation({
    mutationFn: deleteTypeReparation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['types-reparations'] }),
  })

  function ouvrirCreation() {
    setEnEdition(null)
    setForm(formVide)
    setErreur(null)
    setModalOuvert(true)
  }

  function ouvrirEdition(typeReparation) {
    setEnEdition(typeReparation)
    setForm({
      nom: typeReparation.nom,
      description: typeReparation.description,
      duree_estimee_heures: Number(typeReparation.duree_estimee_heures),
      prix_standard: Number(typeReparation.prix_standard),
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

  function supprimer(typeReparation) {
    if (window.confirm(`Supprimer le type de réparation « ${typeReparation.nom} » ?`)) {
      suppression.mutate(typeReparation.id)
    }
  }

  function champ(nom, valeur) {
    setForm((precedent) => ({ ...precedent, [nom]: valeur }))
  }

  const lignes = (typesReparations ?? []).map((typeReparation) => (
    <Table.Tr key={typeReparation.id}>
      <Table.Td fw={600}>{typeReparation.nom}</Table.Td>
      <Table.Td>{Number(typeReparation.duree_estimee_heures)} h</Table.Td>
      <Table.Td>{Number(typeReparation.prix_standard).toFixed(2)} $</Table.Td>
      <Table.Td>
        <Group gap="xs" wrap="nowrap">
          <Button
            size="compact-sm"
            variant="outline"
            onClick={() => ouvrirEdition(typeReparation)}
          >
            Modifier
          </Button>
          <Button
            size="compact-sm"
            variant="subtle"
            onClick={() => supprimer(typeReparation)}
          >
            Supprimer
          </Button>
        </Group>
      </Table.Td>
    </Table.Tr>
  ))

  return (
    <AppLayout>
      <Group justify="space-between" mb="lg">
        <Title order={2}>Types de réparation</Title>
        <Button onClick={ouvrirCreation}>+ Nouveau type</Button>
      </Group>

      {isLoading ? (
        <Loader color="black" />
      ) : lignes.length === 0 ? (
        <Text>Aucun type de réparation dans le catalogue pour le moment.</Text>
      ) : (
        <Table withTableBorder withColumnBorders style={{ borderColor: '#000' }}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nom</Table.Th>
              <Table.Th>Durée estimée</Table.Th>
              <Table.Th>Prix standard</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{lignes}</Table.Tbody>
        </Table>
      )}

      <Modal
        opened={modalOuvert}
        onClose={fermerModal}
        title={enEdition ? 'Modifier le type de réparation' : 'Nouveau type de réparation'}
        centered
      >
        <form onSubmit={soumettre}>
          {erreur && (
            <Alert color="mono.9" variant="outline" mb="md">
              {erreur}
            </Alert>
          )}
          <TextInput
            label="Nom"
            value={form.nom}
            onChange={(e) => champ('nom', e.target.value)}
            required
          />
          <Textarea
            label="Description (optionnel)"
            value={form.description}
            onChange={(e) => champ('description', e.target.value)}
            autosize
            minRows={2}
            mt="sm"
          />
          <Group grow mt="sm">
            <NumberInput
              label="Durée estimée (heures)"
              value={form.duree_estimee_heures}
              onChange={(valeur) => champ('duree_estimee_heures', valeur)}
              min={0.25}
              step={0.25}
              decimalScale={2}
              required
            />
            <NumberInput
              label="Prix standard ($)"
              value={form.prix_standard}
              onChange={(valeur) => champ('prix_standard', valeur)}
              min={0}
              step={0.01}
              decimalScale={2}
              required
            />
          </Group>
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
