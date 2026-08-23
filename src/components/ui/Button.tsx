import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
  isLoading?: boolean
}

export function Button({
  variant = 'primary',
  isLoading = false,
  disabled,
  children,
  className,
  ...buttonProps
}: ButtonProps) {
  const variantClasses =
    variant === 'primary'
      ? 'bg-primary-300 text-white hover:bg-primary-400'
      : 'bg-white text-body border border-charcoal-100 hover:bg-charcoal-50'

  return (
    <button
      disabled={disabled || isLoading}
      className={`flex w-full items-center justify-center gap-2 rounded-md px-4 py-2 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses} ${className ?? ''}`}
      {...buttonProps}
    >
      {isLoading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      )}
      {isLoading ? 'Processing...' : children}
    </button>
  )
}
