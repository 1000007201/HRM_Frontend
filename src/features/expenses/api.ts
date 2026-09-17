import { apiFetch } from '../../lib/apiClient'
import { API_BASE_URL } from '../../lib/auth-client'
import type {
  Approver,
  CreateExpenseRequestInput,
  CreateExpenseTypeInput,
  Currency,
  CurrencyRate,
  ExpenseAttachment,
  ExpenseRequest,
  ExpenseStatus,
  ExpenseType,
  UpdateExpenseTypeInput,
} from './types'

export function listExpenseTypes() {
  return apiFetch<{ expenseTypes: ExpenseType[] }>('/expense-types')
}

export function createExpenseType(input: CreateExpenseTypeInput) {
  return apiFetch<{ expenseType: ExpenseType }>('/expense-types', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateExpenseType(id: string, input: UpdateExpenseTypeInput) {
  return apiFetch<{ expenseType: ExpenseType }>(`/expense-types/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export function deleteExpenseType(id: string) {
  return apiFetch<{ id: string }>(`/expense-types/${id}`, { method: 'DELETE' })
}

export function listCurrencies() {
  return apiFetch<{ currencies: Currency[] }>('/currencies')
}

export function getCurrencyRate(currency: string) {
  return apiFetch<CurrencyRate>(`/currencies/rate?currency=${currency}`)
}

export function listApprovers() {
  return apiFetch<{ approvers: Approver[] }>('/expenses/approvers')
}

export function createExpenseRequest(input: CreateExpenseRequestInput) {
  return apiFetch<{ expenseRequest: ExpenseRequest }>('/expenses', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function listMyExpenses(status?: ExpenseStatus) {
  const query = status ? `?status=${status}` : ''
  return apiFetch<{ expenseRequests: ExpenseRequest[] }>(`/expenses/me${query}`)
}

export function getExpense(id: string) {
  return apiFetch<{ expenseRequest: ExpenseRequest }>(`/expenses/${id}`)
}

export function cancelExpenseRequest(id: string) {
  return apiFetch<{ expenseRequest: ExpenseRequest }>(`/expenses/${id}/cancel`, { method: 'POST' })
}

export function uploadExpenseAttachment(expenseId: string, file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return apiFetch<{ attachment: ExpenseAttachment }>(`/expenses/${expenseId}/attachments`, {
    method: 'POST',
    body: formData,
  })
}

export function deleteExpenseAttachment(expenseId: string, attachmentId: string) {
  return apiFetch<{ deleted: boolean }>(`/expenses/${expenseId}/attachments/${attachmentId}`, {
    method: 'DELETE',
  })
}

// Session cookie rides along on a plain top-level navigation, so downloads
// are a normal <a href> rather than a fetch-and-blob dance (same pattern as
// employeeDocumentDownloadUrl).
export function expenseAttachmentDownloadUrl(expenseId: string, attachmentId: string) {
  return `${API_BASE_URL}/expenses/${expenseId}/attachments/${attachmentId}/download`
}

export function listPendingManagerExpenses() {
  return apiFetch<{ expenseRequests: ExpenseRequest[] }>('/expenses/pending-manager')
}

export function managerApproveExpense(id: string, decisionNote?: string) {
  return apiFetch<{ expenseRequest: ExpenseRequest }>(`/expenses/${id}/manager-approve`, {
    method: 'POST',
    body: JSON.stringify({ decisionNote }),
  })
}

export function managerRejectExpense(id: string, decisionNote?: string) {
  return apiFetch<{ expenseRequest: ExpenseRequest }>(`/expenses/${id}/manager-reject`, {
    method: 'POST',
    body: JSON.stringify({ decisionNote }),
  })
}

export function listPendingAdminExpenses() {
  return apiFetch<{ expenseRequests: ExpenseRequest[] }>('/expenses/pending-admin')
}

export function adminApproveExpense(id: string, decisionNote?: string) {
  return apiFetch<{ expenseRequest: ExpenseRequest }>(`/expenses/${id}/admin-approve`, {
    method: 'POST',
    body: JSON.stringify({ decisionNote }),
  })
}

export function adminRejectExpense(id: string, decisionNote?: string) {
  return apiFetch<{ expenseRequest: ExpenseRequest }>(`/expenses/${id}/admin-reject`, {
    method: 'POST',
    body: JSON.stringify({ decisionNote }),
  })
}

export function listApprovedExpenses() {
  return apiFetch<{ expenseRequests: ExpenseRequest[] }>('/expenses/approved')
}

export function initiateExpensePayment(id: string) {
  return apiFetch<{ expenseRequest: ExpenseRequest }>(`/expenses/${id}/initiate-payment`, { method: 'POST' })
}
