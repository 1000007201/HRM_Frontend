import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { LoadingState } from '../../components/ui/Spinner'
import { DecisionActions } from '../../components/ui/DecisionActions'
import { errorMessage } from '../../lib/apiClient'
import { useActiveMemberRole } from '../../lib/useActiveMemberRole'
import {
  useAdminApproveExpense,
  useAdminRejectExpense,
  useApprovedExpenses,
  useInitiateExpensePayment,
  usePendingAdminExpenses,
} from '../../features/expenses/hooks'
import { formatExpenseDate, formatInr, formatMoney } from '../../features/expenses/display'
import type { ExpenseRequest } from '../../features/expenses/types'

type Tab = 'pending-admin' | 'approved'

function sumInr(expenseRequests: ExpenseRequest[]): number {
  return expenseRequests.reduce((total, expenseRequest) => total + Number(expenseRequest.amountInInr), 0)
}

function PendingAdminRow({ expenseRequest }: { expenseRequest: ExpenseRequest }) {
  const adminApproveExpense = useAdminApproveExpense()
  const adminRejectExpense = useAdminRejectExpense()

  return (
    <tr className="border-b border-border last:border-0 align-top hover:bg-row-hover">
      <td className="py-2 text-ink-2">{expenseRequest.employee.fullName}</td>
      <td className="py-2 text-ink-2">
        <Link to={`/expenses/${expenseRequest.id}`} className="text-primary hover:underline">
          {expenseRequest.title}
        </Link>
      </td>
      <td className="py-2 text-ink-2">{formatExpenseDate(expenseRequest.expenseDate)}</td>
      <td className="py-2 text-ink-2">{expenseRequest.expenseType.name}</td>
      <td className="py-2 text-ink-2">{formatMoney(expenseRequest.amount, expenseRequest.currency)}</td>
      <td className="py-2 text-ink-2">{formatInr(expenseRequest.amountInInr)}</td>
      <td className="py-2 text-right">
        <DecisionActions
          requestId={expenseRequest.id}
          approveMutation={adminApproveExpense}
          rejectMutation={adminRejectExpense}
        />
      </td>
    </tr>
  )
}

function ApprovedRow({ expenseRequest }: { expenseRequest: ExpenseRequest }) {
  const initiateExpensePayment = useInitiateExpensePayment()

  return (
    <tr className="border-b border-border last:border-0 align-top hover:bg-row-hover">
      <td className="py-2 text-ink-2">{expenseRequest.employee.fullName}</td>
      <td className="py-2 text-ink-2">
        <Link to={`/expenses/${expenseRequest.id}`} className="text-primary hover:underline">
          {expenseRequest.title}
        </Link>
      </td>
      <td className="py-2 text-ink-2">{formatExpenseDate(expenseRequest.expenseDate)}</td>
      <td className="py-2 text-ink-2">{expenseRequest.expenseType.name}</td>
      <td className="py-2 text-ink-2">{formatMoney(expenseRequest.amount, expenseRequest.currency)}</td>
      <td className="py-2 text-ink-2">{formatInr(expenseRequest.amountInInr)}</td>
      <td className="py-2 text-right">
        <Button
          fullWidth={false}
          isLoading={initiateExpensePayment.isPending}
          onClick={() => initiateExpensePayment.mutate(expenseRequest.id)}
        >
          Initiate payment
        </Button>
        {initiateExpensePayment.isError && (
          <p className="mt-1 text-xs text-error">
            {errorMessage(initiateExpensePayment.error, 'Could not initiate payment.')}
          </p>
        )}
      </td>
    </tr>
  )
}

function AdminExpenseTabs() {
  const [tab, setTab] = useState<Tab>('pending-admin')
  const pendingAdmin = usePendingAdminExpenses()
  const approved = useApprovedExpenses()

  const activeQuery = tab === 'pending-admin' ? pendingAdmin : approved
  const rows = activeQuery.data?.expenseRequests ?? []

  return (
    <div>
      <div className="mb-6 flex gap-2 border-b border-border">
        <button
          type="button"
          onClick={() => setTab('pending-admin')}
          className={`px-4 py-2 text-sm font-medium ${
            tab === 'pending-admin' ? 'border-b-2 border-primary text-primary' : 'text-ink-2 hover:text-ink'
          }`}
        >
          Pending admin
        </button>
        <button
          type="button"
          onClick={() => setTab('approved')}
          className={`px-4 py-2 text-sm font-medium ${
            tab === 'approved' ? 'border-b-2 border-primary text-primary' : 'text-ink-2 hover:text-ink'
          }`}
        >
          Approved
        </button>
      </div>

      {activeQuery.isPending ? (
        <LoadingState />
      ) : activeQuery.isError ? (
        <p className="text-sm text-error">Could not load expenses. Please try again.</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted">
          {tab === 'pending-admin' ? 'No expenses awaiting admin review.' : 'No approved expenses awaiting payment.'}
        </p>
      ) : (
        <div>
          <p className="mb-3 text-sm text-muted">
            Total: <span className="font-medium text-ink">{formatInr(sumInr(rows))}</span>
          </p>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted">
                <th className="py-2 font-medium">Employee</th>
                <th className="py-2 font-medium">Title</th>
                <th className="py-2 font-medium">Date</th>
                <th className="py-2 font-medium">Type</th>
                <th className="py-2 font-medium">Amount</th>
                <th className="py-2 font-medium">INR equivalent</th>
                <th className="py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {tab === 'pending-admin'
                ? rows.map((expenseRequest) => <PendingAdminRow key={expenseRequest.id} expenseRequest={expenseRequest} />)
                : rows.map((expenseRequest) => <ApprovedRow key={expenseRequest.id} expenseRequest={expenseRequest} />)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export function AdminExpensesPage() {
  const { canManageEmployees: isAdmin, isLoading } = useActiveMemberRole()

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold text-ink">Admin expenses</h1>
      {isLoading ? (
        <LoadingState />
      ) : isAdmin ? (
        <AdminExpenseTabs />
      ) : (
        <p className="text-sm text-muted">You don't have access to admin expenses.</p>
      )}
    </div>
  )
}
