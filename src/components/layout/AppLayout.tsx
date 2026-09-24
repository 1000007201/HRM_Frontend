import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  Banknote,
  Bell,
  Building2,
  Calendar,
  CheckCircle,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Coins,
  FilePlus,
  GitBranch,
  LayoutGrid,
  List,
  Mail,
  Receipt,
  Search,
  Settings,
  Sun,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '../ui/Button'
import { authClient } from '../../lib/auth-client'
import { useActiveMemberRole } from '../../lib/useActiveMemberRole'
import { usePendingManagerExpenses } from '../../features/expenses/hooks'

// Which role check gates an item. Absent = visible to everyone; the booleans
// themselves still come from useActiveMemberRole / the expense queue below.
type NavPermission = 'manageEmployees' | 'approveRequests' | 'approveExpenses'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
  permission?: NavPermission
}

interface NavGroup {
  label: string
  // Shown in the collapsed icon rail, where child labels have nowhere to go.
  icon: LucideIcon
  items: NavItem[]
}

type SidebarEntry = NavItem | NavGroup

function isNavGroup(entry: SidebarEntry): entry is NavGroup {
  return 'items' in entry
}

const SIDEBAR_ENTRIES: SidebarEntry[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  {
    label: 'People',
    icon: Users,
    items: [
      { to: '/employees', label: 'Employees', icon: Users, permission: 'manageEmployees' },
      { to: '/departments', label: 'Departments', icon: Building2, permission: 'manageEmployees' },
      { to: '/org-chart', label: 'Org chart', icon: GitBranch, permission: 'manageEmployees' },
      { to: '/invitations', label: 'Invitations', icon: Mail, permission: 'manageEmployees' },
    ],
  },
  {
    label: 'Leave',
    icon: Sun,
    items: [
      { to: '/leave/apply', label: 'Apply for leave', icon: FilePlus },
      { to: '/leave', label: 'My leave', icon: Sun, end: true },
      { to: '/leave/approvals', label: 'Leave approvals', icon: CheckCircle, permission: 'approveRequests' },
      { to: '/leave/types', label: 'Leave types', icon: ClipboardList, permission: 'manageEmployees' },
    ],
  },
  {
    label: 'Attendance',
    icon: Clock,
    items: [
      { to: '/attendance', label: 'My attendance', icon: Clock, end: true },
      { to: '/attendance/day', label: 'Attendance day view', icon: List, permission: 'manageEmployees' },
      { to: '/attendance/approvals', label: 'Attendance approvals', icon: CheckSquare, permission: 'approveRequests' },
    ],
  },
  {
    label: 'Expenses',
    icon: Receipt,
    items: [
      { to: '/expenses/new', label: 'Raise expense', icon: Receipt },
      { to: '/expenses', label: 'My expenses', icon: Wallet, end: true },
      { to: '/expenses/manager-approvals', label: 'Expense approvals', icon: CheckCircle, permission: 'approveExpenses' },
      { to: '/expenses/admin', label: 'Admin expenses', icon: Banknote, permission: 'manageEmployees' },
      { to: '/expenses/types', label: 'Expense types', icon: ClipboardList, permission: 'manageEmployees' },
    ],
  },
  {
    label: 'Payroll',
    icon: Banknote,
    items: [
      { to: '/my-payroll', label: 'My payroll', icon: Wallet },
      { to: '/salary-components', label: 'Salary components', icon: Coins, permission: 'manageEmployees' },
      { to: '/payroll', label: 'Payroll runs', icon: Banknote, permission: 'manageEmployees' },
      { to: '/payroll-settings', label: 'Payroll settings', icon: Settings, permission: 'manageEmployees' },
    ],
  },
  { to: '/holidays', label: 'Holidays', icon: Calendar },
]

const EXPANDED_GROUPS_STORAGE_KEY = 'sidebar-expanded-groups'

