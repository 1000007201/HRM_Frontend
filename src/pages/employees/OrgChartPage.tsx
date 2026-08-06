import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../lib/apiClient'
import { useOrgChart } from '../../features/employees/hooks'
import type { OrgChartNode } from '../../features/employees/types'

function OrgChartNodeCard({ node }: { node: OrgChartNode }) {
  const [isExpanded, setIsExpanded] = useState(true)
  const hasReports = node.reports.length > 0

  return (
    <li>
      <div className="flex items-center gap-2 rounded-md border border-card-border bg-white px-3 py-2 shadow-sm">
        {hasReports ? (
          <button
            type="button"
            onClick={() => setIsExpanded((current) => !current)}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-secondary hover:bg-charcoal-50"
          >
            {isExpanded ? '−' : '+'}
          </button>
        ) : (
          <span className="w-5 shrink-0" />
        )}
        <Link to={`/employees/${node.id}`} className="font-medium text-heading hover:text-primary-300 hover:underline">
          {node.fullName}
        </Link>
        <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-400">{node.role}</span>
        {node.designation && <span className="text-sm text-secondary">{node.designation}</span>}
        {!node.hasPortalAccess && <span className="text-xs italic text-placeholder">no login yet</span>}
      </div>
      {hasReports && isExpanded && (
        <ul className="ml-4 mt-2 flex flex-col gap-2 border-l border-card-border pl-4">
          {node.reports.map((report) => (
            <OrgChartNodeCard key={report.id} node={report} />
          ))}
        </ul>
      )}
    </li>
  )
}

export function OrgChartPage() {
  const { data, isPending, isError, error } = useOrgChart()

  if (isPending) {
    return (
      <div className="flex justify-center py-8">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary-100 border-t-primary-300" />
      </div>
    )
  }

  if (isError) {
    if (error instanceof ApiError && error.status === 403) {
      return <p className="text-sm text-secondary">You don't have access to the org chart.</p>
    }
    return <p className="text-sm text-error">Could not load the org chart. Please try again.</p>
  }

  const { tree } = data

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold text-heading">Org chart</h1>
      {tree.length === 0 ? (
        <p className="text-sm text-secondary">No employees yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <ul className="flex min-w-max flex-col gap-2">
            {tree.map((node) => (
              <OrgChartNodeCard key={node.id} node={node} />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
