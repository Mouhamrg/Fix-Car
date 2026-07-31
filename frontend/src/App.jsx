import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage.jsx'
import HomePage from './pages/HomePage.jsx'
import DemandesPage from './pages/DemandesPage.jsx'
import InterventionsPage from './pages/InterventionsPage.jsx'
import TypesReparationsPage from './pages/TypesReparationsPage.jsx'
import { isAuthenticated } from './api/client.js'
import RendezVousPage from './pages/RendezVousPage.jsx'
import SuiviReparationsPage from './pages/SuiviReparationsPage.jsx'
import PageFormulaireDiagnostic from "./pages/PageFormulaireDiagnostic";
import PageAffectations from "./pages/PageAffectations.jsx";
import PageFormulaireAffectation from './pages/PageFormulaireAffectation.jsx'
import ProfilPage from './pages/ProfilPage.jsx'
import InscriptionPage from './pages/InscriptionPage.jsx'

import PageVehicules from "./pages/PageVehicules";
import PageFormulaireVehicule from "./pages/PageFormulaireVehicule";

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
            path="/suivi-reparations"
            element={
                <ProtectedRoute>
                    <SuiviReparationsPage />
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
      <Route path="/vehicules" element={<ProtectedRoute><PageVehicules /></ProtectedRoute> } />
      <Route path="/vehicules/nouveau" element={<ProtectedRoute><PageFormulaireVehicule /></ProtectedRoute> } />
      <Route path="/vehicules/:id/modifier" element={<ProtectedRoute><PageFormulaireVehicule /></ProtectedRoute> } />
      <Route path="/diagnostics/nouveau" element={<ProtectedRoute><PageFormulaireDiagnostic /></ProtectedRoute> } />
      <Route path="/diagnostics/:id/modifier" element={<ProtectedRoute><PageFormulaireDiagnostic /></ProtectedRoute> } />
      <Route path="/affectations" element={<ProtectedRoute><PageAffectations /></ProtectedRoute> } />
      <Route path="/affectations/nouveau" element={<ProtectedRoute><PageFormulaireAffectation /></ProtectedRoute> } />
      <Route path="/affectations/:id/modifier" element={<ProtectedRoute><PageFormulaireAffectation /></ProtectedRoute> } />
    </Routes>
  )
}

export default App
