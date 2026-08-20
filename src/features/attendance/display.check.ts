// Self-check for the month/date helpers — the off-by-one-prone bits. Run with
// Node's built-in TypeScript stripping (no test framework in this repo):
//
//   node src/features/attendance/display.check.ts
import { formatWorkedMinutes, leadingBlankCount, shiftMonth, toDateKey, toMonthKey, toUtcDate } from './display.ts'

function check(description: string, condition: boolean): void {
  if (!condition) throw new Error(`FAILED: ${description}`)
}

check('rolls back across a year boundary', shiftMonth('2026-01', -1) === '2025-12')
check('rolls forward across a year boundary', shiftMonth('2026-12', 1) === '2027-01')
check('steps within a year', shiftMonth('2026-08', 1) === '2026-09')
check('pads single-digit months', shiftMonth('2026-10', -1) === '2026-09')
check('handles a multi-month jump', shiftMonth('2026-02', -3) === '2025-11')

// 2026-08-01 is a Saturday (index 6) — the widest possible leading gap.
check('leading blanks for a Saturday 1st', leadingBlankCount('2026-08') === 6)
// 2026-02-01 is a Sunday (index 0) — no gap.
check('leading blanks for a Sunday 1st', leadingBlankCount('2026-02') === 0)

check('parses a date key as UTC midnight', toUtcDate('2026-08-20').toISOString() === '2026-08-20T00:00:00.000Z')
check('round-trips a date key', toDateKey(toUtcDate('2026-08-20')) === '2026-08-20')
check('derives a month key', toMonthKey(toUtcDate('2026-08-20')) === '2026-08')

check('formats worked minutes', formatWorkedMinutes(450) === '7h 30m')
check('pads minutes under ten', formatWorkedMinutes(305) === '5h 05m')
check('formats a null duration', formatWorkedMinutes(null) === '—')

console.log('attendance display: all checks passed')
