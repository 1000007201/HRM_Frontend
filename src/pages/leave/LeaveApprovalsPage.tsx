import { ApiError } from '../../lib/apiClient'
import { useApproveLeaveRequest, usePendingLeaveRequests, useRejectLeaveRequest } from '../../features/leave/hooks'
import type { PendingLeaveRequest } from '../../features/leave/types'
import { LoadingState } from '../../components/ui/Spinner'
import { DecisionActions } from '../../components/ui/DecisionActions'

function DecisionRow({ leaveRequest }: { leaveRequest: PendingLeaveRequest }) {
  const approveLeaveRequest = useApproveLeaveRequest()
  const rejectLeaveRequest = useRejectLeaveRequest()

  return (
    <tr className="border-b border-border last:border-0 align-top hover:bg-row-hover">
      <td className="py-2 text-ink-2">{leaveRequest.employee.fullName}</td>
      <td className="py-2 text-ink-2">{leaveRequest.leaveType.name}</td>
      <td className="py-2 text-ink-2">
        {new Date(leaveRequest.startDate).toLocaleDateString()}
        {leaveRequest.startDate !== leaveRequest.endDate && ` – ${new Date(leaveRequest.endDate).toLocaleDateString()}`}
        {leaveRequest.isHalfDay && ' (half-day)'}
      </td>
      <td className="py-2 text-ink-2">{leaveRequest.workingDays}</td>
      <td className="py-2 text-ink-2">{leaveRequest.reason ?? '—'}</td>
      <td className="py-2 text-right">
        <DecisionActions
          requestId={leaveRequest.id}
          approveMutation={approveLeaveRequest}
          rejectMutation={rejectLeaveRequest}
        />
      </td>
    </tr>
  )
}

export function LeaveApprovalsPage() {
  const { data, isPending, isError, error } = usePendingLeaveRequests()

  if (isPending) {
    return <LoadingState />
  }

  if (isError) {
    if (error instanceof ApiError && error.status === 403) {
      return <p className="text-sm text-muted">You don't have access to leave approvals.</p>
    }
    return <p className="text-sm text-error">Could not load pending leave requests. Please try again.</p>
  }

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold text-ink">Leave approvals</h1>
      {data.leaveRequests.length === 0 ? (
        <p className="text-sm text-muted">No pending leave requests.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted">
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
