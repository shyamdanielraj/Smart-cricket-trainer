import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './state/auth'
import { AiProvider } from './state/ai'
import { DashboardLayout } from './ui/layout/DashboardLayout'
import { HomePage } from './ui/pages/HomePage'
import { LoginPage } from './ui/pages/LoginPage'
import { SignupPage } from './ui/pages/SignupPage'
import { AiShotClassifierPage } from './ui/pages/AiShotClassifierPage'
import { BattingLabPage } from './ui/pages/BattingLabPage'
import { MatchInsightsPage } from './ui/pages/MatchInsightsPage'
import { ProfilePage } from './ui/pages/ProfilePage'
import './App.css'

function Protected({ children }: { children: React.ReactNode }) {
  const { token } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <AuthProvider>
      <AiProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route
              path="/"
              element={
                <Protected>
                  <DashboardLayout />
                </Protected>
              }
            >
              <Route index element={<HomePage />} />
              <Route path="ai" element={<AiShotClassifierPage />} />
              <Route path="lab" element={<BattingLabPage />} />
              <Route path="insights" element={<MatchInsightsPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AiProvider>
    </AuthProvider>
  )
}
