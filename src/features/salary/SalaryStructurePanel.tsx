import { useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { LoadingState } from '../../components/ui/Spinner'
import { ApiError, errorMessage } from '../../lib/apiClient'
import { formatCalendarDate } from '../employees/display'
import { formatInr } from '../expenses/display'
import { AssignSalaryStructureForm } from './AssignSalaryStructureForm'
import { useEmployeeSalaryStructure, useSalaryComponents, useSalaryStructureHistory } from './hooks'
import { COMPONENT_TYPE_LABELS, type SalaryStructure } from './types'

function StructureComponentsTable({ structure }: { structure: SalaryStructure }) {
  return (
    <table className="mt-2 w-full text-left text-sm">
      <thead>
        <tr className="border-b border-border text-xs text-muted">
          <th className="py-2 font-medium">Name</th>
          <th className="py-2 font-medium">Type</th>
          <th className="py-2 font-medium">Monthly amount</th>
          <th className="py-2 font-medium">Annual amount</th>
        </tr>
      </thead>
      <tbody>
        {structure.components.map((structureComponent) => (
          <tr key={structureComponent.id} className="border-b border-border last:border-0">
            <td className="py-2 text-ink-2">{structureComponent.component.name}</td>
            <td className="py-2 text-ink-2">{COMPONENT_TYPE_LABELS[structureComponent.component.componentType]}</td>
            <td className="py-2 text-ink-2">{formatInr(structureComponent.monthlyAmount)}</td>
            <td className="py-2 text-ink-2">{formatInr(structureComponent.annualAmount)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function StructureHistory({ employeeId }: { employeeId: string }) {
  const { data, isPending, isError, error } = useSalaryStructureHistory(employeeId)

  if (isPending) {
    return <LoadingState padding="py-4" />
  }

  if (isError) {
    return <p className="text-sm text-error">{errorMessage(error, 'Could not load salary history.')}</p>
  }

  // The active structure (effectiveTo: null) is already shown in "Current
  // structure" above — history here is the superseded ones only.
  const pastStructures = data.structures.filter((structure) => structure.effectiveTo !== null)

  if (pastStructures.length === 0) {
    return <p className="text-sm text-muted">No past salary structures.</p>
  }

  return (
    <div className="flex flex-col gap-2">
      {pastStructures.map((structure) => (
        <details key={structure.id} className="rounded-md border border-border bg-white px-4 py-2">
          <summary className="cursor-pointer text-sm text-ink-2">
            {formatInr(structure.annualCtc)} / yr · {formatCalendarDate(structure.effectiveFrom)} –{' '}
            {formatCalendarDate(structure.effectiveTo)}
          </summary>
          <StructureComponentsTable structure={structure} />
        </details>
      ))}
    </div>
  )
}

export function SalaryStructurePanel({ employeeId }: { employeeId: string }) {
  const current = useEmployeeSalaryStructure(employeeId)
  const { data: componentsData } = useSalaryComponents()
  const [isFormOpen, setIsFormOpen] = useState(false)

  const activeComponents = (componentsData?.salaryComponents ?? []).filter((component) => component.isActive)
  const noActiveStructure = current.isError && current.error instanceof ApiError && current.error.status === 404

  return (
    <div className="mt-6 rounded-2xl border border-border bg-canvas p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-ink">Current structure</p>
        {(current.data || noActiveStructure) && (
          <Button fullWidth={false} onClick={() => setIsFormOpen(true)}>
            {current.data ? 'Revise structure' : 'Assign structure'}
          </Button>
        )}
      </div>

      {current.isPending ? (
        <LoadingState padding="py-4" />
      ) : noActiveStructure ? (
        <p className="text-sm text-muted">This employee has no active salary structure yet.</p>
      ) : current.isError ? (
        <p className="text-sm text-error">{errorMessage(current.error, 'Could not load the salary structure.')}</p>
      ) : (
        <div>
          <p className="mb-1 text-sm text-ink-2">
            CTC: <span className="font-medium text-ink">{formatInr(current.data.structure.annualCtc)} / yr</span>
          </p>
          <p className="mb-3 text-xs text-muted">
            Effective from {formatCalendarDate(current.data.structure.effectiveFrom)}
          </p>
          <StructureComponentsTable structure={current.data.structure} />
        </div>
      )}

      {isFormOpen && (
        <Modal title={current.data ? 'Revise salary structure' : 'Assign salary structure'} onClose={() => setIsFormOpen(false)}>
          <AssignSalaryStructureForm
            employeeId={employeeId}
            activeComponents={activeComponents}
            seedStructure={current.data?.structure}
            onDone={() => setIsFormOpen(false)}
          />
        </Modal>
      )}

      <div className="mt-6 border-t border-border pt-4">
        <p className="mb-3 text-sm font-medium text-ink">Structure history</p>
        <StructureHistory employeeId={employeeId} />
      </div>
    </div>
  )
}
