import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from './api'
import type { LeaveStatus } from './types'

const leaveTypesKey = ['leave', 'types'] as const
const myBalancesKey = ['leave', 'balances', 'me'] as const
const myRequestsKey = (status?: LeaveStatus) => ['leave', 'requests', 'me', status ?? 'all'] as const
const pendingRequestsKey = ['leave', 'requests', 'pending'] as const

export function useLeaveTypes() {
  return useQuery({
    queryKey: leaveTypesKey,
    queryFn: () => api.listLeaveTypes(),
  })
}

export function useCreateLeaveType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.createLeaveType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveTypesKey })
    },
  })
}

export function useMyLeaveBalances() {
  return useQuery({
    queryKey: myBalancesKey,
    queryFn: () => api.getMyLeaveBalances(),
  })
}

export function useMyLeaveRequests(status?: LeaveStatus) {
  return useQuery({
    queryKey: myRequestsKey(status),
    queryFn: () => api.listMyLeaveRequests(status),
  })
}

export function usePendingLeaveRequests() {
  return useQuery({
    queryKey: pendingRequestsKey,
    queryFn: () => api.listPendingLeaveRequests(),
  })
}

// Every mutation below invalidates the whole `leave` query root — approve/
// reject/cancel/create each touch some combination of the requests list and
// the balances panel, and re-fetching both is one cheap extra GET, not worth
// tracking the exact combination per action.
export function useCreateLeaveRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.createLeaveRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave'] })
    },
  })
}

export function useCancelLeaveRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.cancelLeaveRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave'] })
    },
  })
}

export function useApproveLeaveRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, decisionNote }: { id: string; decisionNote?: string }) => api.approveLeaveRequest(id, decisionNote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave'] })
    },
  })
}

export function useRejectLeaveRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, decisionNote }: { id: string; decisionNote?: string }) => api.rejectLeaveRequest(id, decisionNote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave'] })
    },
  })
}
