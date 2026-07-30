import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MantineProvider } from '@mantine/core'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { theme } from '../theme.js'

/** Rend un composant avec les mêmes providers que l'application (main.jsx). */
export function rendreAvecProviders(ui, { initialEntries = ['/'] } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme}>
        <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
      </MantineProvider>
    </QueryClientProvider>,
  )
}
