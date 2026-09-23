import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from './api'
import type { CreatePayrollRunInput, UpdatePayrollSettingsInput, UpsertTaxDeclarationInput } from './types'

const payrollRunsKey = (page: number, pageSize: number) => ['payroll-runs', { page, pageSize }] as const
const payrollRunKey = (id: string) => ['payroll-runs', id] as const
const runPayslipsKey = (runId: string) => ['payroll-runs', runId, 'payslips'] as const
const payslipKey = (runId: string, payslipId: string) => ['payroll-runs', runId, 'payslips', payslipId] as const
const employeePayslipsKey = (employeeId: string) => ['employees', employeeId, 'payslips'] as const
const taxDeclarationKey = (employeeId: string, financialYear?: string) =>
  ['employees', employeeId, 'tax-declaration', financialYear ?? 'current'] as const

export function usePayrollSettings() {
  return useQuery({
    queryKey: ['payroll-settings'],
    queryFn: () => api.getPayrollSettings(),
  })
}

export function useUpdatePayrollSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdatePayrollSettingsInput) => api.updatePayrollSettings(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-settings'] })
    },
  })
}

export function usePayrollRuns(page: number, pageSize: number) {
  return useQuery({
    queryKey: payrollRunsKey(page, pageSize),
    queryFn: () => api.listPayrollRuns(page, pageSize),
  })
}

export function usePayrollRun(id: string) {
  return useQuery({
    queryKey: payrollRunKey(id),
    queryFn: () => api.getPayrollRun(id),
  })
}

export function useCreatePayrollRun() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreatePayrollRunInput) => api.createPayrollRun(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-runs'] })
    },
  })
}

// Shared by process/reprocess/approve/pay/cancel — every run-mutating action
// invalidates the same two things: the run detail and the runs list (its
// status/totals changed) and the run's payslips (process/reprocess replaces them).
function useRunAction(action: (id: string) => Promise<unknown>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => action(id),
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: payrollRunKey(id) })
      queryClient.invalidateQueries({ queryKey: ['payroll-runs'] })
      queryClient.invalidateQueries({ queryKey: runPayslipsKey(id) })
    },
  })
}

export function useProcessPayrollRun() {
  return useRunAction(api.processPayrollRun)
}

export function useReprocessPayrollRun() {
  return useRunAction(api.reprocessPayrollRun)
}

export function useApprovePayrollRun() {
  return useRunAction(api.approvePayrollRun)
}

export function usePayPayrollRun() {
  return useRunAction(api.payPayrollRun)
}

export function useCancelPayrollRun() {
  return useRunAction(api.cancelPayrollRun)
}

export function usePayslipsForRun(runId: string) {
  return useQuery({
    queryKey: runPayslipsKey(runId),
    queryFn: () => api.listPayslipsForRun(runId),
  })
}

export function usePayslip(runId: string, payslipId: string) {
  return useQuery({
    queryKey: payslipKey(runId, payslipId),
    queryFn: () => api.getPayslip(runId, payslipId),
    enabled: Boolean(runId && payslipId),
  })
}

export function useEmployeePayslips(employeeId: string) {
  return useQuery({
    queryKey: employeePayslipsKey(employeeId),
    queryFn: () => api.listEmployeePayslips(employeeId),
  })
}

export function useTaxDeclaration(employeeId: string, financialYear?: string) {
  return useQuery({
    queryKey: taxDeclarationKey(employeeId, financialYear),
    queryFn: () => api.getTaxDeclaration(employeeId, financialYear),
  })
}

export function useUpsertTaxDeclaration(employeeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UpsertTaxDeclarationInput) => api.upsertTaxDeclaration(employeeId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees', employeeId, 'tax-declaration'] })
    },
  })
}
