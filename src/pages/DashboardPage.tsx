import { CheckInOutWidget } from '../features/attendance/CheckInOutWidget'

export function DashboardPage() {
  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold text-ink">Dashboard</h1>
      <div className="max-w-sm">
        <CheckInOutWidget />
      </div>
    </div>
  )
}
