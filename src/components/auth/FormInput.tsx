import type { InputHTMLAttributes } from 'react'

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  errorMessage?: string
}

export function FormInput({ label, errorMessage, id, className, ...inputProps }: FormInputProps) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-body">
        {label}
      </label>
      <input
        id={id}
        className={`w-full rounded-md border px-3 py-2 text-body placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-primary-300 ${
          errorMessage ? 'border-error' : 'border-charcoal-100'
        } ${className ?? ''}`}
        {...inputProps}
      />
      {errorMessage && <p className="mt-1 text-sm text-error">{errorMessage}</p>}
    </div>
  )
}
