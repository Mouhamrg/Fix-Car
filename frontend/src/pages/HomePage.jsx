import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button, Loader, Text, Title } from '@mantine/core'
import AppLayout from '../components/AppLayout.jsx'
import api from '../api/client.js'

export default function HomePage() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => (await api.get('/api/me/')).data,
  })

  return (
    <AppLayout>
      {isLoading ? (
        <Loader color="black" />
      ) : (
        <>
          <Title order={2}>
            Bienvenue, {user?.first_name || user?.username} !
          </Title>
          <Text mt="md">
            FixMyCar — plateforme de gestion de flotte automobile pour les
            garages.
          </Text>
          <Button component={Link} to="/interventions" mt="lg">
            Gérer les interventions mécaniques
          </Button>
        </>
      )}
    </AppLayout>
  )
}
