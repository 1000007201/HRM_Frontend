import { ApiError } from '../../lib/apiClient'
import { useApproveRegularization, usePendingRegularizations, useRejectRegularization } from '../../features/attendance/hooks'
import {
  describeRequestedChange,
  formatClockTime,
  formatDayLabel,
  statusClasses,
  statusLabel,
} from '../../features/attendance/display'
import type { PendingRegularization } from '../../features/attendance/types'
import { LoadingState } from '../../components/ui/Spinner'
import { DecisionActions } from '../../components/ui/DecisionActions'

function DecisionRow({ regularization }: { regularization: PendingRegularization }) {
  const approveRegularization = useApproveRegularization()
  const rejectRegularization = useRejectRegularization()

  return (
    <tr className="border-b border-card-border align-top last:border-0">
      <td className="py-2 text-body">{regularization.employee.fullName}</td>
      <td className="py-2 text-body">{formatDayLabel(regularization.date)}</td>
      <td className="py-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClasses(regularization.current.status)}`}>
          {statusLabel(regularization.current.status)}
        </span>
        <p className="mt-1 text-xs text-secondary">
          {formatClockTime(regularization.current.checkInAt)} / {formatClockTime(regularization.current.checkOutAt)}
        </p>
      </td>
      <td className="py-2 text-body">
        {describeRequestedChange(regularization)}
        <p className="mt-1 text-xs text-secondary">{regularization.type.replace('_', ' ').toLowerCase()}</p>
      </td>
      <td className="py-2 text-body">{regularization.reason}</td>
      <td className="py-2 text-right">
        <DecisionActions
          requestId={regularization.id}
          approveMutation={approveRegularization}
          rejectMutation={rejectRegularization}
        />
      </td>
    </tr>
  )
}

export function AttendanceApprovalsPage() {
  const { data, isPending, isError, error } = usePendingRegularizations()

  if (isPending) {
    return <LoadingState />
  }

  if (isError) {
    if (error instanceof ApiError && error.status === 403) {
      return <p className="text-sm text-secondary">You don't have access to attendance approvals.</p>
    }
    return <p className="text-sm text-error">Could not load pending regularizations. Please try again.</p>
  }

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold text-heading">Attendance approvals</h1>
      {data.regularizations.length === 0 ? (
        <p className="text-sm text-secondary">No pending regularization requests.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-card-border text-xs text-secondary">
              <th className="py-2 font-medium">Requester</th>
              <th className="py-2 font-medium">Date</th>
              <th className="py-2 font-medium">Currently</th>
              <th className="py-2 font-medium">Requested</th>
              <th className="py-2 font-medium">Reason</th>
              <th className="py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {data.regularizations.map((regularization) => (
              <DecisionRow key={regularization.id} regularization={regularization} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
