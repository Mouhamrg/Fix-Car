
import LoginPage from './pages/LoginPage.jsx'
import HomePage from './pages/HomePage.jsx'
import DemandesPage from './pages/DemandesPage.jsx'
import InterventionsPage from './pages/InterventionsPage.jsx'
import TypesReparationsPage from './pages/TypesReparationsPage.jsx'
import { isAuthenticated } from './api/client.js'
import RendezVousPage from './pages/RendezVousPage.jsx'
import SuiviReparationsPage from './pages/SuiviReparationsPage.jsx'
import ProfilPage from './pages/ProfilPage.jsx'

import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import RouteProtegee from "./routes/RouteProtegee";
import MiseEnPage from "./components/MiseEnPage";
import Accueil from "./components/Accueil";


import PageConnexion from "./pages/PageConnexion";
import PageInscription from "./pages/PageInscription";
import PageVehicules from "./pages/PageVehicules";
import PageFormulaireVehicule from "./pages/PageFormulaireVehicule";
import PageDemandes from "./pages/PageDemandes";
import PageFormulaireDemande from "./pages/PageFormulaireDemande";
import PageAffectations from "./pages/PageAffectations";
import PageFormulaireAffectation from "./pages/PageFormulaireAffectation";
import PageFormulaireDiagnostic from "./pages/PageFormulaireDiagnostic";
import PageProfil from "./pages/PageProfil";
import PageIntrouvable from "./pages/PageIntrouvable";

function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  return children
}


export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/connexion" element={<PageConnexion />} />
          <Route path="/inscription" element={<PageInscription />} />
                <Route path="/login" element={<LoginPage />} />

            <Route
                path="/rendez-vous"
                element={
                    <ProtectedRoute>
                        <RendezVousPage />
                    </ProtectedRoute>
                }
            />
          <Route
            path="/demande"
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
            path="/profils"
            element={
              <ProtectedRoute>
                <ProfilPage />
              </ProtectedRoute>
            }
          />

          <Route element={<RouteProtegee />}>
            <Route element={<MiseEnPage />}>
              <Route path="/" element={<Accueil />} />
              <Route path="/vehicules" element={<PageVehicules />} />
              <Route path="/vehicules/nouveau" element={<PageFormulaireVehicule />} />
              <Route path="/vehicules/:id/modifier" element={<PageFormulaireVehicule />} />
              <Route path="/demandes" element={<PageDemandes />} />
              <Route path="/demandes/nouvelle" element={<PageFormulaireDemande />} />
              <Route path="/demandes/:id/modifier" element={<PageFormulaireDemande />} />
              <Route path="/affectations" element={<PageAffectations />} />
              <Route path="/affectations/nouvelle" element={<PageFormulaireAffectation />} />
              <Route path="/affectations/:id/modifier" element={<PageFormulaireAffectation />} />
              <Route path="/diagnostics/nouveau" element={<PageFormulaireDiagnostic />} />
              <Route path="/diagnostics/:id/modifier" element={<PageFormulaireDiagnostic />} />
              <Route path="/profil" element={<PageProfil />} />
            </Route>
          </Route>

          <Route path="*" element={<PageIntrouvable />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}