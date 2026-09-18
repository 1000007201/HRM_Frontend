import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '../../components/ui/Button'
import { FormInput } from '../../components/ui/FormInput'
import { FormSelect } from '../../components/ui/FormSelect'
import { useSalaryComponents } from './hooks'
import { CALC_TYPES, CALC_TYPE_LABELS, COMPONENT_TYPES, COMPONENT_TYPE_LABELS } from './types'
import { salaryComponentFormSchema, type SalaryComponentFormValues } from './validation'

interface SalaryComponentFormProps {
  defaultValues?: Partial<SalaryComponentFormValues>
  excludeComponentId?: string
  serverError?: string
  submitLabel: string
  onSubmit: (values: SalaryComponentFormValues) => void | Promise<void>
}

export function SalaryComponentForm({
  defaultValues,
  excludeComponentId,
  serverError,
  submitLabel,
  onSubmit,
}: SalaryComponentFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SalaryComponentFormValues>({
    resolver: zodResolver(salaryComponentFormSchema),
    defaultValues: { componentType: 'EARNING', calcType: 'FIXED', sequence: 10, ...defaultValues },
  })

  const calcType = watch('calcType')

  // Only an active component in the same org can be a base — and never a
  // BALANCE one: it's always sequenced after every PERCENTAGE (see
  // validateComponentOrdering in the backend), so basing off it would
  // require a sequence both before and after its own.
  const { data } = useSalaryComponents()
  const baseComponentOptions = (data?.salaryComponents ?? []).filter(
    (component) => component.isActive && component.calcType !== 'BALANCE' && component.id !== excludeComponentId,
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {serverError && (
        <p className="mb-4 rounded-md border border-error bg-error-bg px-3 py-2 text-sm text-error">{serverError}</p>
      )}
      <FormInput
        id="componentName"
        label="Name"
        placeholder="Basic Pay"
        disabled={isSubmitting}
        errorMessage={errors.name?.message}
        {...register('name')}
      />
      <FormInput
        id="componentCode"
        label="Code"
        placeholder="BASIC"
        className="uppercase"
        disabled={isSubmitting}
        errorMessage={errors.code?.message}
        {...register('code')}
      />
      <FormSelect
        id="componentType"
        label="Component type"
        disabled={isSubmitting}
        errorMessage={errors.componentType?.message}
        {...register('componentType')}
      >
        {COMPONENT_TYPES.map((componentType) => (
          <option key={componentType} value={componentType}>
            {COMPONENT_TYPE_LABELS[componentType]}
          </option>
        ))}
      </FormSelect>
      <FormSelect
        id="calcType"
        label="Calculation type"
        disabled={isSubmitting}
        errorMessage={errors.calcType?.message}
        {...register('calcType')}
      >
        {CALC_TYPES.map((type) => (
          <option key={type} value={type}>
            {CALC_TYPE_LABELS[type]}
          </option>
        ))}
      </FormSelect>

      {calcType === 'FIXED' && (
        <FormInput
          id="fixedAmount"
          label="Fixed amount (₹ / year)"
          type="number"
          step="0.01"
          min="0"
          disabled={isSubmitting}
          errorMessage={errors.fixedAmount?.message}
          {...register('fixedAmount', { valueAsNumber: true })}
        />
      )}

      {calcType === 'PERCENTAGE' && (
        <>
          <FormInput
            id="percentage"
            label="Percentage (%)"
            type="number"
            step="0.01"
            min="0"
            max="100"
            disabled={isSubmitting}
            errorMessage={errors.percentage?.message}
            {...register('percentage', { valueAsNumber: true })}
          />
          <FormSelect
            id="baseComponentId"
            label="Base component"
            disabled={isSubmitting}
            errorMessage={errors.baseComponentId?.message}
            {...register('baseComponentId')}
          >
            <option value="">Select a component</option>
            {baseComponentOptions.map((component) => (
              <option key={component.id} value={component.id}>
                {component.name}
              </option>
            ))}
          </FormSelect>
        </>
      )}

      {calcType === 'BALANCE' && (
        <p className="mb-4 rounded-md border border-border bg-canvas px-3 py-2 text-sm text-muted">
          This will be the remaining amount after every other component is resolved. An org can have at most one
          active BALANCE component.
        </p>
      )}

      <FormInput
        id="sequence"
        label="Sequence"
        type="number"
        step="1"
        min="1"
        disabled={isSubmitting}
        errorMessage={errors.sequence?.message}
        {...register('sequence', { valueAsNumber: true })}
      />

      <div className="mt-2 flex justify-end border-t border-border pt-4">
        <Button type="submit" fullWidth={false} isLoading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
