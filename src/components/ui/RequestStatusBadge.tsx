// PENDING / APPROVED / REJECTED / CANCELLED is the shared vocabulary for
// anything that goes through an approval flow. Leave requests and attendance
// regularizations both use it with identical colours, so the mapping lives
// here rather than being redeclared per feature.
//
// Note this is NOT the attendance *day* status (PRESENT/ABSENT/...) — that has
// its own scale in features/attendance/display.ts.
export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

const STATUS_CLASSES: Record<RequestStatus, string> = {
  PENDING: 'bg-warning-bg text-warning',
  APPROVED: 'bg-success-bg text-success',
  REJECTED: 'bg-error-bg text-error',
  CANCELLED: 'bg-neutral text-neutral-ink',
}

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[status]}`}>{status}</span>
}
