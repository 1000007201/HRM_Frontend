export function EmployeeStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        isActive ? 'bg-success-bg text-success' : 'bg-neutral text-neutral-ink'
      }`}
    >
      {isActive ? 'Active' : 'Inactive'}
    </span>
  )
}
