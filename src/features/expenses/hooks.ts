import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from './api'
import type { CreateExpenseRequestInput, CreateExpenseTypeInput, ExpenseStatus, UpdateExpenseTypeInput } from './types'

const expenseTypesKey = ['expense-types'] as const
const currenciesKey = ['currencies'] as const
const currencyRateKey = (currency: string) => ['currencies', 'rate', currency] as const
const approversKey = ['expenses', 'approvers'] as const
const myExpensesKey = (status?: ExpenseStatus) => ['expenses', 'me', status ?? 'all'] as const
const expenseKey = (id: string) => ['expenses', id] as const
const pendingManagerKey = ['expenses', 'pending-manager'] as const
const pendingAdminKey = ['expenses', 'pending-admin'] as const
const approvedKey = ['expenses', 'approved'] as const

export function useExpenseTypes() {
  return useQuery({ queryKey: expenseTypesKey, queryFn: () => api.listExpenseTypes() })
}

export function useCreateExpenseType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateExpenseTypeInput) => api.createExpenseType(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: expenseTypesKey }),
  })
}

export function useUpdateExpenseType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateExpenseTypeInput }) => api.updateExpenseType(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: expenseTypesKey }),
  })
}

export function useDeleteExpenseType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteExpenseType(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: expenseTypesKey }),
  })
}

// Reference data that essentially never changes within a session — avoids
// refetching the currency list on every window refocus.
export function useCurrencies() {
  return useQuery({ queryKey: currenciesKey, queryFn: () => api.listCurrencies(), staleTime: Infinity })
}

// Backing the raise-expense form's live "≈ ₹X,XXX" preview. `enabled` lets
// the caller skip the request entirely for INR (rate is always 1, no lookup
// needed) or while no currency is selected yet.
export function useCurrencyRate(currency: string, enabled: boolean) {
  return useQuery({
    queryKey: currencyRateKey(currency),
    queryFn: () => api.getCurrencyRate(currency),
    enabled,
    staleTime: 60_000,
  })
}

export function useApprovers() {
  return useQuery({ queryKey: approversKey, queryFn: () => api.listApprovers() })
}

// Every mutation below invalidates the whole `expenses` query root — create/
// cancel/decide/pay each touch some combination of the my-list, both approver
// queues, the approved list, and a detail view, and re-fetching all of them
// is one cheap extra GET each, not worth tracking the exact combination per
// action (same call made for `leave` in features/leave/hooks.ts).
export function useCreateExpenseRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateExpenseRequestInput) => api.createExpenseRequest(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
  })
}

export function useMyExpenses(status?: ExpenseStatus) {
  return useQuery({ queryKey: myExpensesKey(status), queryFn: () => api.listMyExpenses(status) })
}

export function useExpense(id: string) {
  return useQuery({ queryKey: expenseKey(id), queryFn: () => api.getExpense(id) })
}

export function useCancelExpenseRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.cancelExpenseRequest(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
  })
}

export function useUploadExpenseAttachment(expenseId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => api.uploadExpenseAttachment(expenseId, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: expenseKey(expenseId) }),
  })
}

export function useDeleteExpenseAttachment(expenseId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (attachmentId: string) => api.deleteExpenseAttachment(expenseId, attachmentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: expenseKey(expenseId) }),
  })
}

// Also used by AppLayout to decide whether to show the "Expense approvals"
// nav item at all (anyone with a non-empty queue) — React Query dedupes the
// identical queryKey, so mounting both the nav and this page costs one
// request, not two.
export function usePendingManagerExpenses() {
  return useQuery({ queryKey: pendingManagerKey, queryFn: () => api.listPendingManagerExpenses() })
}

export function useManagerApproveExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, decisionNote }: { id: string; decisionNote?: string }) =>
      api.managerApproveExpense(id, decisionNote),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
  })
}

export function useManagerRejectExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, decisionNote }: { id: string; decisionNote?: string }) =>
      api.managerRejectExpense(id, decisionNote),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
  })
}

export function usePendingAdminExpenses() {
  return useQuery({ queryKey: pendingAdminKey, queryFn: () => api.listPendingAdminExpenses() })
}

export function useAdminApproveExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, decisionNote }: { id: string; decisionNote?: string }) =>
      api.adminApproveExpense(id, decisionNote),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
  })
}

export function useAdminRejectExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, decisionNote }: { id: string; decisionNote?: string }) =>
      api.adminRejectExpense(id, decisionNote),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
  })
}

export function useApprovedExpenses() {
  return useQuery({ queryKey: approvedKey, queryFn: () => api.listApprovedExpenses() })
}

export function useInitiateExpensePayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.initiateExpensePayment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
  })
}
