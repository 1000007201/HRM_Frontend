import type { InputHTMLAttributes } from 'react'

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  errorMessage?: string
}

export function FormInput({ label, errorMessage, id, className, ...inputProps }: FormInputProps) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-ink-2">
        {label}
      </label>
      <input
        id={id}
        className={`w-full rounded-md border px-3 py-1.5 text-ink-2 placeholder:text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 ${
          errorMessage ? 'border-error' : 'border-border'
        } ${className ?? ''}`}
        {...inputProps}
      />
      {errorMessage && <p className="mt-1 text-sm text-error">{errorMessage}</p>}
    </div>
  )
}
