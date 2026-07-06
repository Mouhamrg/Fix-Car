import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage.jsx'
import HomePage from './pages/HomePage.jsx'
import DemandesPage from './pages/DemandesPage.jsx'
import { isAuthenticated } from './api/client.js'

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
        path="/demandes"
        element={
          <ProtectedRoute>
            <DemandesPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App
