import { Button } from '../../components/auth/Button'
import { ApiError } from '../../lib/apiClient'
import { useCancelRegularization, useMyRegularizations } from '../../features/attendance/hooks'
import { describeRequestedChange, formatDayLabel } from '../../features/attendance/display'
import type { RegularizationStatus } from '../../features/attendance/types'

const REQUEST_STATUS_CLASSES: Record<RegularizationStatus, string> = {
  PENDING: 'bg-warning-bg text-warning',
  APPROVED: 'bg-success-bg text-success',
  REJECTED: 'bg-error-bg text-error',
  CANCELLED: 'bg-charcoal-50 text-secondary',
}

export function MyRegularizationsList() {
  const { data, isPending, isError } = useMyRegularizations()
  const cancelRegularization = useCancelRegularization()

  if (isPending) {
    return (
      <div className="flex justify-center py-6">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary-100 border-t-primary-300" />
      </div>
    )
  }

  if (isError) {
    return <p className="text-sm text-error">Could not load your regularization requests.</p>
  }

  if (data.regularizations.length === 0) {
    return <p className="text-sm text-secondary">No regularization requests yet.</p>
  }

  return (
    <div>
      {cancelRegularization.isError && (
        <p className="mb-3 text-sm text-error">
          {cancelRegularization.error instanceof ApiError
            ? cancelRegularization.error.message
            : 'Could not cancel the request.'}
        </p>
      )}
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-card-border text-xs text-secondary">
            <th className="py-2 font-medium">Date</th>
            <th className="py-2 font-medium">Type</th>
            <th className="py-2 font-medium">Requested</th>
            <th className="py-2 font-medium">Reason</th>
            <th className="py-2 font-medium">Status</th>
            <th className="py-2 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {data.regularizations.map((regularization) => (
            <tr key={regularization.id} className="border-b border-card-border last:border-0">
              <td className="py-2 text-body">{formatDayLabel(regularization.date)}</td>
              <td className="py-2 text-body">{regularization.type.replace('_', ' ').toLowerCase()}</td>
              <td className="py-2 text-body">{describeRequestedChange(regularization)}</td>
              <td className="py-2 text-body">{regularization.reason}</td>
              <td className="py-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${REQUEST_STATUS_CLASSES[regularization.status]}`}
                >
                  {regularization.status}
                </span>
              </td>
              <td className="py-2 text-right">
                {regularization.status === 'PENDING' && (
                  <Button
                    variant="secondary"
                    className="w-auto"
                    isLoading={cancelRegularization.isPending && cancelRegularization.variables === regularization.id}
                    onClick={() => cancelRegularization.mutate(regularization.id)}
                  >
                    Cancel
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
