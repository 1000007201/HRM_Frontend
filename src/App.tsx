import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth } from './components/auth/RequireAuth'
import { RequireGuest } from './components/auth/RequireGuest'
import { AppLayout } from './components/layout/AppLayout'
import { SignInPage } from './pages/auth/SignInPage'
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage'
import { RegisterCompanyPage } from './pages/auth/RegisterCompanyPage'
import { AcceptInvitationPage } from './pages/auth/AcceptInvitationPage'
import { DashboardPage } from './pages/DashboardPage'
import { EmployeesListPage } from './pages/employees/EmployeesListPage'
import { EmployeeDetailPage } from './pages/employees/EmployeeDetailPage'
import { CreateEmployeePage } from './pages/employees/CreateEmployeePage'
import { EditEmployeePage } from './pages/employees/EditEmployeePage'
import { PendingInvitationsPage } from './pages/employees/PendingInvitationsPage'
import { OrgChartPage } from './pages/employees/OrgChartPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<RequireGuest />}>
          <Route path="/login" element={<SignInPage />} />
        </Route>
        <Route path="/register-company" element={<RegisterCompanyPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/accept-invitation/:invitationId" element={<AcceptInvitationPage />} />

        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/employees" element={<EmployeesListPage />} />
            <Route path="/org-chart" element={<OrgChartPage />} />
            <Route path="/employees/new" element={<CreateEmployeePage />} />
            <Route path="/employees/:id" element={<EmployeeDetailPage />} />
            <Route path="/employees/:id/edit" element={<EditEmployeePage />} />
            <Route path="/invitations" element={<PendingInvitationsPage />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
