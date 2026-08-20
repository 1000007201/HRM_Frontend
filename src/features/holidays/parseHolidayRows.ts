// Parses the forgiving paste/CSV format for bulk holiday upload: one holiday
// per line, `YYYY-MM-DD, Holiday Name`. Tab-separated works too, a header row
// is ignored, blank lines are dropped, and surrounding quotes are stripped.
// This is a client-side convenience only — the backend re-validates everything
// and is the source of truth for what actually gets written.

export interface ParsedHolidayRow {
  lineNumber: number
  raw: string
  date: string
  name: string
  errorMessage?: string
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const MAX_NAME_LENGTH = 200

// "2026-02-30" and "2026-13-01" both match ISO_DATE_PATTERN but aren't real
// dates — Date.UTC happily rolls them over into March/January, so the only
// reliable check is round-tripping and comparing the parts back.
function isRealCalendarDate(date: string): boolean {
  const [year, month, day] = date.split('-').map(Number)
  const parsed = new Date(Date.UTC(year, month - 1, day))
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day
}

const stripQuotes = (field: string) => field.trim().replace(/^"(.*)"$/s, '$1').trim()

// Only the first comma/tab splits the row, so a name containing commas
// ("Diwali, Day 2") survives intact instead of being truncated.
function toRow(raw: string, lineNumber: number): ParsedHolidayRow {
  const separatorIndex = raw.search(/[,\t]/)
  if (separatorIndex === -1) {
    return { lineNumber, raw, date: '', name: '', errorMessage: 'Expected "YYYY-MM-DD, Holiday name"' }
  }

  const date = stripQuotes(raw.slice(0, separatorIndex))
  const name = stripQuotes(raw.slice(separatorIndex + 1))

  if (!ISO_DATE_PATTERN.test(date)) {
    return { lineNumber, raw, date, name, errorMessage: `"${date}" is not a YYYY-MM-DD date` }
  }
  if (!isRealCalendarDate(date)) {
    return { lineNumber, raw, date, name, errorMessage: `"${date}" is not a real calendar date` }
  }
  if (name === '') {
    return { lineNumber, raw, date, name, errorMessage: 'Holiday name is missing' }
  }
  if (name.length > MAX_NAME_LENGTH) {
    return { lineNumber, raw, date, name, errorMessage: `Holiday name is longer than ${MAX_NAME_LENGTH} characters` }
  }

  return { lineNumber, raw, date, name }
}

// A row whose first field is literally "date" is a CSV header, never a holiday.
const isHeaderRow = (raw: string) => stripQuotes(raw.split(/[,\t]/)[0]).toLowerCase() === 'date'

export function parseHolidayRows(text: string): ParsedHolidayRow[] {
  return text
    .split(/\r?\n/)
    .map((raw, index) => ({ raw, lineNumber: index + 1 }))
    .filter(({ raw }) => raw.trim() !== '' && !isHeaderRow(raw))
    .map(({ raw, lineNumber }) => toRow(raw, lineNumber))
}
