import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
  isLoading?: boolean
  // Unlike a <div>, a <button> never stretches to fill its container just
  // from display:flex/block — it needs an explicit width. Defaulting this to
  // true keeps every existing full-width caller (form submit buttons) working
  // with no changes; callers that want a compact inline button pass `false`.
  fullWidth?: boolean
}

export function Button({
  variant = 'primary',
  isLoading = false,
  fullWidth = true,
  disabled,
  children,
  className,
  ...buttonProps
}: ButtonProps) {
  const variantClasses =
    variant === 'primary'
      ? 'bg-primary text-white hover:bg-primary-hover'
      : 'bg-white text-ink-2 border border-border hover:bg-row-hover'

  return (
    <button
      disabled={disabled || isLoading}
      className={`flex items-center justify-center gap-2 rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        fullWidth ? 'w-full' : ''
      } ${variantClasses} ${className ?? ''}`}
      {...buttonProps}
    >
      {isLoading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      )}
      {isLoading ? 'Processing...' : children}
    </button>
  )
}
