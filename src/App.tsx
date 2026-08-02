import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth } from './components/auth/RequireAuth'
import { RequireGuest } from './components/auth/RequireGuest'
import { SignInPage } from './pages/auth/SignInPage'
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage'
import { RegisterCompanyPage } from './pages/auth/RegisterCompanyPage'
import { AppShellPage } from './pages/AppShellPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<RegisterCompanyPage />} />
        <Route
          path="/sign-in"
          element={
            <RequireGuest>
              <SignInPage />
            </RequireGuest>
          }
        />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <AppShellPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
