import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage.jsx'
import HomePage from './pages/HomePage.jsx'
import { isAuthenticated } from './api/client.js'
import RendezVousPage from './pages/RendezVousPage.jsx'


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
    </Routes>
  )
}

export default App
