import { useState } from 'react'
import { Button } from '../../components/auth/Button'
import { ApiError } from '../../lib/apiClient'
import { useApproveLeaveRequest, usePendingLeaveRequests, useRejectLeaveRequest } from '../../features/leave/hooks'
import type { PendingLeaveRequest } from '../../features/leave/types'

type PendingAction = { requestId: string; kind: 'approve' | 'reject' }

function DecisionRow({ leaveRequest }: { leaveRequest: PendingLeaveRequest }) {
  const [action, setAction] = useState<PendingAction | null>(null)
  const [decisionNote, setDecisionNote] = useState('')
  const approveLeaveRequest = useApproveLeaveRequest()
  const rejectLeaveRequest = useRejectLeaveRequest()

  const isActingOnThis = action?.requestId === leaveRequest.id
  const mutation = action?.kind === 'reject' ? rejectLeaveRequest : approveLeaveRequest

  function startAction(kind: 'approve' | 'reject') {
    setAction({ requestId: leaveRequest.id, kind })
    setDecisionNote('')
  }

  async function confirmAction() {
    if (!action) return
    const mutateFn = action.kind === 'approve' ? approveLeaveRequest : rejectLeaveRequest
    try {
      await mutateFn.mutateAsync({ id: leaveRequest.id, decisionNote: decisionNote.trim() || undefined })
      setAction(null)
    } catch {
      // error is surfaced below via mutation.isError
    }
  }

  return (
    <tr className="border-b border-card-border last:border-0 align-top">
      <td className="py-2 text-body">{leaveRequest.employee.fullName}</td>
      <td className="py-2 text-body">{leaveRequest.leaveType.name}</td>
      <td className="py-2 text-body">
        {new Date(leaveRequest.startDate).toLocaleDateString()}
        {leaveRequest.startDate !== leaveRequest.endDate && ` – ${new Date(leaveRequest.endDate).toLocaleDateString()}`}
        {leaveRequest.isHalfDay && ' (half-day)'}
      </td>
      <td className="py-2 text-body">{leaveRequest.workingDays}</td>
      <td className="py-2 text-body">{leaveRequest.reason ?? '—'}</td>
      <td className="py-2 text-right">
        {isActingOnThis ? (
          <div className="flex flex-col items-end gap-2">
            <textarea
              rows={2}
              placeholder="Decision note (optional)"
              value={decisionNote}
              onChange={(event) => setDecisionNote(event.target.value)}
              className="w-56 rounded-md border border-charcoal-100 px-2 py-1 text-sm text-body placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
            {mutation.isError && (
              <p className="text-xs text-error">{mutation.error instanceof ApiError ? mutation.error.message : 'Action failed.'}</p>
            )}
            <div className="flex gap-2">
              <Button variant="secondary" className="w-auto" onClick={() => setAction(null)}>
                Cancel
              </Button>
              <Button className="w-auto" isLoading={mutation.isPending} onClick={confirmAction}>
                Confirm {action.kind}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <Button variant="secondary" className="w-auto" onClick={() => startAction('reject')}>
              Reject
            </Button>
            <Button className="w-auto" onClick={() => startAction('approve')}>
              Approve
            </Button>
          </div>
        )}
      </td>
    </tr>
  )
}

export function LeaveApprovalsPage() {
  const { data, isPending, isError, error } = usePendingLeaveRequests()

  if (isPending) {
    return (
      <div className="flex justify-center py-8">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary-100 border-t-primary-300" />
      </div>
    )
  }

  if (isError) {
    if (error instanceof ApiError && error.status === 403) {
      return <p className="text-sm text-secondary">You don't have access to leave approvals.</p>
    }
    return <p className="text-sm text-error">Could not load pending leave requests. Please try again.</p>
  }

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold text-heading">Leave approvals</h1>
      {data.leaveRequests.length === 0 ? (
        <p className="text-sm text-secondary">No pending leave requests.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-card-border text-xs text-secondary">
              <th className="py-2 font-medium">Requester</th>
              <th className="py-2 font-medium">Type</th>
              <th className="py-2 font-medium">Dates</th>
              <th className="py-2 font-medium">Working days</th>
              <th className="py-2 font-medium">Reason</th>
              <th className="py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {data.leaveRequests.map((leaveRequest) => (
              <DecisionRow key={leaveRequest.id} leaveRequest={leaveRequest} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
