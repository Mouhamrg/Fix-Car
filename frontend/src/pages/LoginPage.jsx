import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import {
  Alert,
  Button,
  Container,
  Paper,
  PasswordInput,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { login } from '../api/client.js'

export default function LoginPage() {
  const navigate = useNavigate()
  const [identifiant, setIdentifiant] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(identifiant, password)
      navigate('/')
    } catch {
      setError("Identifiant ou mot de passe invalide.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container size={420} my={80}>
      <Title ta="center">FixMyCar</Title>
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={handleSubmit}>
          {error && (
            <Alert color="red" mb="md">
              {error}
            </Alert>
          )}
          <TextInput
            label="Courriel ou téléphone"
            value={identifiant}
            onChange={(e) => setIdentifiant(e.target.value)}
            required
          />
          <PasswordInput
            label="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            mt="md"
          />
          <Button type="submit" fullWidth mt="xl" loading={loading}>
            Se connecter
          </Button>
          <Text ta="center" mt="md" size="sm">
            Pas encore de compte ?{' '}
            <Text component={Link} to="/inscription" c="black" td="underline">
              S'inscrire
            </Text>
          </Text>
        </form>
      </Paper>
    </Container>
  )
}
