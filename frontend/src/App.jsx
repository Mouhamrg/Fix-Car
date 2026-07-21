import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage.jsx'
import InscriptionPage from './pages/InscriptionPage.jsx'
import HomePage from './pages/HomePage.jsx'
import DemandesPage from './pages/DemandesPage.jsx'
import InterventionsPage from './pages/InterventionsPage.jsx'
import TypesReparationsPage from './pages/TypesReparationsPage.jsx'
import { isAuthenticated } from './api/client.js'
import RendezVousPage from './pages/RendezVousPage.jsx'
import ProfilPage from './pages/ProfilPage.jsx'

function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  return children
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/inscription" element={<InscriptionPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
        <Route
            path="/rendez-vous"
            element={
                <ProtectedRoute>
                    <RendezVousPage />
                </ProtectedRoute>
            }
        />
      <Route
        path="/demandes"
        element={
          <ProtectedRoute>
            <DemandesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/interventions"
        element={
          <ProtectedRoute>
            <InterventionsPage />
          </ProtectedRoute>
        }
      />
<Route
        path="/types-reparations"
        element={
          <ProtectedRoute>
            <TypesReparationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profil"
        element={
          <ProtectedRoute>
            <ProfilPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App
