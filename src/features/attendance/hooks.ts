import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from './api'
import type { CreateRegularizationInput, MarkAttendanceInput, RegularizationStatus } from './types'

export function useMyMonth(month: string) {
  return useQuery({
    queryKey: ['attendance', 'me', month],
    queryFn: () => api.getMyMonth(month),
  })
}

export function useOrgDay(date: string) {
  return useQuery({
    queryKey: ['attendance', 'org-day', date],
    queryFn: () => api.getOrgDay(date),
  })
}

export function useMyRegularizations(status?: RegularizationStatus) {
  return useQuery({
    queryKey: ['attendance', 'regularizations', 'me', status ?? 'all'],
    queryFn: () => api.listMyRegularizations(status),
  })
}

export function usePendingRegularizations() {
  return useQuery({
    queryKey: ['attendance', 'regularizations', 'pending'],
    queryFn: () => api.listPendingRegularizations(),
  })
}

// Everything below invalidates the whole `attendance` root. Approving a
// regularization rewrites an attendance record, marking changes a day the
// employee's own month view also shows, and check-in/out moves both today's
// widget and the calendar — the cross-links are dense enough that tracking
// exactly which keys each action touches would cost more than one extra GET.
function useInvalidateAttendance() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['attendance'] })
}

export function useCheckIn() {
  const invalidateAttendance = useInvalidateAttendance()
  return useMutation({ mutationFn: api.checkIn, onSuccess: invalidateAttendance })
}

export function useCheckOut() {
  const invalidateAttendance = useInvalidateAttendance()
  return useMutation({ mutationFn: api.checkOut, onSuccess: invalidateAttendance })
}

export function useMarkAttendance() {
  const invalidateAttendance = useInvalidateAttendance()
  return useMutation({
    mutationFn: (input: MarkAttendanceInput) => api.markAttendance(input),
    onSuccess: invalidateAttendance,
  })
}

export function useCreateRegularization() {
  const invalidateAttendance = useInvalidateAttendance()
  return useMutation({
    mutationFn: (input: CreateRegularizationInput) => api.createRegularization(input),
    onSuccess: invalidateAttendance,
  })
}

export function useCancelRegularization() {
  const invalidateAttendance = useInvalidateAttendance()
  return useMutation({
    mutationFn: (id: string) => api.cancelRegularization(id),
    onSuccess: invalidateAttendance,
  })
}

export function useApproveRegularization() {
  const invalidateAttendance = useInvalidateAttendance()
  return useMutation({
    mutationFn: ({ id, decisionNote }: { id: string; decisionNote?: string }) => api.approveRegularization(id, decisionNote),
    onSuccess: invalidateAttendance,
  })
}

export function useRejectRegularization() {
  const invalidateAttendance = useInvalidateAttendance()
  return useMutation({
    mutationFn: ({ id, decisionNote }: { id: string; decisionNote?: string }) => api.rejectRegularization(id, decisionNote),
    onSuccess: invalidateAttendance,
  })
}
