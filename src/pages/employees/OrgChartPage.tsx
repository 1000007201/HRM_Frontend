import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../lib/apiClient'
import { useOrgChart } from '../../features/employees/hooks'
import type { OrgChartNode } from '../../features/employees/types'
import { LoadingState } from '../../components/ui/Spinner'

// Connector lines (trunk + sibling bars) come from the .org-tree CSS in
// index.css, not Tailwind classes — see the comment there.
function OrgChartNodeCard({ node }: { node: OrgChartNode }) {
  const [isExpanded, setIsExpanded] = useState(true)
  const hasReports = node.reports.length > 0

  return (
    <li>
      <div className="flex w-36 flex-col items-center gap-0.5 rounded-md border border-border bg-white px-2 py-1.5 text-center shadow-sm">
        <div className="flex w-full min-w-0 items-center justify-center gap-1">
          <Link
            to={`/employees/${node.id}`}
            title={node.fullName}
            className="min-w-0 truncate text-sm font-medium text-ink hover:text-primary hover:underline"
          >
            {node.fullName}
          </Link>
          {hasReports && (
            <button
              type="button"
              onClick={() => setIsExpanded((current) => !current)}
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded text-muted hover:bg-row-hover"
            >
              {isExpanded ? '−' : '+'}
            </button>
          )}
        </div>
        <span className="rounded-full bg-role-pill-bg px-2 py-0.5 text-xs font-medium text-neutral-ink">{node.role}</span>
        {node.designation && <span className="w-full truncate text-xs text-muted">{node.designation}</span>}
        {!node.hasPortalAccess && <span className="text-xs italic text-muted">no login yet</span>}
      </div>
      {hasReports && isExpanded && (
        <ul className="org-tree">
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
    return <LoadingState />
  }

  if (isError) {
    if (error instanceof ApiError && error.status === 403) {
      return <p className="text-sm text-muted">You don't have access to the org chart.</p>
    }
    return <p className="text-sm text-error">Could not load the org chart. Please try again.</p>
  }

  const { tree } = data

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold text-ink">Org chart</h1>
      {tree.length === 0 ? (
        <p className="text-sm text-muted">No employees yet.</p>
      ) : (
        <div className="overflow-x-auto">
          {/* org-tree-root: same flex-column-center layout as any .org-tree
              level (so a card centers over its own subtree), but suppresses
              the sibling/parent connector lines — separate root trees don't
              share a parent to connect to. */}
          <ul className="org-tree org-tree-root min-w-max">
            {tree.map((node) => (
              <OrgChartNodeCard key={node.id} node={node} />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
