import { CheckInOutWidget } from '../components/attendance/CheckInOutWidget'

export function DashboardPage() {
  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold text-heading">Dashboard</h1>
      <div className="max-w-sm">
        <CheckInOutWidget />
      </div>
    </div>
  )
}
