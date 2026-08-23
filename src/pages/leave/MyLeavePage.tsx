import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { errorMessage } from '../../lib/apiClient'
import { useCancelLeaveRequest, useMyLeaveBalances, useMyLeaveRequests } from '../../features/leave/hooks'
import { LoadingState } from '../../components/ui/Spinner'
import { RequestStatusBadge } from '../../components/ui/RequestStatusBadge'

function BalancesPanel() {
  const { data, isPending, isError } = useMyLeaveBalances()

  if (isPending) {
    return <LoadingState size="sm" padding="py-4" />
  }

  if (isError) {
    return <p className="text-sm text-error">Could not load leave balances.</p>
  }

  if (data.balances.length === 0) {
    return <p className="text-sm text-secondary">No leave types configured yet.</p>
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {data.balances.map((balance) => (
        <div key={balance.leaveTypeId} className="rounded-md border border-card-border bg-white p-4">
          <p className="text-sm font-medium text-heading">{balance.name}</p>
          <p className="mt-2 text-2xl font-semibold text-primary-300">{balance.availableDays}</p>
          <p className="text-xs text-secondary">
            available · {balance.accruedDays} accrued, {balance.usedDays} used
          </p>
        </div>
      ))}
    </div>
  )
}

function RequestHistory() {
  const { data, isPending, isError } = useMyLeaveRequests()
  const cancelLeaveRequest = useCancelLeaveRequest()

  if (isPending) {
    return <LoadingState />
  }

  if (isError) {
    return <p className="text-sm text-error">Could not load your leave requests.</p>
  }

  if (data.leaveRequests.length === 0) {
    return <p className="text-sm text-secondary">No leave requests yet.</p>
  }

  return (
    <div>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-card-border text-xs text-secondary">
            <th className="py-2 font-medium">Type</th>
            <th className="py-2 font-medium">Dates</th>
            <th className="py-2 font-medium">Working days</th>
            <th className="py-2 font-medium">Status</th>
            <th className="py-2 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {data.leaveRequests.map((leaveRequest) => (
            <tr key={leaveRequest.id} className="border-b border-card-border last:border-0">
              <td className="py-2 text-body">{leaveRequest.leaveType.name}</td>
              <td className="py-2 text-body">
                {new Date(leaveRequest.startDate).toLocaleDateString()}
                {leaveRequest.startDate !== leaveRequest.endDate && ` – ${new Date(leaveRequest.endDate).toLocaleDateString()}`}
                {leaveRequest.isHalfDay && ' (half-day)'}
              </td>
              <td className="py-2 text-body">{leaveRequest.workingDays}</td>
              <td className="py-2">
                <RequestStatusBadge status={leaveRequest.status} />
              </td>
              <td className="py-2 text-right">
                {leaveRequest.status === 'PENDING' && (
                  <Button
                    variant="secondary"
                    className="w-auto"
                    isLoading={cancelLeaveRequest.isPending && cancelLeaveRequest.variables === leaveRequest.id}
                    onClick={() => cancelLeaveRequest.mutate(leaveRequest.id)}
                  >
                    Cancel
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {cancelLeaveRequest.isError && (
        <p className="mt-3 text-sm text-error">
          {errorMessage(cancelLeaveRequest.error, 'Could not cancel the request.')}
        </p>
      )}
    </div>
  )
}

export function MyLeavePage() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-heading">My leave</h1>
        <Link to="/leave/apply">
          <Button className="w-auto">Apply for leave</Button>
        </Link>
      </div>
      <div className="mb-8">
        <h2 className="mb-3 text-sm font-medium text-heading">Balances</h2>
        <BalancesPanel />
      </div>
      <div>
        <h2 className="mb-3 text-sm font-medium text-heading">Request history</h2>
        <RequestHistory />
      </div>
    </div>
  )
}
