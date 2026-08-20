import { useState } from 'react'
import { Button } from '../../components/auth/Button'
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

function DecisionRow({ regularization }: { regularization: PendingRegularization }) {
  const [decisionKind, setDecisionKind] = useState<'approve' | 'reject' | null>(null)
  const [decisionNote, setDecisionNote] = useState('')
  const approveRegularization = useApproveRegularization()
  const rejectRegularization = useRejectRegularization()

  const mutation = decisionKind === 'reject' ? rejectRegularization : approveRegularization

  async function confirmDecision() {
    if (!decisionKind) return
    const chosen = decisionKind === 'approve' ? approveRegularization : rejectRegularization
    try {
      await chosen.mutateAsync({ id: regularization.id, decisionNote: decisionNote.trim() || undefined })
      setDecisionKind(null)
    } catch {
      // surfaced below via mutation.isError
    }
  }

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
        {decisionKind ? (
          <div className="flex flex-col items-end gap-2">
            <textarea
              rows={2}
              placeholder="Decision note (optional)"
              value={decisionNote}
              onChange={(event) => setDecisionNote(event.target.value)}
              className="w-56 rounded-md border border-charcoal-100 px-2 py-1 text-sm text-body placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
            {mutation.isError && (
              <p className="text-xs text-error">
                {mutation.error instanceof ApiError ? mutation.error.message : 'Action failed.'}
              </p>
            )}
            <div className="flex gap-2">
              <Button variant="secondary" className="w-auto" onClick={() => setDecisionKind(null)}>
                Cancel
              </Button>
              <Button className="w-auto" isLoading={mutation.isPending} onClick={confirmDecision}>
                Confirm {decisionKind}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <Button variant="secondary" className="w-auto" onClick={() => setDecisionKind('reject')}>
              Reject
            </Button>
            <Button className="w-auto" onClick={() => setDecisionKind('approve')}>
              Approve
            </Button>
          </div>
        )}
      </td>
    </tr>
  )
}

export function AttendanceApprovalsPage() {
  const { data, isPending, isError, error } = usePendingRegularizations()

  if (isPending) {
    return (
      <div className="flex justify-center py-8">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary-100 border-t-primary-300" />
      </div>
    )
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
