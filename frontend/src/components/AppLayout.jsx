import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Box, Button, Container, Group, Text } from '@mantine/core'
import { logout } from '../api/client.js'
import { useQuery } from '@tanstack/react-query'
import api from '../api/client.js'

const links = [
  { to: '/', label: 'Accueil' },
  { to: '/vehicules', label: 'Véhicules' },
  { to: '/rendez-vous', label: 'Rendez-vous' },
  { to: '/demandes', label: 'Demandes de reparation' },
  { to: '/demandes', label: 'Diagnostics' },
  { to: '/interventions', label: 'Interventions' },
  { to: '/types-reparations', label: 'Types de reparation' },
  { to: '/suivi-reparations', label: 'Suivi des réparations' },
  { to: '/profil', label: 'Comptes utilisateurs' },
]

export default function AppLayout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { data: moi } = useQuery({
    queryKey: ['me'],
    queryFn: async () => (await api.get('/api/me/')).data,
  })

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <>
      <Box component="header" style={{ borderBottom: '2px solid #000' }}>
        <Container size="lg" py="sm">
          <Group justify="space-between">
            <Group gap="xl">
              <Text fw={900} size="xl">
                FixMyCar
              </Text>
              <Group gap="md">
                {links
                .filter(link => link.to !== '/profil' || moi?.role === 'ADMINISTRATEUR')
                .map((link) => (
                  <Text
                    key={link.to}
                    component={Link}
                    to={link.to}
                    fw={location.pathname === link.to ? 700 : 400}
                    td={location.pathname === link.to ? 'underline' : 'none'}
                    c="black"
                  >
                    {link.label}
                  </Text>
                ))}
              </Group>
            </Group>
            <Button variant="outline" onClick={handleLogout}>
              Se déconnecter
            </Button>
          </Group>
        </Container>
      </Box>
      <Container size="lg" py="xl">
        {children}
      </Container>
    </>
  )
}