// Longest matching `to` wins so /leave/apply resolves to its own item rather
// than the /leave one it happens to be nested under.
function findGroupLabelForPath(pathname: string): string | undefined {
  let matchedLabel: string | undefined
  let matchedLength = 0
  for (const entry of SIDEBAR_ENTRIES) {
    if (!isNavGroup(entry)) continue
    for (const item of entry.items) {
      const isMatch = pathname === item.to || pathname.startsWith(`${item.to}/`)
      if (isMatch && item.to.length > matchedLength) {
        matchedLabel = entry.label
        matchedLength = item.to.length
      }
    }
  }
  return matchedLabel
}

function readStoredExpandedGroups(): Set<string> {
  try {
    const stored = sessionStorage.getItem(EXPANDED_GROUPS_STORAGE_KEY)
    return new Set<string>(stored ? (JSON.parse(stored) as string[]) : [])
  } catch {
    return new Set<string>()
  }
}

const navLinkClassName =
  (isCollapsed: boolean, isChild = false) =>
  ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-xl py-2 text-sm transition-colors ${
      isCollapsed ? 'w-10 shrink-0 justify-center self-center px-0' : isChild ? 'py-2 pl-8 pr-3' : 'px-3'
    } ${isActive ? 'bg-active-pill-bg font-medium text-active-pill-ink shadow-sm' : 'text-ink-2 hover:bg-sidebar-hover'}`

type OrgStatus = 'loading' | 'loaded' | 'error' | 'empty'

export function AppLayout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const queryClient = useQueryClient()
  const { data: session } = authClient.useSession()
  const { canManageEmployees, canApproveRequests } = useActiveMemberRole()
  // Not role-gated like the other approver queues — any employee who's been
  // named as someone's approving manager can act here, so visibility is
  // "does my queue currently have anything in it" rather than a role check.
  // Shares its query key with ExpenseApprovalsPage, so this costs one extra
  // request per session, not one per render.
  const { data: pendingManagerExpensesData } = usePendingManagerExpenses()
  const canApproveExpenses = (pendingManagerExpensesData?.expenseRequests.length ?? 0) > 0
  const [organizationName, setOrganizationName] = useState('')
  const [orgStatus, setOrgStatus] = useState<OrgStatus>('loading')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(readStoredExpandedGroups)

  const activeGroupLabel = findGroupLabelForPath(pathname)

  // Open the group holding the current route (on first render and on every
  // navigation) without collapsing anything the user opened themselves.
  useEffect(() => {
    if (!activeGroupLabel) return
    setExpandedGroups((current) =>
      current.has(activeGroupLabel) ? current : new Set(current).add(activeGroupLabel),
    )
  }, [activeGroupLabel])

  useEffect(() => {
    try {
      sessionStorage.setItem(EXPANDED_GROUPS_STORAGE_KEY, JSON.stringify([...expandedGroups]))
    } catch {
      // Private-mode / storage-disabled browsers: expansion just doesn't persist.
    }
  }, [expandedGroups])

  // Keyed on the user id, not the whole `session` object — Better Auth's
  // useSession() returns a new object reference on every background
  // revalidation even when nothing actually changed, which was re-running
  // this effect (and re-fetching the org) spontaneously. An AbortController
  // cancels the in-flight request on cleanup instead of letting it resolve
  // into a console-logged 401 if it's still running when the user signs out.
  const userId = session?.user.id

  // Deliberately NOT depending on `session` itself (see the userId comment
  // above); the effect always reads the current `session` via closure, which
  // is fine since it bails out via `if (!session) return` and re-derives
  // everything it needs. (oxlint's exhaustive-deps still flags this as a
  // missing-dependency warning — harmless, doesn't fail `npm run lint`.)
  useEffect(() => {
    if (!session) return
    const controller = new AbortController()
    const fetchOptions = { signal: controller.signal }
    setOrgStatus('loading')

    async function loadOrganization() {
      try {
        // A plain sign-in doesn't restore activeOrganizationId the way registration does.
        // Every user belongs to exactly one org at this stage, so auto-select it rather
        // than showing "no organization" after every normal sign-in.
        let activeOrganizationId = session!.session.activeOrganizationId
        if (!activeOrganizationId) {
          const { data: organizations } = await authClient.organization.list({ fetchOptions })
          if (!organizations || organizations.length === 0) {
            setOrgStatus('empty')
            return
          }
          const { error: setActiveError } = await authClient.organization.setActive({
            organizationId: organizations[0].id,
            fetchOptions,
          })
          if (setActiveError) {
            setOrgStatus('error')
            return
          }
          activeOrganizationId = organizations[0].id
        }

        const { data, error } = await authClient.organization.getFullOrganization({ fetchOptions })
        if (error || !data) {
          setOrgStatus('error')
          return
        }
        setOrganizationName(data.name)
        setOrgStatus('loaded')
      } catch {
        // Expected when cleanup aborts an in-flight call — React StrictMode's
        // dev-only mount/cleanup/remount cycle, a fast unmount, or userId
        // changing again before this finished. Nothing to show an error for.
        if (controller.signal.aborted) return
        setOrgStatus('error')
      }
    }

    loadOrganization()
    return () => {
      controller.abort()
    }
  }, [userId])

  // RequireAuth (the parent route) already guarantees a session exists before
  // this layout renders, so `session` is only briefly null on the very first tick.
  if (!session) return null

  async function handleSignOut() {
    // Cancel first so a still-in-flight active-member request (see
    // useActiveMemberRole) is aborted rather than resolving into a 401
    // after signOut() clears the session cookie.
    await queryClient.cancelQueries({ queryKey: ['active-member'] })
    await authClient.signOut()
    navigate('/login', { replace: true })
  }

  // The domain Employee.role (ADMIN/HR/MANAGER/EMPLOYEE) has no dedicated endpoint yet;
  // surface it only if the backend has attached it to the session user.
  const employeeRole = (session.user as { role?: string } | undefined)?.role

  const permissionFlags: Record<NavPermission, boolean> = {
    manageEmployees: canManageEmployees,
    approveRequests: canApproveRequests,
    approveExpenses: canApproveExpenses,
  }
  const isItemVisible = (item: NavItem) => !item.permission || permissionFlags[item.permission]

  // Filter before rendering, and drop groups whose every item was filtered out
  // so an employee never sees an empty section header.
  const visibleEntries = SIDEBAR_ENTRIES.flatMap<SidebarEntry>((entry) => {
    if (!isNavGroup(entry)) return isItemVisible(entry) ? [entry] : []
    const visibleItems = entry.items.filter(isItemVisible)
    return visibleItems.length > 0 ? [{ ...entry, items: visibleItems }] : []
  })

  function renderNavLink(item: NavItem, isChild: boolean, isIconOnly = isSidebarCollapsed) {
    const { to, label, icon: Icon, end } = item
    return (
      <NavLink
        key={to}
        to={to}
        end={end}
        className={navLinkClassName(isIconOnly, isChild)}
        title={isIconOnly ? label : undefined}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {!isIconOnly && label}
      </NavLink>
    )
  }

  function toggleGroup(label: string) {
    setExpandedGroups((current) => {
      const next = new Set(current)
      if (!next.delete(label)) next.add(label)
      return next
    })
  }

  const initials = session.user.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  return (
    <div className="flex min-h-screen bg-canvas">
      <aside
        className={`flex shrink-0 flex-col gap-6 bg-sidebar py-6 transition-[width] ${
          isSidebarCollapsed ? 'w-20 overflow-visible px-2' : 'w-64 overflow-y-auto px-4 max-md:w-56'
        }`}
      >
        <div className={`flex items-center px-2 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
          {/* Company logo goes here once we have one; falls back to the name. */}
          {!isSidebarCollapsed && <p className="text-lg font-semibold text-ink">HRM Portal</p>}
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {/* Collapsed sidebar shows one icon per entry; a group's children
              live in a hover/focus flyout instead of stretching the rail. */}
          {isSidebarCollapsed
            ? visibleEntries.map((entry) => {
                if (!isNavGroup(entry)) return renderNavLink(entry, false)
                const GroupIcon = entry.icon
                const hasActiveChild = activeGroupLabel === entry.label
                return (
                  <div key={entry.label} className="group relative self-center">
                    <button
                      type="button"
                      aria-label={entry.label}
                      className={`flex w-10 items-center justify-center rounded-xl py-2 transition-colors ${
                        hasActiveChild
                          ? 'bg-active-pill-bg text-active-pill-ink shadow-sm'
                          : 'text-ink-2 hover:bg-sidebar-hover'
                      }`}
                    >
                      <GroupIcon className="h-4 w-4 shrink-0" />
                    </button>
                    <div className="absolute left-full top-0 z-20 ml-2 hidden min-w-52 flex-col gap-1 rounded-xl border border-border bg-panel p-2 shadow-lg group-focus-within:flex group-hover:flex">
                      <p className="px-3 pb-1 pt-1 text-xs font-semibold uppercase tracking-wide text-muted">
                        {entry.label}
                      </p>
                      {entry.items.map((item) => renderNavLink(item, false, false))}
                    </div>
                  </div>
                )
              })
            : visibleEntries.map((entry) => {
                if (!isNavGroup(entry)) return renderNavLink(entry, false)
                const isExpanded = expandedGroups.has(entry.label)
                const hasActiveChild = activeGroupLabel === entry.label
                return (
                  <div key={entry.label} className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => toggleGroup(entry.label)}
                      aria-expanded={isExpanded}
                      className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-sidebar-hover ${
                        hasActiveChild ? 'font-semibold text-ink' : 'font-medium text-ink-2'
                      }`}
                    >
                      {entry.label}
                      <ChevronRight
                        className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                          isExpanded ? 'rotate-90' : 'rotate-0'
                        }`}
                      />
                    </button>
                    {/* grid-rows 0fr -> 1fr animates to the content's real
                        height without hard-coding a max-height. */}
                    <div
                      className={`grid transition-[grid-template-rows] duration-200 ${
                        isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                      }`}
                    >
                      <div className="flex flex-col gap-1 overflow-hidden">
                        {entry.items.map((item) => renderNavLink(item, true))}
                      </div>
                    </div>
                  </div>
                )
              })}
        </nav>
        <button
          type="button"
          onClick={() => setIsSidebarCollapsed((current) => !current)}
          aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`flex w-10 shrink-0 items-center justify-center rounded-xl py-2 text-ink-2 transition-colors hover:bg-sidebar-hover ${
            isSidebarCollapsed ? 'self-center' : 'self-end'
          }`}
        >
          {isSidebarCollapsed ? <ChevronRight className="h-4 w-4 shrink-0" /> : <ChevronLeft className="h-4 w-4 shrink-0" />}
        </button>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-border bg-panel px-6 py-4">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-border bg-canvas px-4 py-2 text-ink-2 max-w-md">
            <Search className="h-4 w-4 shrink-0 text-muted" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
              readOnly
            />
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <button
              type="button"
              aria-label="Notifications"
              className="rounded-full p-2 text-ink-2 hover:bg-row-hover"
            >
              <Bell className="h-5 w-5" />
            </button>
            <div className="hidden text-right sm:block">
              {orgStatus === 'loading' && <p className="text-sm text-muted">Loading organization...</p>}
              {orgStatus === 'loaded' && <p className="text-sm font-medium text-ink">{organizationName}</p>}
              {orgStatus === 'error' && <p className="text-sm text-error">Could not load organization</p>}
              {orgStatus === 'empty' && <p className="text-sm text-muted">No active organization</p>}
            </div>
            <div className="flex items-center gap-3 border-l border-border pl-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-ink">
                {initials || '?'}
              </span>
              <div className="hidden text-left md:block">
                <p className="text-sm font-medium text-ink">{session.user.name}</p>
                <p className="text-xs text-muted">
                  {session.user.email}
                  {employeeRole && ` — ${employeeRole}`}
                </p>
              </div>
              <Button variant="secondary" fullWidth={false} onClick={handleSignOut}>
                Sign out
              </Button>
            </div>
          </div>
        </header>
        <main className="min-w-0 flex-1 overflow-y-auto p-6">
          <div className="rounded-2xl border border-border bg-panel p-6 shadow-sm">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
