import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './components/auth/AuthContext'
import { useAuth } from './components/auth/AuthContext'
import { supabase } from './lib/supabaseClient'
import { Toaster } from 'react-hot-toast'
import Login from './components/auth/Login'
import DashboardLayout from './components/dashboard/DashboardLayout'
import LandingPage from './components/LandingPage'
import MemberPortal from './components/member/MemberPortal'
import InvitedUserSetup from './components/auth/InvitedUserSetup'

function ProtectedRoute({ children, redirectTo = "/" }) {
  const { user } = useAuth()
  
  if (!user) {
    return <Navigate to={redirectTo} replace />
  }
  
  return children
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin/setup" element={<InvitedUserSetup />} />
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute redirectTo="/admin/login">
                <DashboardLayout />
              </ProtectedRoute>
            } 
          />
          <Route path="/member" element={
            <ProtectedRoute redirectTo="/">
              <MemberPortal />
            </ProtectedRoute>
          } />
          {/* Member routes will be added later */}
        </Routes>
      </Router>
      <Toaster position="top-right" />
    </AuthProvider>
  )
}

export default App
