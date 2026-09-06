import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '../../components/ui/Button'
import { FormInput } from '../../components/ui/FormInput'
import { FormSelect } from '../../components/ui/FormSelect'
import { useEmployees } from './hooks'
import { CREATABLE_EMPLOYEE_ROLES } from './types'
import { employeeFormSchema, type EmployeeFormValues } from './validation'

interface EmployeeFormProps {
  defaultValues?: Partial<EmployeeFormValues>
  excludeEmployeeId?: string
  serverError?: string
  submitLabel: string
  onSubmit: (values: EmployeeFormValues) => void | Promise<void>
}

export function EmployeeForm({ defaultValues, excludeEmployeeId, serverError, submitLabel, onSubmit }: EmployeeFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: { role: 'EMPLOYEE', ...defaultValues },
  })

  // ponytail: manager select is capped at the backend's max page size (100),
  // so orgs past that won't see every candidate here. Add a searchable async
  // select if that ceiling is ever hit.
  const { data: managerOptions } = useEmployees(1, 100)
  const managers = (managerOptions?.employees ?? []).filter((employee) => employee.id !== excludeEmployeeId)

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {serverError && (
        <p className="mb-4 rounded-md border border-error bg-error-bg px-3 py-2 text-sm text-error">{serverError}</p>
      )}
      <FormInput
        id="fullName"
        label="Full name"
        disabled={isSubmitting}
        errorMessage={errors.fullName?.message}
        {...register('fullName')}
      />
      <FormInput
        id="email"
        label="Email"
        type="email"
        disabled={isSubmitting}
        errorMessage={errors.email?.message}
        {...register('email')}
      />
      <FormSelect id="role" label="Role" disabled={isSubmitting} errorMessage={errors.role?.message} {...register('role')}>
        {CREATABLE_EMPLOYEE_ROLES.map((role) => (
          <option key={role} value={role}>
            {role}
          </option>
        ))}
      </FormSelect>
      <FormInput
        id="designation"
        label="Designation"
        disabled={isSubmitting}
        errorMessage={errors.designation?.message}
        {...register('designation')}
      />
      <FormSelect
        id="managerId"
        label="Reporting Person (optional)"
        openDirection="up"
        disabled={isSubmitting}
        errorMessage={errors.managerId?.message}
        {...register('managerId')}
      >
        <option value="">No reporting person</option>
        {managers.map((manager) => (
          <option key={manager.id} value={manager.id}>
            {manager.fullName}
          </option>
        ))}
      </FormSelect>
      <div className="mt-6 flex justify-end border-t border-border pt-4">
        <Button type="submit" fullWidth={false} isLoading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
