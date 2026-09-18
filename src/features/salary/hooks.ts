import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from './api'
import type { CreateSalaryComponentInput, CreateSalaryStructureInput, UpdateSalaryComponentInput } from './types'

const salaryComponentsKey = ['salary-components'] as const
const salaryStructureKey = (employeeId: string) => ['salary-structure', employeeId] as const
const salaryStructureHistoryKey = (employeeId: string) => ['salary-structure', employeeId, 'history'] as const

export function useSalaryComponents() {
  return useQuery({
    queryKey: salaryComponentsKey,
    queryFn: () => api.listSalaryComponents(),
  })
}

export function useCreateSalaryComponent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateSalaryComponentInput) => api.createSalaryComponent(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: salaryComponentsKey }),
  })
}

export function useUpdateSalaryComponent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSalaryComponentInput }) => api.updateSalaryComponent(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: salaryComponentsKey }),
  })
}

export function useDeactivateSalaryComponent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deactivateSalaryComponent(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: salaryComponentsKey }),
  })
}

export function useEmployeeSalaryStructure(employeeId: string) {
  return useQuery({
    queryKey: salaryStructureKey(employeeId),
    queryFn: () => api.getEmployeeSalaryStructure(employeeId),
    // A 404 here means "no active structure yet" — an expected, common state
    // (every employee starts with none) — not a transient failure to retry.
    retry: false,
  })
}

export function useSalaryStructureHistory(employeeId: string) {
  return useQuery({
    queryKey: salaryStructureHistoryKey(employeeId),
    queryFn: () => api.listSalaryStructureHistory(employeeId),
  })
}

export function useCreateSalaryStructure(employeeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateSalaryStructureInput) => api.createSalaryStructure(employeeId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salaryStructureKey(employeeId) })
      queryClient.invalidateQueries({ queryKey: salaryStructureHistoryKey(employeeId) })
    },
  })
}
