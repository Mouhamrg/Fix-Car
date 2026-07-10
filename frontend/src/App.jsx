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

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/connexion" element={<PageConnexion />} />
          <Route path="/inscription" element={<PageInscription />} />

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