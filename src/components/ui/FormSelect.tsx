import type { SelectHTMLAttributes } from 'react'

interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  errorMessage?: string
}

export function FormSelect({ label, errorMessage, id, className, children, ...selectProps }: FormSelectProps) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-body">
        {label}
      </label>
      <select
        id={id}
        className={`w-full rounded-md border bg-white px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-primary-300 ${
          errorMessage ? 'border-error' : 'border-charcoal-100'
        } ${className ?? ''}`}
        {...selectProps}
      >
        {children}
      </select>
      {errorMessage && <p className="mt-1 text-sm text-error">{errorMessage}</p>}
    </div>
  )
}
