import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { LoadingState } from '../../components/ui/Spinner'
import { errorMessage } from '../../lib/apiClient'
import { useCancelExpenseRequest, useMyExpenses } from '../../features/expenses/hooks'
import { formatInr, formatMoney } from '../../features/expenses/display'
import { ExpenseStatusBadge } from '../../features/expenses/StatusBadge'

export function MyExpensesPage() {
  const { data, isPending, isError } = useMyExpenses()
  const cancelExpenseRequest = useCancelExpenseRequest()

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-ink">My expenses</h1>
        <Link to="/expenses/new">
          <Button fullWidth={false}>Raise an expense</Button>
        </Link>
      </div>

      {isPending ? (
        <LoadingState />
      ) : isError ? (
        <p className="text-sm text-error">Could not load your expenses. Please try again.</p>
      ) : data.expenseRequests.length === 0 ? (
        <p className="text-sm text-muted">No expenses raised yet.</p>
      ) : (
        <div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted">
                <th className="py-2 font-medium">Type</th>
                <th className="py-2 font-medium">Title</th>
                <th className="py-2 font-medium">Amount</th>
                <th className="py-2 font-medium">INR equivalent</th>
                <th className="py-2 font-medium">Status</th>
                <th className="py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {data.expenseRequests.map((expenseRequest) => (
                <tr key={expenseRequest.id} className="border-b border-border last:border-0 hover:bg-row-hover">
                  <td className="py-2 text-ink-2">{expenseRequest.expenseType.name}</td>
                  <td className="py-2 text-ink-2">
                    <Link to={`/expenses/${expenseRequest.id}`} className="text-primary hover:underline">
                      {expenseRequest.title}
                    </Link>
                  </td>
                  <td className="py-2 text-ink-2">{formatMoney(expenseRequest.amount, expenseRequest.currency)}</td>
                  <td className="py-2 text-ink-2">{formatInr(expenseRequest.amountInInr)}</td>
                  <td className="py-2">
                    <ExpenseStatusBadge status={expenseRequest.status} />
                  </td>
                  <td className="py-2 text-right">
                    {expenseRequest.status === 'PENDING_MANAGER' && (
                      <Button
                        variant="secondary"
                        fullWidth={false}
                        isLoading={cancelExpenseRequest.isPending && cancelExpenseRequest.variables === expenseRequest.id}
                        onClick={() => cancelExpenseRequest.mutate(expenseRequest.id)}
                      >
                        Cancel
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {cancelExpenseRequest.isError && (
            <p className="mt-3 text-sm text-error">
              {errorMessage(cancelExpenseRequest.error, 'Could not cancel the request.')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
