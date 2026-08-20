import { apiFetch } from '../../lib/apiClient'
import type { BulkHolidayResult, Holiday, HolidayInput } from './types'

export function listHolidays(year: number) {
  return apiFetch<{ year: number; holidays: Holiday[] }>(`/holidays?year=${year}`)
}

export function createHoliday(input: HolidayInput) {
  return apiFetch<{ holiday: Holiday }>('/holidays', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function bulkCreateHolidays(holidays: HolidayInput[]) {
  return apiFetch<BulkHolidayResult>('/holidays/bulk', {
    method: 'POST',
    body: JSON.stringify({ holidays }),
  })
}

export function deleteHoliday(id: string) {
  return apiFetch<{ id: string }>(`/holidays/${id}`, { method: 'DELETE' })
}
