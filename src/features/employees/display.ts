// Calendar-date fields (joiningDate, leavingDate, dateOfBirth) arrive as an ISO
// instant at UTC midnight ("2026-01-26T00:00:00.000Z") — same @db.Date shape as
// Holiday.date — so they must format with timeZone: 'UTC' or render a day early
// west of Greenwich.
export function formatCalendarDate(value: string | null): string {
  return value === null ? '—' : new Date(value).toLocaleDateString(undefined, { timeZone: 'UTC' })
}
