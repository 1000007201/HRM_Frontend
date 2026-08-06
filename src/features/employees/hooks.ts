import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from './api'
import type { CreateEmployeeInput, UpdateEmployeeInput } from './types'

const employeesKey = (page: number, pageSize: number) => ['employees', { page, pageSize }] as const
const employeeKey = (id: string) => ['employees', id] as const
const invitationsKey = ['invitations'] as const

export function useEmployees(page: number, pageSize: number) {
  return useQuery({
    queryKey: employeesKey(page, pageSize),
    queryFn: () => api.listEmployees(page, pageSize),
  })
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: employeeKey(id),
    queryFn: () => api.getEmployee(id),
  })
}

export function useCreateEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateEmployeeInput) => api.createEmployee(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })
}

export function useUpdateEmployee(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateEmployeeInput) => api.updateEmployee(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })
}

export function useInviteEmployee(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.inviteEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKey(id) })
      queryClient.invalidateQueries({ queryKey: invitationsKey })
    },
  })
}

export function useInvitationLink(id: string) {
  return useMutation({
    mutationFn: () => api.getInvitationLink(id),
  })
}

export function useInvitations() {
  return useQuery({
    queryKey: invitationsKey,
    queryFn: () => api.listInvitations(),
  })
}

export function useCancelInvitation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.cancelInvitation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationsKey })
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })
}

export function useOrgChart() {
  return useQuery({
    queryKey: ['org-chart'],
    queryFn: () => api.getOrgChart(),
  })
}
