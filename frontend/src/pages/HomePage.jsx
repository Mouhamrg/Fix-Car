import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button, Container, Group, Loader, Text, Title } from '@mantine/core'
import api, { logout } from '../api/client.js'

export default function HomePage() {
  const navigate = useNavigate()

  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => (await api.get('/api/me/')).data,
  })

  function handleLogout() {
    logout()
    navigate('/login')
  }

  if (isLoading) {
    return (
      <Container my={80} ta="center">
        <Loader />
      </Container>
    )
  }

  return (
    <Container my={40}>
      <Group justify="space-between">
        <Title>FixMyCar</Title>
        <Button variant="light" onClick={handleLogout}>
          Se déconnecter
        </Button>
      </Group>
      <Text mt="md">
        Bienvenue, {user?.first_name || user?.username} ! La connexion entre
        React et Django fonctionne.
      </Text>
    </Container>
  )
}
