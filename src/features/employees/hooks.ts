import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from './api'
import type { CreateDepartmentInput, CreateEmployeeInput, EmployeeDocumentType, UpdateDepartmentInput, UpdateEmployeeInput } from './types'

const employeesKey = (page: number, pageSize: number) => ['employees', { page, pageSize }] as const
const employeeKey = (id: string) => ['employees', id] as const
const employeeDocumentsKey = (employeeId: string) => ['employees', employeeId, 'documents'] as const
const invitationsKey = ['invitations'] as const
const departmentsKey = ['departments'] as const

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

export function useEmployeeDocuments(employeeId: string) {
  return useQuery({
    queryKey: employeeDocumentsKey(employeeId),
    queryFn: () => api.listEmployeeDocuments(employeeId),
  })
}

export function useUploadEmployeeDocument(employeeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ type, file }: { type: EmployeeDocumentType; file: File }) =>
      api.uploadEmployeeDocument(employeeId, type, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeDocumentsKey(employeeId) })
    },
  })
}

export function useDeleteEmployeeDocument(employeeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (documentId: string) => api.deleteEmployeeDocument(employeeId, documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeDocumentsKey(employeeId) })
    },
  })
}

export function useDepartments() {
  return useQuery({
    queryKey: departmentsKey,
    queryFn: () => api.listDepartments(),
  })
}

export function useCreateDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateDepartmentInput) => api.createDepartment(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentsKey })
    },
  })
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateDepartmentInput }) => api.updateDepartment(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentsKey })
    },
  })
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentsKey })
    },
  })
}
