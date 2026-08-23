const SIZE_CLASSES = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
} as const

interface SpinnerProps {
  size?: keyof typeof SIZE_CLASSES
}

export function Spinner({ size = 'md' }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`${SIZE_CLASSES[size]} animate-spin rounded-full border-2 border-primary-100 border-t-primary-300`}
    />
  )
}

// The centred form every data view uses while its query is pending. `padding`
// is a Tailwind spacing class rather than a boolean/enum because callers vary
// it by context (a page body, a panel, a table section) more than they share it.
export function LoadingState({ size = 'md', padding = 'py-8' }: SpinnerProps & { padding?: string }) {
  return (
    <div className={`flex justify-center ${padding}`}>
      <Spinner size={size} />
    </div>
  )
}
