import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { LoadingState } from '../../components/ui/Spinner'
import { errorMessage } from '../../lib/apiClient'
import { useActiveMemberRole } from '../../lib/useActiveMemberRole'
import { describeComponentValue } from '../../features/salary/display'
import {
  useCreateSalaryComponent,
  useDeactivateSalaryComponent,
  useSalaryComponents,
  useUpdateSalaryComponent,
} from '../../features/salary/hooks'
import { SalaryComponentForm } from '../../features/salary/SalaryComponentForm'
import { COMPONENT_TYPE_LABELS, type SalaryComponent } from '../../features/salary/types'
import type { SalaryComponentFormValues } from '../../features/salary/validation'

function toCreateInput(values: SalaryComponentFormValues) {
  return {
    name: values.name,
    code: values.code,
    componentType: values.componentType,
    calcType: values.calcType,
    fixedAmount: values.calcType === 'FIXED' ? values.fixedAmount : undefined,
    percentage: values.calcType === 'PERCENTAGE' ? values.percentage : undefined,
    // An empty base is "percentage of the annual CTC" — the backend reads
    // that as a null baseComponentId, not as an empty string.
    baseComponentId: values.calcType === 'PERCENTAGE' ? values.baseComponentId || undefined : undefined,
    sequence: values.sequence,
  }
}

// PUT needs explicit `null` (not `undefined`) for whichever of
// fixedAmount/percentage/baseComponentId the chosen calcType doesn't use.
// `undefined` gets dropped by JSON.stringify, and the backend's partial-update
// merge treats an absent field as "keep the existing value" — so switching an
// existing PERCENTAGE component to FIXED, say, would otherwise leave its old
// percentage/baseComponentId in place and fail the backend's calcType-shape
// check. The create schema doesn't accept `null` at all, hence a separate function.
function toUpdateInput(values: SalaryComponentFormValues) {
  return {
    name: values.name,
    code: values.code,
    componentType: values.componentType,
    calcType: values.calcType,
    fixedAmount: values.calcType === 'FIXED' ? values.fixedAmount : null,
    percentage: values.calcType === 'PERCENTAGE' ? values.percentage : null,
    baseComponentId: values.calcType === 'PERCENTAGE' ? values.baseComponentId || null : null,
    sequence: values.sequence,
  }
}

function AddComponentModal({ nextSequence, onClose }: { nextSequence: number; onClose: () => void }) {
  const createSalaryComponent = useCreateSalaryComponent()
  const [serverError, setServerError] = useState('')

  async function handleSubmit(values: SalaryComponentFormValues) {
    setServerError('')
    try {
      await createSalaryComponent.mutateAsync(toCreateInput(values))
      onClose()
    } catch (error) {
      setServerError(errorMessage(error, 'Could not add the component. Please try again.'))
    }
  }

  return (
    <Modal title="Add component" onClose={onClose}>
      <SalaryComponentForm
        submitLabel="Add component"
        serverError={serverError}
        defaultValues={{ sequence: nextSequence }}
        onSubmit={handleSubmit}
      />
    </Modal>
  )
}

function EditComponentModal({ component, onClose }: { component: SalaryComponent; onClose: () => void }) {
  const updateSalaryComponent = useUpdateSalaryComponent()
  const [serverError, setServerError] = useState('')

  async function handleSubmit(values: SalaryComponentFormValues) {
    setServerError('')
    try {
      await updateSalaryComponent.mutateAsync({ id: component.id, input: toUpdateInput(values) })
      onClose()
    } catch (error) {
      setServerError(errorMessage(error, 'Could not save changes. Please try again.'))
    }
  }

  return (
    <Modal title="Edit component" onClose={onClose}>
      <SalaryComponentForm
        submitLabel="Save changes"
        serverError={serverError}
        excludeComponentId={component.id}
        defaultValues={{
          name: component.name,
          code: component.code,
          componentType: component.componentType,
          calcType: component.calcType,
          fixedAmount: component.fixedAmount ? Number(component.fixedAmount) : undefined,
          percentage: component.percentage ? Number(component.percentage) : undefined,
          baseComponentId: component.baseComponentId ?? undefined,
          sequence: component.sequence,
        }}
        onSubmit={handleSubmit}
      />
    </Modal>
  )
}

