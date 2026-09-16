// isOptional=false (the default) is a closure day: the whole org is off,
// excluded from working-day counting. isOptional=true stays a normal working
// day for anyone who doesn't take it; "taking" one is an ordinary leave
// request against the org's floater Leave Type (see the Leave types page),
// which the backend restricts to exactly these dates.
//
// `date` arrives as an ISO instant at UTC midnight ("2026-01-26T00:00:00.000Z")
// — the backend column is @db.Date, so it's a calendar date with no meaningful
// time. Always format it with timeZone: 'UTC' or it renders as the previous day
// west of Greenwich.
export interface Holiday {
  id: string
  date: string
  name: string
  year: number
  isOptional: boolean
}

export interface HolidayInput {
  date: string
  name: string
  isOptional: boolean
}

// Counts returned by POST /holidays/bulk. `unchanged` is the backend's name for
// what the UI calls "skipped" (same date, same name — upserted to no effect);
// `duplicatesInPayload` counts rows dropped because a later row reused the same
// date within one submission.
export interface BulkHolidayResult {
  added: number
  updated: number
  unchanged: number
  duplicatesInPayload: number
  received: number
}
