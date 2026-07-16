import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Box,
  Button,
  Container,
  PasswordInput,
  Select,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { createCompte } from '../api/comptes.js'

const formVide = {
  username: '',
  email: '',
  first_name: '',
  last_name: '',
  telephone: '',
  password: '',
  role: 'client',
}

export default function InscriptionPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(formVide)
  const [erreur, setErreur] = useState(null)
  const [chargement, setChargement] = useState(false)

  function champ(nom, valeur) {
    setForm((precedent) => ({ ...precedent, [nom]: valeur }))
  }

  async function soumettre(event) {
    event.preventDefault()
    setChargement(true)
    setErreur(null)
    try {
      await createCompte(form)
      navigate('/login')
    } catch (err) {
      const details = err.response?.data
      setErreur(
        details && typeof details === 'object'
          ? Object.entries(details)
              .map(([champ, messages]) => `${champ} : ${[].concat(messages).join(' ')}`)
              .join(' — ')
          : "L'inscription a échoué. Réessayez.",
      )
    } finally {
      setChargement(false)
    }
  }

  return (
    <Box style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <Container size="xs" w="100%">
        <Title order={1} ta="center" mb="xl">FixMyCar</Title>
        <Box
          style={{
            border: '1px solid #000',
            borderRadius: 8,
            padding: '2rem',
          }}
        >
          <Title order={3} mb="md">Créer un compte</Title>
          <form onSubmit={soumettre}>
            {erreur && (
              <Text c="red" size="sm" mb="md">{erreur}</Text>
            )}
            <TextInput
              label="Nom d'utilisateur"
              value={form.username}
              onChange={(e) => champ('username', e.target.value)}
              required
            />
            <TextInput
              label="Prénom"
              value={form.first_name}
              onChange={(e) => champ('first_name', e.target.value)}
              required
              mt="sm"
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
              onChange={(val) => champ('role', val ?? 'client')}
              data={[
                { value: 'CLIENT', label: 'Client' },
                { value: 'MECANICIEN', label: 'Mécanicien' },
              ]}
              allowDeselect={false}
              mt="sm"
            />
            <PasswordInput
              label="Mot de passe"
              value={form.password}
              onChange={(e) => champ('password', e.target.value)}
              required
              mt="sm"
            />
            <Button
              type="submit"
              fullWidth
              mt="xl"
              loading={chargement}
            >
              S'inscrire
            </Button>
          </form>
          <Text ta="center" mt="md" size="sm">
            Déjà un compte ?{' '}
            <Text component={Link} to="/login" c="black" td="underline">
              Se connecter
            </Text>
          </Text>
        </Box>
      </Container>
    </Box>
  )
}