
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { MantineProvider } from '@mantine/core'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@mantine/core/styles.css'
import './index.css'

import { theme } from './theme.js'

import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/global.css";

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme}>
        
          <App />
        
      </MantineProvider>
    </QueryClientProvider>
  </StrictMode>,
)
