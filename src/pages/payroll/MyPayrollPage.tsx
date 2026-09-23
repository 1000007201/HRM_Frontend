import { useState } from 'react'
import { LoadingState } from '../../components/ui/Spinner'
import { errorMessage } from '../../lib/apiClient'
import { useMyEmployee } from '../../features/employees/hooks'
import { PayslipHistoryPanel } from '../../features/payroll/PayslipHistoryPanel'
import { TaxDeclarationPanel } from '../../features/payroll/TaxDeclarationPanel'

export function MyPayrollPage() {
  const { data, isPending, isError, error } = useMyEmployee()
  const [activeTab, setActiveTab] = useState<'payslips' | 'tax'>('payslips')

  if (isPending) {
    return <LoadingState />
  }

  if (isError || !data) {
    return <p className="text-sm text-error">{errorMessage(error, 'Could not load your payroll details.')}</p>
  }

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-lg font-semibold text-ink">My payroll</h1>

      <div className="mb-6 flex gap-2 border-b border-border">
        {(['payslips', 'tax'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
              activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-ink-2 hover:text-ink'
            }`}
          >
            {tab === 'payslips' ? 'Payslips' : 'Tax declaration'}
          </button>
        ))}
      </div>

      {activeTab === 'payslips' ? (
        <PayslipHistoryPanel employeeId={data.employee.id} />
      ) : (
        <TaxDeclarationPanel employeeId={data.employee.id} />
      )}
    </div>
  )
}
