import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Alert,
  Badge,
  Button,
  Group,
  Loader,
  Modal,
  Table,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core'
import AppLayout from '../components/AppLayout.jsx'
import api from '../api/client.js'
import {
  createDemande,
  deleteDemande,
  listDemandes,
  updateDemande,
} from '../api/demandes.js'
import { listerDiagnostics } from '../api/diagnosticsApi'

const formVide = {
  titre: '',
  vehicule: '',
  description: '',
}

const statuts = {
  en_attente: 'En attente',
  acceptee: 'Acceptée',
  refusee: 'Refusée',
  terminee: 'Terminée',
}

export default function DemandesPage() {
  const queryClient = useQueryClient()
  const location = useLocation()
  const navigate = useNavigate()
  const [modalOuvert, setModalOuvert] = useState(false)
  const [enEdition, setEnEdition] = useState(null) // demande en cours d'édition, sinon null
  const [form, setForm] = useState(formVide)
  const [erreur, setErreur] = useState(null)
  const [messageSucces, setMessageSucces] = useState(location.state?.message ?? null)

  // Efface le message de l'historique de navigation pour qu'il ne
  // réapparaisse pas si le client revient sur cette page plus tard.
  useEffect(() => {
    if (location.state?.message) {
      navigate(location.pathname, { replace: true, state: {} })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { data: moi } = useQuery({
    queryKey: ['me'],
    queryFn: async () => (await api.get('/api/me/')).data,
  })

  const { data: demandes, isLoading } = useQuery({
    queryKey: ['demandes'],
    queryFn: listDemandes,
  })

  const { data: diagnostics } = useQuery({
    queryKey: ['diagnostics'],
    queryFn: listerDiagnostics,
  })
  const diagnosticParDemande = new Map((diagnostics ?? []).map((d) => [d.demande, d]))

  function surSucces() {
    queryClient.invalidateQueries({ queryKey: ['demandes'] })
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
    mutationFn: createDemande,
    onSuccess: surSucces,
    onError: surErreur,
  })
  const modification = useMutation({
    mutationFn: ({ id, ...donnees }) => updateDemande(id, donnees),
    onSuccess: surSucces,
    onError: surErreur,
  })
  const suppression = useMutation({
    mutationFn: deleteDemande,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['demandes'] }),
  })

  function ouvrirCreation() {
    setEnEdition(null)
    setForm(formVide)
    setErreur(null)
    setModalOuvert(true)
  }

  function ouvrirEdition(demande) {
    setEnEdition(demande)
    setForm({
      titre: demande.titre,
      vehicule: demande.vehicule,
      description: demande.description,
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

  function supprimer(demande) {
    if (window.confirm(`Supprimer la demande « ${demande.titre} » ?`)) {
      suppression.mutate(demande.id)
    }
  }

  function champ(nom, valeur) {
    setForm((precedent) => ({ ...precedent, [nom]: valeur }))
  }

  const lignes = (demandes ?? []).map((demande) => (
    <Table.Tr key={demande.id}>
      <Table.Td fw={600}>{demande.titre}</Table.Td>
      <Table.Td>{demande.vehicule}</Table.Td>
      <Table.Td>{demande.client_nom}</Table.Td>
      <Table.Td>
        <Badge
          variant={['terminee', 'refusee'].includes(demande.statut) ? 'filled' : 'outline'}
          color="mono.9"
        >
          {statuts[demande.statut]}
        </Badge>
      </Table.Td>
      <Table.Td>
        {moi?.id === demande.client && (
          <Group gap="xs" wrap="nowrap">
            <Button
              size="compact-sm"
              variant="outline"
              onClick={() => ouvrirEdition(demande)}
            >
              Modifier
            </Button>
            <Button
              size="compact-sm"
              variant="subtle"
              onClick={() => supprimer(demande)}
            >
              Supprimer
            </Button>
          </Group>
        )}
      </Table.Td>
      <Table.Td>
        {(() => {
          const diagnostic = diagnosticParDemande.get(demande.id)
          if (!diagnostic) {
            return (
              <Link
                to={`/diagnostics/nouveau?demande=${demande.id}`}
                className="bouton bouton--principal"
              >
                Ajouter un diagnostic
              </Link>
            )
          }
          return (
            <Group gap="xs" wrap="nowrap">
              <Badge
                variant={diagnostic.statut === 'ACCEPTE' ? 'filled' : 'outline'}
                color="mono.9"
              >
                {diagnostic.statut_affichage}
              </Badge>
              <Link
                to={`/diagnostics/${diagnostic.id}/modifier`}
                className="bouton bouton--discret"
              >
                Voir le devis
              </Link>
            </Group>
          )
        })()}
      </Table.Td>
    </Table.Tr>
  ))

  return (
    <AppLayout>
      <Group justify="space-between" mb="lg">
        <Title order={2}>Demandes de réparation</Title>
        <Button onClick={ouvrirCreation}>+ Nouvelle demande</Button>
      </Group>

      {messageSucces && (
        <Alert
          color="mono.9"
          variant="outline"
          mb="lg"
          withCloseButton
          onClose={() => setMessageSucces(null)}
        >
          {messageSucces}
        </Alert>
      )}

      {isLoading ? (
        <Loader color="black" />
      ) : lignes.length === 0 ? (
        <Text>Aucune demande de réparation pour le moment.</Text>
      ) : (
        <Table withTableBorder withColumnBorders style={{ borderColor: '#000' }}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Titre</Table.Th>
              <Table.Th>Véhicule</Table.Th>
              <Table.Th>Client</Table.Th>
              <Table.Th>Statut</Table.Th>
              <Table.Th>Actions</Table.Th>
              <Table.Th>Diagnostic</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{lignes}</Table.Tbody>
        </Table>
      )}

      <Modal
        opened={modalOuvert}
        onClose={fermerModal}
        title={enEdition ? 'Modifier la demande' : 'Nouvelle demande de réparation'}
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
            label="Description du problème"
            value={form.description}
            onChange={(e) => champ('description', e.target.value)}
            required
            autosize
            minRows={3}
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
