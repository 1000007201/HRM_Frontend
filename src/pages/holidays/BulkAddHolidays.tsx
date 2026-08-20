import { useMemo, useRef, useState } from 'react'
import { Button } from '../../components/auth/Button'
import { ApiError } from '../../lib/apiClient'
import { useBulkCreateHolidays } from '../../features/holidays/hooks'
import { parseHolidayRows } from '../../features/holidays/parseHolidayRows'

// Matches the backend's bulkHolidaysSchema ceiling (z.array(...).max(366)) —
// one calendar year's worth. Over that the whole payload is rejected, so it's
// worth catching here rather than letting a long paste fail wholesale.
const MAX_ROWS_PER_SUBMIT = 366

const PLACEHOLDER = `2026-01-26, Republic Day
2026-03-04, Holi
2026-08-15, Independence Day`

export function BulkAddHolidays({ year }: { year: number }) {
  const [text, setText] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bulkCreateHolidays = useBulkCreateHolidays()

  const rows = useMemo(() => parseHolidayRows(text), [text])
  const validRows = rows.filter((row) => row.errorMessage === undefined)
  const invalidRows = rows.filter((row) => row.errorMessage !== undefined)
  const rowsOutsideYear = validRows.filter((row) => !row.date.startsWith(`${year}-`)).length
  const isOverRowLimit = validRows.length > MAX_ROWS_PER_SUBMIT

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setText(await file.text())
    // Reset so re-picking the same file after an edit still fires onChange.
    event.target.value = ''
  }

  function handleSubmit() {
    bulkCreateHolidays.mutate(
      validRows.map((row) => ({ date: row.date, name: row.name })),
      { onSuccess: () => setText('') },
    )
  }

  const result = bulkCreateHolidays.data

  return (
    <div className="rounded-md border border-card-border bg-charcoal-50 p-4">
      <p className="mb-1 text-sm font-medium text-heading">Bulk add</p>
      <p className="mb-3 text-xs text-secondary">
        One holiday per line as <span className="font-medium text-body">YYYY-MM-DD, Holiday Name</span> — paste a month or a
        whole year. Existing dates are updated rather than duplicated.
      </p>

      <textarea
        rows={6}
        value={text}
        placeholder={PLACEHOLDER}
        onChange={(event) => setText(event.target.value)}
        className="w-full rounded-md border border-charcoal-100 bg-white px-3 py-2 font-mono text-sm text-body placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-primary-300"
      />

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv,text/plain"
          onChange={handleFileChange}
          className="hidden"
        />
        <Button variant="secondary" className="w-auto" onClick={() => fileInputRef.current?.click()}>
          Upload CSV
        </Button>
        <Button
          className="w-auto"
          disabled={validRows.length === 0 || isOverRowLimit}
          isLoading={bulkCreateHolidays.isPending}
          onClick={handleSubmit}
        >
          Add {validRows.length > 0 ? `${validRows.length} ` : ''}holidays
        </Button>
        {text !== '' && (
          <Button variant="secondary" className="w-auto" onClick={() => setText('')}>
            Clear
          </Button>
        )}
      </div>

      {isOverRowLimit && (
        <p className="mt-3 text-sm text-error">
          {validRows.length} rows is over the {MAX_ROWS_PER_SUBMIT}-row limit for one submission. Split it into two uploads.
        </p>
      )}

      {bulkCreateHolidays.isError && (
        <p className="mt-3 rounded-md border border-error bg-error-bg px-3 py-2 text-sm text-error">
          {bulkCreateHolidays.error instanceof ApiError
            ? bulkCreateHolidays.error.message
            : 'Could not add the holidays. Please try again.'}
        </p>
      )}

      {result && (
        <p className="mt-3 rounded-md border border-success bg-success-bg px-3 py-2 text-sm text-body">
          Added {result.added} · Updated {result.updated} · Skipped {result.unchanged} (already identical)
          {result.duplicatesInPayload > 0 && ` · Ignored ${result.duplicatesInPayload} duplicate date(s) in the upload`}
        </p>
      )}

      {invalidRows.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-error">
            {invalidRows.length} row(s) can't be read and won't be submitted
          </p>
          <ul className="flex flex-col gap-1 text-xs">
            {invalidRows.map((row) => (
              <li key={row.lineNumber} className="rounded border border-error bg-error-bg px-2 py-1 text-body">
                <span className="text-secondary">Line {row.lineNumber}:</span> {row.errorMessage}
                <span className="ml-1 font-mono text-secondary">— {row.raw.trim()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {validRows.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-heading">Preview — {validRows.length} holiday(s) will be submitted</p>
          {rowsOutsideYear > 0 && (
            <p className="mb-2 text-xs text-warning">
              {rowsOutsideYear} of these fall outside {year} — they'll be saved, but you'll need to switch year to see them.
            </p>
          )}
          <div className="max-h-64 overflow-y-auto rounded-md border border-card-border bg-white">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-card-border text-xs text-secondary">
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Name</th>
                </tr>
              </thead>
              <tbody>
                {validRows.map((row) => (
                  <tr key={row.lineNumber} className="border-b border-card-border last:border-0">
                    <td className="px-3 py-1.5 font-mono text-body">{row.date}</td>
                    <td className="px-3 py-1.5 text-body">{row.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
