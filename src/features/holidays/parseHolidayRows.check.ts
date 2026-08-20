// Self-check for the bulk-upload parser. No test framework in this repo —
// run it directly with Node's built-in TypeScript stripping:
//
//   node src/features/holidays/parseHolidayRows.check.ts
//
// Prints nothing but the final line when everything passes.
import { parseHolidayRows } from './parseHolidayRows.ts'

function check(description: string, condition: boolean): void {
  if (!condition) throw new Error(`FAILED: ${description}`)
}

const parsed = parseHolidayRows(
  [
    'date,name',
    '2026-01-26, Republic Day',
    '',
    '2026-03-04\tHoli',
    '"2026-10-20","Diwali, Day 2"',
    '2026-02-30, Not A Real Day',
    '2026-13-01, Bad Month',
    'not-a-date, Nonsense',
    '2026-05-01',
    '2026-08-15,   ',
  ].join('\n'),
)

check('header and blank lines are dropped', parsed.length === 8)

const [republicDay, holi, diwali, badDay, badMonth, badFormat, noSeparator, noName] = parsed

check('parses a comma row', republicDay.date === '2026-01-26' && republicDay.name === 'Republic Day')
check('comma row is valid', republicDay.errorMessage === undefined)
check('parses a tab row', holi.date === '2026-03-04' && holi.name === 'Holi')
check('strips quotes and keeps commas inside the name', diwali.date === '2026-10-20' && diwali.name === 'Diwali, Day 2')
check('rejects a non-existent day', badDay.errorMessage !== undefined)
check('rejects a non-existent month', badMonth.errorMessage !== undefined)
check('rejects a malformed date', badFormat.errorMessage !== undefined)
check('rejects a row with no separator', noSeparator.errorMessage !== undefined)
check('rejects a row with a blank name', noName.errorMessage !== undefined)

check('line numbers point at the original text', republicDay.lineNumber === 2 && holi.lineNumber === 4)
check('empty input parses to nothing', parseHolidayRows('').length === 0)

console.log('parseHolidayRows: all checks passed')
