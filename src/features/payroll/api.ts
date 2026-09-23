import { apiFetch } from '../../lib/apiClient'
import { API_BASE_URL } from '../../lib/auth-client'
import type {
  CreatePayrollRunInput,
  EmployeePayslipListItem,
  EmployeeTaxDeclaration,
  Payslip,
  PayslipListItem,
  PayrollRun,
  PayrollRunListResult,
  PayrollSettings,
  UpdatePayrollSettingsInput,
  UpsertTaxDeclarationInput,
} from './types'

export function getPayrollSettings() {
  return apiFetch<{ settings: PayrollSettings }>('/api/payroll-settings')
}

export function updatePayrollSettings(input: UpdatePayrollSettingsInput) {
  return apiFetch<{ settings: PayrollSettings }>('/api/payroll-settings', {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function listPayrollRuns(page: number, pageSize: number) {
  return apiFetch<PayrollRunListResult>(`/api/payroll-runs?page=${page}&pageSize=${pageSize}`)
}

export function getPayrollRun(id: string) {
  return apiFetch<{ run: PayrollRun }>(`/api/payroll-runs/${id}`)
}

export function createPayrollRun(input: CreatePayrollRunInput) {
  return apiFetch<{ run: PayrollRun }>('/api/payroll-runs', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function processPayrollRun(id: string) {
  return apiFetch<{ run: PayrollRun }>(`/api/payroll-runs/${id}/process`, { method: 'POST' })
}

export function reprocessPayrollRun(id: string) {
  return apiFetch<{ run: PayrollRun }>(`/api/payroll-runs/${id}/reprocess`, { method: 'POST' })
}

export function approvePayrollRun(id: string) {
  return apiFetch<{ run: PayrollRun }>(`/api/payroll-runs/${id}/approve`, { method: 'POST' })
}

export function payPayrollRun(id: string) {
  return apiFetch<{ run: PayrollRun }>(`/api/payroll-runs/${id}/pay`, { method: 'POST' })
}

export function cancelPayrollRun(id: string) {
  return apiFetch<{ run: PayrollRun }>(`/api/payroll-runs/${id}/cancel`, { method: 'POST' })
}

export function listPayslipsForRun(runId: string) {
  return apiFetch<{ payslips: PayslipListItem[] }>(`/api/payroll-runs/${runId}/payslips`)
}

export function getPayslip(runId: string, payslipId: string) {
  return apiFetch<{ payslip: Payslip }>(`/api/payroll-runs/${runId}/payslips/${payslipId}`)
}

export function listEmployeePayslips(employeeId: string) {
  return apiFetch<{ payslips: EmployeePayslipListItem[] }>(`/api/employees/${employeeId}/payslips`)
}

export function getTaxDeclaration(employeeId: string, financialYear?: string) {
  const query = financialYear ? `?fy=${encodeURIComponent(financialYear)}` : ''
  return apiFetch<{ declaration: EmployeeTaxDeclaration | null; financialYear: string }>(
    `/api/employees/${employeeId}/tax-declaration${query}`,
  )
}

export function upsertTaxDeclaration(employeeId: string, input: UpsertTaxDeclarationInput) {
  return apiFetch<{ declaration: EmployeeTaxDeclaration }>(`/api/employees/${employeeId}/tax-declaration`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

// Session cookie rides along on a plain top-level navigation, same as
// employeeDocumentDownloadUrl — a normal <a href> rather than fetch+blob.
export function payslipPdfDownloadUrl(employeeId: string, payslipId: string) {
  return `${API_BASE_URL}/api/employees/${employeeId}/payslips/${payslipId}/pdf`
}

export function payslipsZipDownloadUrl(runId: string) {
  return `${API_BASE_URL}/api/payroll-runs/${runId}/payslips/download-all`
}

export function regeneratePayslipPdfs(runId: string) {
  return apiFetch<{ queued: boolean }>(`/api/payroll-runs/${runId}/payslips/regenerate-pdfs`, { method: 'POST' })
}
