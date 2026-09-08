import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '../../components/ui/Button'
import { FormInput } from '../../components/ui/FormInput'
import { FormSelect } from '../../components/ui/FormSelect'
import { useDepartments, useEmployees } from './hooks'
import { CREATABLE_EMPLOYEE_ROLES } from './types'
import { employeeFormSchema, type EmployeeFormValues } from './validation'

const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say'] as const

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
  const { data: departmentOptions } = useDepartments()

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
      <FormSelect
        id="departmentId"
        label="Department (optional)"
        disabled={isSubmitting}
        errorMessage={errors.departmentId?.message}
        {...register('departmentId')}
      >
        <option value="">No department</option>
        {(departmentOptions?.departments ?? []).map((department) => (
          <option key={department.id} value={department.id}>
            {department.name}
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
      <div className="grid grid-cols-2 gap-x-4">
        <FormInput
          id="joiningDate"
          label="Date of joining"
          type="date"
          disabled={isSubmitting}
          errorMessage={errors.joiningDate?.message}
          {...register('joiningDate')}
        />
        <FormInput
          id="leavingDate"
          label="Date of leaving"
          type="date"
          disabled={isSubmitting}
          errorMessage={errors.leavingDate?.message}
          {...register('leavingDate')}
        />
      </div>

      <div className="mt-6 border-t border-border pt-4">
        <p className="mb-3 text-sm font-medium text-ink">Additional details (optional)</p>
        <div className="grid grid-cols-2 gap-x-4">
          <FormInput
            id="employeeCode"
            label="Employee code"
            disabled={isSubmitting}
            errorMessage={errors.employeeCode?.message}
            {...register('employeeCode')}
          />
          <FormInput
            id="phone"
            label="Phone"
            type="tel"
            disabled={isSubmitting}
            errorMessage={errors.phone?.message}
            {...register('phone')}
          />
          <FormInput
            id="dateOfBirth"
            label="Date of birth"
            type="date"
            disabled={isSubmitting}
            errorMessage={errors.dateOfBirth?.message}
            {...register('dateOfBirth')}
          />
          <FormSelect
            id="gender"
            label="Gender"
            disabled={isSubmitting}
            errorMessage={errors.gender?.message}
            {...register('gender')}
          >
            <option value="">Not specified</option>
            {GENDER_OPTIONS.map((gender) => (
              <option key={gender} value={gender}>
                {gender}
              </option>
            ))}
          </FormSelect>
          <FormInput
            id="emergencyContactName"
            label="Emergency contact name"
            disabled={isSubmitting}
            errorMessage={errors.emergencyContactName?.message}
            {...register('emergencyContactName')}
          />
          <FormInput
            id="emergencyContactPhone"
            label="Emergency contact phone"
            type="tel"
            disabled={isSubmitting}
            errorMessage={errors.emergencyContactPhone?.message}
            {...register('emergencyContactPhone')}
          />
        </div>
        <div className="mb-4">
          <label htmlFor="address" className="mb-1 block text-sm font-medium text-ink-2">
            Address
          </label>
          <textarea
            id="address"
            rows={2}
            disabled={isSubmitting}
            className="w-full rounded-md border border-border px-3 py-1.5 text-ink-2 placeholder:text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            {...register('address')}
          />
          {errors.address && <p className="mt-1 text-sm text-error">{errors.address.message}</p>}
        </div>
      </div>

      <div className="mt-2 flex justify-end border-t border-border pt-4">
        <Button type="submit" fullWidth={false} isLoading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
