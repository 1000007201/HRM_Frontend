import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { FormInput } from '../../components/ui/FormInput'
import { errorMessage } from '../../lib/apiClient'
import { formatInr } from '../expenses/display'
import { computeLiveSalaryStructure, earningAnnualTotal, EARNING_SUM_TOLERANCE_RUPEES } from './computation'
import { useCreateSalaryStructure } from './hooks'
import { CALC_TYPE_LABELS, type SalaryComponent, type SalaryStructure } from './types'
import { salaryStructureFormSchema, type SalaryStructureFormValues } from './validation'

// Seeds a FIXED component's starting annual amount from the structure being
// revised (so editing keeps the employee's current numbers as the baseline)
// and falls back to the org rulebook's own fixedAmount for a first-time
// assignment or a component the previous structure didn't include.
function buildInitialFixedAmounts(
  activeComponents: SalaryComponent[],
  seedStructure: SalaryStructure | undefined,
): Record<string, number> {
  const seededAnnualByComponentId = new Map(
    (seedStructure?.components ?? []).map((component) => [component.componentId, Number(component.annualAmount)]),
  )
  const amounts: Record<string, number> = {}
  for (const component of activeComponents) {
    if (component.calcType !== 'FIXED') continue
    amounts[component.id] = seededAnnualByComponentId.get(component.id) ?? Number(component.fixedAmount ?? 0)
  }
  return amounts
}

interface AssignSalaryStructureFormProps {
  employeeId: string
  activeComponents: SalaryComponent[]
  seedStructure?: SalaryStructure
  onDone: () => void
}

export function AssignSalaryStructureForm({
  employeeId,
  activeComponents,
  seedStructure,
  onDone,
}: AssignSalaryStructureFormProps) {
  const createSalaryStructure = useCreateSalaryStructure(employeeId)
  const [serverError, setServerError] = useState('')
  const [fixedAmounts, setFixedAmounts] = useState<Record<string, number>>(() =>
    buildInitialFixedAmounts(activeComponents, seedStructure),
  )

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SalaryStructureFormValues>({
    resolver: zodResolver(salaryStructureFormSchema),
    defaultValues: {
      annualCtc: seedStructure ? Number(seedStructure.annualCtc) : undefined,
      effectiveFrom: new Date().toISOString().slice(0, 10),
    },
  })

  const annualCtc = useWatch({ control, name: 'annualCtc' })
  const ctcValue = typeof annualCtc === 'number' && Number.isFinite(annualCtc) ? annualCtc : 0

  const resolved = useMemo(
    () =>
      computeLiveSalaryStructure(
        ctcValue,
        activeComponents.map((component) => ({
          id: component.id,
          sequence: component.sequence,
          calcType: component.calcType,
          componentType: component.componentType,
          percentage: component.percentage !== null ? Number(component.percentage) : null,
          baseComponentId: component.baseComponentId,
        })),
        fixedAmounts,
      ),
    [ctcValue, activeComponents, fixedAmounts],
  )
  const resolvedByComponentId = new Map(resolved.map((component) => [component.componentId, component]))
  const totalEarnings = earningAnnualTotal(resolved)
  const isMismatched = Math.abs(totalEarnings - ctcValue) > EARNING_SUM_TOLERANCE_RUPEES

  async function handleFormSubmit(values: SalaryStructureFormValues) {
    setServerError('')
    try {
      await createSalaryStructure.mutateAsync({
        annualCtc: values.annualCtc,
        effectiveFrom: values.effectiveFrom,
        components: resolved.map((component) => ({
          componentId: component.componentId,
          annualAmount: component.annualAmount,
          monthlyAmount: component.monthlyAmount,
        })),
      })
      onDone()
    } catch (error) {
      setServerError(errorMessage(error, 'Could not save the salary structure. Please try again.'))
    }
  }

  if (activeComponents.length === 0) {
    return (
      <p className="text-sm text-muted">
        No active salary components yet.{' '}
        <Link to="/salary-components" className="text-primary hover:underline">
          Set them up first
        </Link>
        .
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      {serverError && (
        <p className="mb-4 rounded-md border border-error bg-error-bg px-3 py-2 text-sm text-error">{serverError}</p>
      )}
      <div className="grid grid-cols-2 gap-x-4">
        <FormInput
          id="annualCtc"
          label="Annual CTC (₹)"
          type="number"
          step="0.01"
          min="0"
          disabled={isSubmitting}
          errorMessage={errors.annualCtc?.message}
          {...register('annualCtc', { valueAsNumber: true })}
        />
        <FormInput
          id="effectiveFrom"
          label="Effective from"
          type="date"
          disabled={isSubmitting}
          errorMessage={errors.effectiveFrom?.message}
          {...register('effectiveFrom')}
        />
      </div>

      <div className="mb-4 overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs text-muted">
            <th className="py-2 font-medium">Component</th>
            <th className="py-2 font-medium">Calc type</th>
            <th className="py-2 font-medium">Annual amount</th>
            <th className="py-2 font-medium">Monthly amount</th>
          </tr>
        </thead>
        <tbody>
          {activeComponents.map((component) => {
            const componentResolved = resolvedByComponentId.get(component.id)
            return (
              <tr key={component.id} className="border-b border-border last:border-0">
                <td className="py-2 text-ink-2">{component.name}</td>
                <td className="py-2">
                  <span className="rounded-full bg-neutral px-2 py-0.5 text-xs font-medium text-neutral-ink">
                    {CALC_TYPE_LABELS[component.calcType]}
                  </span>
                </td>
                <td className="py-2">
                  {component.calcType === 'FIXED' ? (
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      disabled={isSubmitting}
                      value={fixedAmounts[component.id] ?? 0}
                      onChange={(event) =>
                        setFixedAmounts((current) => ({ ...current, [component.id]: Number(event.target.value) || 0 }))
                      }
                      className="w-32 rounded-md border border-border px-2 py-1 text-ink-2 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                  ) : (
                    <span className="text-ink-2">{formatInr(componentResolved?.annualAmount ?? 0)}</span>
                  )}
                </td>
                <td className="py-2 text-ink-2">{formatInr(componentResolved?.monthlyAmount ?? 0)}</td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className={isMismatched ? 'text-error' : 'text-ink'}>
            <td className="pt-2 font-medium" colSpan={2}>
              Total earnings
            </td>
            <td className="pt-2 font-medium" colSpan={2}>
              {formatInr(totalEarnings)} {isMismatched && `— must equal CTC (${formatInr(ctcValue)})`}
            </td>
          </tr>
        </tfoot>
      </table>
      </div>

      <div className="flex justify-end border-t border-border pt-4">
        <Button type="submit" fullWidth={false} isLoading={isSubmitting} disabled={isMismatched}>
          Save salary structure
        </Button>
      </div>
    </form>
  )
}
