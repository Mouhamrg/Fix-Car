import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Box, Button, Container, Group, Text } from '@mantine/core'
import { logout } from '../api/client.js'

const links = [
  { to: '/', label: 'Accueil' },
  { to: '/rendez-vous', label: 'Rendez-vous' },
  { to: '/demandes', label: 'Demandes de reparation' },
  { to: '/interventions', label: 'Interventions' },
]

export default function AppLayout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()

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
                {links.map((link) => (
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
