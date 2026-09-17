import { Link } from 'react-router-dom'
import { LoadingState } from '../../components/ui/Spinner'
import { DecisionActions } from '../../components/ui/DecisionActions'
import { useManagerApproveExpense, useManagerRejectExpense, usePendingManagerExpenses } from '../../features/expenses/hooks'
import { formatInr, formatMoney } from '../../features/expenses/display'
import type { ExpenseRequest } from '../../features/expenses/types'

function DecisionRow({ expenseRequest }: { expenseRequest: ExpenseRequest }) {
  const managerApproveExpense = useManagerApproveExpense()
  const managerRejectExpense = useManagerRejectExpense()

  return (
    <tr className="border-b border-border last:border-0 align-top hover:bg-row-hover">
      <td className="py-2 text-ink-2">{expenseRequest.employee.fullName}</td>
      <td className="py-2 text-ink-2">
        <Link to={`/expenses/${expenseRequest.id}`} className="text-primary hover:underline">
          {expenseRequest.title}
        </Link>
      </td>
      <td className="py-2 text-ink-2">{expenseRequest.expenseType.name}</td>
      <td className="py-2 text-ink-2">{formatMoney(expenseRequest.amount, expenseRequest.currency)}</td>
      <td className="py-2 text-ink-2">{formatInr(expenseRequest.amountInInr)}</td>
      <td className="py-2 text-right">
        <DecisionActions
          requestId={expenseRequest.id}
          approveMutation={managerApproveExpense}
          rejectMutation={managerRejectExpense}
        />
      </td>
    </tr>
  )
}

export function ExpenseApprovalsPage() {
  const { data, isPending, isError } = usePendingManagerExpenses()

  if (isPending) {
    return <LoadingState />
  }

  if (isError) {
    return <p className="text-sm text-error">Could not load expenses awaiting your approval. Please try again.</p>
  }

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold text-ink">Expense approvals</h1>
      {data.expenseRequests.length === 0 ? (
        <p className="text-sm text-muted">No expenses waiting for your approval.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted">
              <th className="py-2 font-medium">Employee</th>
              <th className="py-2 font-medium">Title</th>
              <th className="py-2 font-medium">Type</th>
              <th className="py-2 font-medium">Amount</th>
              <th className="py-2 font-medium">INR equivalent</th>
              <th className="py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {data.expenseRequests.map((expenseRequest) => (
              <DecisionRow key={expenseRequest.id} expenseRequest={expenseRequest} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
