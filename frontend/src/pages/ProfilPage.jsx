import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Badge,
  Button,
  Group,
  Loader,
  Modal,
  Select,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import AppLayout from '../components/AppLayout.jsx'
import api from '../api/client.js'
import { Navigate } from 'react-router-dom'
import { listComptes, getCompte, updateCompte, desactiverCompte, supprimerMonCompte, changerRole, reactiverCompte, creerCompte } from '../api/comptes.js'

const formVide = {
  first_name: '',
  last_name: '',
  email: '',
  telephone: '',
  role: 'CLIENT',
}

const formCreationVide = {
  username: '',
  first_name: '',
  last_name: '',
  email: '',
  telephone: '',
  password: '',
  role: 'MECANICIEN',
}

export default function ProfilPage() {
  const queryClient = useQueryClient()
  const [modalOuvert, setModalOuvert] = useState(false)
  const [enEdition, setEnEdition] = useState(null)
  const [form, setForm] = useState(formVide)
  const [erreur, setErreur] = useState(null)
  const [filtreRole, setFiltreRole] = useState('')
  const [modalCreationOuvert, setModalCreationOuvert] = useState(false)
  const [formCreation, setFormCreation] = useState(formCreationVide)
  const [erreurCreation, setErreurCreation] = useState(null)

  const { data: moi } = useQuery({
    queryKey: ['me'],
    queryFn: async () => (await api.get('/api/me/')).data,
  })

  const estAdmin = moi?.role === 'ADMINISTRATEUR'
  const estGestionnaire = moi?.role === 'GESTIONNAIRE'
  const peutCreerCompte = estAdmin || estGestionnaire

  const rolesCreablesParMoi = estAdmin
    ? [
        { value: 'MECANICIEN', label: 'Mécanicien' },
        { value: 'GESTIONNAIRE', label: 'Gestionnaire' },
        { value: 'ADMINISTRATEUR', label: 'Administrateur' },
      ]
    : [
        { value: 'MECANICIEN', label: 'Mécanicien' },
        { value: 'GESTIONNAIRE', label: 'Gestionnaire' },
      ]

  const { data: comptes, isLoading } = useQuery({
    queryKey: ['comptes', filtreRole, moi?.id, estAdmin],
    enabled: Boolean(moi),
    queryFn: async () => {
      if (estAdmin) return listComptes(filtreRole)
      const compte = await getCompte(moi.id)
      return [compte]
    },
  })

  function surSucces() {
    queryClient.invalidateQueries({ queryKey: ['comptes'] })
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

  const modification = useMutation({
    mutationFn: ({ id, ...donnees }) => updateCompte(id, donnees),
    onSuccess: surSucces,
    onError: surErreur,
  })

  const suppression = useMutation({
    mutationFn: supprimerMonCompte,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comptes'] }),
  })

  const desactivation = useMutation({
    mutationFn: desactiverCompte,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comptes'] }),
  })

  const reactivation = useMutation({
    mutationFn: reactiverCompte,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comptes'] }),
  })

  const creation = useMutation({
    mutationFn: creerCompte,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comptes'] })
      fermerModalCreation()
    },
    onError: (err) => {
      const details = err.response?.data
      setErreurCreation(
        details && typeof details === 'object'
          ? Object.entries(details)
              .map(([champ, messages]) => `${champ} : ${[].concat(messages).join(' ')}`)
              .join(' — ')
          : "La création a échoué. Réessayez.",
      )
    },
  })

  function ouvrirEdition(compte) {
    setEnEdition(compte)
    setForm({
      first_name: compte.first_name,
      last_name: compte.last_name,
      email: compte.email,
      telephone: compte.telephone,
      role: compte.role,
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
    modification.mutate({ id: enEdition.id, ...form })
  }

  function desactiver(compte) {
    if (window.confirm(`Désactiver le compte « ${compte.username} » ?`)) {
      desactivation.mutate(compte.id)
    }
  }

  function supprimerCompte(compte) {
    if (window.confirm(`Supprimer votre compte « ${compte.username} » ? Cette action est irréversible.`)) {
      suppression.mutate(compte.id)
    }
  }

  function reactiver(compte) {
    if (window.confirm(`Réactiver le compte « ${compte.username} » ?`)) {
      reactivation.mutate(compte.id)
    }
  }

  function champ(nom, valeur) {
    setForm((precedent) => ({ ...precedent, [nom]: valeur }))
  }

  function ouvrirCreation() {
    setFormCreation(formCreationVide)
    setErreurCreation(null)
    setModalCreationOuvert(true)
  }

  function fermerModalCreation() {
    setModalCreationOuvert(false)
    setErreurCreation(null)
  }

  function champCreation(nom, valeur) {
    setFormCreation((precedent) => ({ ...precedent, [nom]: valeur }))
  }

  function soumettreCreation(event) {
    event.preventDefault()
    creation.mutate(formCreation)
  }

  const lignes = (comptes ?? []).map((compte) => (
    <Table.Tr key={compte.id}>
      <Table.Td fw={600}>{compte.username}</Table.Td>
      <Table.Td>{compte.first_name} {compte.last_name}</Table.Td>
      <Table.Td>{compte.email}</Table.Td>
      <Table.Td>{compte.telephone}</Table.Td>
      <Table.Td>
        <Badge
          variant={compte.is_active ? 'filled' : 'outline'}
          color="mono.9"
        >
          {compte.is_active ? 'Actif' : 'Inactif'}
        </Badge>
      </Table.Td>
      <Table.Td>{compte.role}</Table.Td>
      <Table.Td>
        <Group gap="xs" wrap="nowrap">
          {(moi?.id === compte.id) && (
            <Button
              size="compact-sm"
              variant="outline"
              onClick={() => ouvrirEdition(compte)}
            >
              Modifier
            </Button>
          )}
          {moi?.id === compte.id && compte.is_active && (
            <Button
              size="compact-sm"
              variant="subtle"
              onClick={() => supprimerCompte(compte)}
            >
              Supprimer mon compte
            </Button>
          )}
          {moi?.role === 'ADMINISTRATEUR' && compte.is_active && (
            <Button
              size="compact-sm"
              variant="subtle"
              onClick={() => desactiver(compte)}
            >
              Désactiver
            </Button>
          )}

          {moi?.role === 'ADMINISTRATEUR' && !compte.is_active && (
            <Button
              size="compact-sm"
              variant="outline"
              onClick={() => reactiver(compte)}
            >
              Réactiver
            </Button>
          )}
        </Group>
      </Table.Td>
    </Table.Tr>
  ))

  if (moi && moi.role !== 'ADMINISTRATEUR') {
    return <Navigate to="/" replace />
  }

  return (
    <AppLayout>
      <Group justify="space-between" mb="lg">
        <Title order={2}>Gestion des comptes utilisateurs</Title>
        {peutCreerCompte && (
          <Button onClick={ouvrirCreation}>+ Créer un compte</Button>
        )}
      </Group>

      {estAdmin && (
        <Group mb="md">
          <Select
            placeholder="Filtrer par rôle"
            value={filtreRole}
            onChange={(val) => setFiltreRole(val ?? '')}
            data={[
              { value: 'CLIENT', label: 'Client' },
              { value: 'MECANICIEN', label: 'Mécanicien' },
              { value: 'GESTIONNAIRE', label: 'Gestionnaire' },
              { value: 'ADMINISTRATEUR', label: 'Administrateur' },
            ]}
            clearable
          />
        </Group>
      )}

      {isLoading ? (
        <Loader color="black" />
      ) : lignes.length === 0 ? (
        <Text>Aucun compte enregistré.</Text>
      ) : (
        <Table withTableBorder withColumnBorders style={{ borderColor: '#000' }}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nom d'utilisateur</Table.Th>
              <Table.Th>Nom complet</Table.Th>
              <Table.Th>Courriel</Table.Th>
              <Table.Th>Téléphone</Table.Th>
              <Table.Th>Statut</Table.Th>
              <Table.Th>Rôle</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{lignes}</Table.Tbody>
        </Table>
      )}

      <Modal
        opened={modalOuvert}
        onClose={fermerModal}
        title="Modifier mon profil"
        centered
      >
        <form onSubmit={soumettre}>
          {erreur && (
            <Alert color="mono.9" variant="outline" mb="md">
              {erreur}
            </Alert>
          )}
          <TextInput
            label="Prénom"
            value={form.first_name}
            onChange={(e) => champ('first_name', e.target.value)}
            required
          />
          <TextInput
            label="Nom"
            value={form.last_name}
            onChange={(e) => champ('last_name', e.target.value)}
            required
            mt="sm"
          />
          <TextInput
            label="Courriel"
            type="email"
            value={form.email}
            onChange={(e) => champ('email', e.target.value)}
            required
            mt="sm"
          />
          <TextInput
            label="Téléphone"
            value={form.telephone}
            onChange={(e) => champ('telephone', e.target.value)}
            mt="sm"
          />
          <Select
            label="Rôle"
            value={form.role}
            onChange={(valeur) => champ('role', valeur)}
            data={[
              { value: 'CLIENT', label: 'Client' },
              { value: 'MECANICIEN', label: 'Mécanicien' },
              { value: 'GESTIONNAIRE', label: 'Gestionnaire' },
              { value: 'ADMINISTRATEUR', label: 'Administrateur' },
            ]}
            allowDeselect={false}
            mt="sm"
          />
          <Group justify="flex-end" mt="lg">
            <Button variant="outline" onClick={fermerModal}>
              Annuler
            </Button>
            <Button type="submit" loading={modification.isPending}>
              Enregistrer
            </Button>
          </Group>
        </form>
      </Modal>

      <Modal
        opened={modalCreationOuvert}
        onClose={fermerModalCreation}
        title="Créer un compte"
        centered
      >
        <form onSubmit={soumettreCreation}>
          {erreurCreation && (
            <Alert color="mono.9" variant="outline" mb="md">
              {erreurCreation}
            </Alert>
          )}
          <TextInput
            label="Nom d'utilisateur"
            value={formCreation.username}
            onChange={(e) => champCreation('username', e.target.value)}
            required
          />
          <TextInput
            label="Prénom"
            value={formCreation.first_name}
            onChange={(e) => champCreation('first_name', e.target.value)}
            required
            mt="sm"
          />
          <TextInput
            label="Nom"
            value={formCreation.last_name}
            onChange={(e) => champCreation('last_name', e.target.value)}
            required
            mt="sm"
          />
          <TextInput
            label="Courriel"
            type="email"
            value={formCreation.email}
            onChange={(e) => champCreation('email', e.target.value)}
            required
            mt="sm"
          />
          <TextInput
            label="Téléphone"
            value={formCreation.telephone}
            onChange={(e) => champCreation('telephone', e.target.value)}
            mt="sm"
          />
          <TextInput
            type="password"
            label="Mot de passe"
            value={formCreation.password}
            onChange={(e) => champCreation('password', e.target.value)}
            required
            mt="sm"
          />
          <Select
            label="Rôle"
            value={formCreation.role}
            onChange={(valeur) => champCreation('role', valeur)}
            data={rolesCreablesParMoi}
            allowDeselect={false}
            mt="sm"
          />
          <Group justify="flex-end" mt="lg">
            <Button variant="outline" onClick={fermerModalCreation}>
              Annuler
            </Button>
            <Button type="submit" loading={creation.isPending}>
              Créer le compte
            </Button>
          </Group>
        </form>
      </Modal>
    </AppLayout>
  )
}