function ComponentRow({ component, baseComponentName }: { component: SalaryComponent; baseComponentName?: string }) {
  const deactivateSalaryComponent = useDeactivateSalaryComponent()
  const updateSalaryComponent = useUpdateSalaryComponent()
  const [isEditing, setIsEditing] = useState(false)
  const [rowError, setRowError] = useState('')

  const isToggling = deactivateSalaryComponent.isPending || updateSalaryComponent.isPending

  async function handleToggleActive() {
    setRowError('')
    try {
      if (component.isActive) {
        await deactivateSalaryComponent.mutateAsync(component.id)
      } else {
        await updateSalaryComponent.mutateAsync({ id: component.id, input: { isActive: true } })
      }
    } catch (error) {
      setRowError(errorMessage(error, 'Could not update this component.'))
    }
  }

  return (
    <>
      <tr className="border-b border-border last:border-0 hover:bg-row-hover">
        <td className={`py-2 ${component.isActive ? 'text-ink' : 'text-muted line-through'}`}>{component.name}</td>
        <td className="py-2 text-ink-2">{component.code}</td>
        <td className="py-2 text-ink-2">{COMPONENT_TYPE_LABELS[component.componentType]}</td>
        <td className="py-2 text-ink-2">{component.calcType}</td>
        <td className="py-2 text-ink-2">{describeComponentValue(component, baseComponentName)}</td>
        <td className="py-2 text-ink-2">{component.sequence}</td>
        <td className="py-2">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              component.isActive ? 'bg-success-bg text-success' : 'bg-neutral text-neutral-ink'
            }`}
          >
            {component.isActive ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td className="py-2 text-right">
          <div className="flex justify-end gap-1">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="rounded-md p-1.5 text-ink-2 hover:bg-row-hover"
              aria-label={`Edit ${component.name}`}
            >
              <Pencil className="h-4 w-4" />
            </button>
            <Button variant="secondary" fullWidth={false} isLoading={isToggling} onClick={handleToggleActive}>
              {component.isActive ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        </td>
      </tr>
      {rowError && (
        <tr>
          <td colSpan={8} className="pb-2 text-xs text-error">
            {rowError}
          </td>
        </tr>
      )}
      {isEditing && <EditComponentModal component={component} onClose={() => setIsEditing(false)} />}
    </>
  )
}

function SalaryComponentsTable() {
  const { data, isPending, isError, error } = useSalaryComponents()
  const [isAddOpen, setIsAddOpen] = useState(false)

  if (isPending) {
    return <LoadingState />
  }

  if (isError) {
    return <p className="text-sm text-error">{errorMessage(error, 'Could not load salary components. Please try again.')}</p>
  }

  const componentNameById = new Map(data.salaryComponents.map((component) => [component.id, component.name]))
  const nextSequence = data.salaryComponents.reduce((max, component) => Math.max(max, component.sequence), 0) + 10

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-ink">Salary components</h1>
        <Button fullWidth={false} onClick={() => setIsAddOpen(true)}>
          Add component
        </Button>
      </div>

      {isAddOpen && <AddComponentModal nextSequence={nextSequence} onClose={() => setIsAddOpen(false)} />}

      {data.salaryComponents.length === 0 ? (
        <p className="text-sm text-muted">No salary components yet.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted">
              <th className="py-2 font-medium">Name</th>
              <th className="py-2 font-medium">Code</th>
              <th className="py-2 font-medium">Type</th>
              <th className="py-2 font-medium">Calc type</th>
              <th className="py-2 font-medium">Value</th>
              <th className="py-2 font-medium">Sequence</th>
              <th className="py-2 font-medium">Status</th>
              <th className="py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {data.salaryComponents.map((component) => (
              <ComponentRow
                key={component.id}
                component={component}
                baseComponentName={component.baseComponentId ? componentNameById.get(component.baseComponentId) : undefined}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export function SalaryComponentsPage() {
  const { canManageEmployees: isAdmin, isLoading } = useActiveMemberRole()

  if (isLoading) {
    return <LoadingState />
  }

  if (!isAdmin) {
    return <p className="text-sm text-muted">You don't have access to manage salary components.</p>
  }

  return <SalaryComponentsTable />
}
