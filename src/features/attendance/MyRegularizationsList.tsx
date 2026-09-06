import { Button } from '../../components/ui/Button'
import { errorMessage } from '../../lib/apiClient'
import { useCancelRegularization, useMyRegularizations } from './hooks'
import { describeRequestedChange, formatDayLabel } from './display'
import { LoadingState } from '../../components/ui/Spinner'
import { RequestStatusBadge } from '../../components/ui/RequestStatusBadge'

export function MyRegularizationsList() {
  const { data, isPending, isError } = useMyRegularizations()
  const cancelRegularization = useCancelRegularization()

  if (isPending) {
    return <LoadingState size="sm" padding="py-6" />
  }

  if (isError) {
    return <p className="text-sm text-error">Could not load your regularization requests.</p>
  }

  if (data.regularizations.length === 0) {
    return <p className="text-sm text-muted">No regularization requests yet.</p>
  }

  return (
    <div>
      {cancelRegularization.isError && (
        <p className="mb-3 text-sm text-error">
          {errorMessage(cancelRegularization.error, 'Could not cancel the request.')}
        </p>
      )}
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs text-muted">
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
            <tr key={regularization.id} className="border-b border-border last:border-0 hover:bg-row-hover">
              <td className="py-2 text-ink-2">{formatDayLabel(regularization.date)}</td>
              <td className="py-2 text-ink-2">{regularization.type.replace('_', ' ').toLowerCase()}</td>
              <td className="py-2 text-ink-2">{describeRequestedChange(regularization)}</td>
              <td className="py-2 text-ink-2">{regularization.reason}</td>
              <td className="py-2">
                <RequestStatusBadge status={regularization.status} />
              </td>
              <td className="py-2 text-right">
                {regularization.status === 'PENDING' && (
                  <Button
                    variant="secondary"
                    fullWidth={false}
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
