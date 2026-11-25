import { useEffect, useRef, useState } from 'react'
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
  GitBranch,
  LayoutGrid,
  List,
  LogIn,
  LogOut,
  Mail,
  Receipt,
  Search,
  Settings,
  Sun,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { authClient } from '../../lib/auth-client'
import { useActiveMemberRole } from '../../lib/useActiveMemberRole'
import { usePendingManagerExpenses } from '../../features/expenses/hooks'
import { useCheckIn, useCheckOut, useMyMonth } from '../../features/attendance/hooks'
import { formatClockTime, formatWorkedMinutes, todayDateKey, toMonthKey } from '../../features/attendance/display'
import type { AttendanceStatus } from '../../features/attendance/types'
import { errorMessage } from '../../lib/apiClient'
import { Spinner } from '../ui/Spinner'

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
      { to: '/attendance/settings', label: 'Attendance settings', icon: Settings },
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

const NON_WORKING_STATUSES: Partial<Record<AttendanceStatus, true>> = {
  WEEK_OFF: true,
  HOLIDAY: true,
  ON_LEAVE: true,
}

function CompactCheckIn() {
  const month = toMonthKey(new Date())
  const { data, isPending } = useMyMonth(month)
  const checkIn = useCheckIn()
  const checkOut = useCheckOut()
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  if (isPending) {
    return <Spinner size="sm" />
  }

  const today = data?.days.find((day) => day.date === todayDateKey())
  if (!today) return null

  const isNonWorking = today.status !== null && NON_WORKING_STATUSES[today.status]
  if (isNonWorking) return null

  const activeMutation = checkOut.isPending || checkOut.isError ? checkOut : checkIn
  const punchError = activeMutation.isError
    ? errorMessage(activeMutation.error, 'Failed')
    : ''

  if (today.checkInAt && today.checkOutAt) {
    return (
      <div className="flex items-center gap-2 rounded-full border border-border bg-success-bg/50 px-3 py-1">
        <div className="h-2 w-2 rounded-full bg-success" />
        <span className="text-xs font-medium text-success">Done · {formatWorkedMinutes(today.workedMinutes)}</span>
      </div>
    )
  }

  if (today.checkInAt) {
    const elapsedSeconds = Math.max(0, Math.floor((now - new Date(today.checkInAt).getTime()) / 1000))
    const hours = Math.floor(elapsedSeconds / 3600)
    const minutes = Math.floor((elapsedSeconds % 3600) / 60)
    const seconds = elapsedSeconds % 60
    const elapsed = `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-full border border-success/20 bg-success-bg/50 px-3 py-1">
          <div className="h-2 w-2 animate-pulse rounded-full bg-success" />
          <span className="font-mono text-xs font-medium tabular-nums text-success">{elapsed}</span>
        </div>
        <button
          type="button"
          disabled={checkOut.isPending}
          onClick={() => checkOut.mutate()}
          className="flex items-center gap-1 rounded-full border border-border bg-white px-2.5 py-1 text-xs font-medium text-ink-2 hover:bg-row-hover disabled:opacity-50"
          title={`Checked in at ${formatClockTime(today.checkInAt)}`}
        >
          <LogOut className="h-3 w-3" />
          <span className="hidden sm:inline">Out</span>
        </button>
        {punchError && <span className="text-xs text-error">{punchError}</span>}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={checkIn.isPending}
        onClick={() => checkIn.mutate()}
        className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-medium text-white hover:bg-primary-hover disabled:opacity-50"
      >
        <LogIn className="h-3 w-3" />
        Check in
      </button>
      {punchError && <span className="text-xs text-error">{punchError}</span>}
    </div>
  )
}

function AvatarMenu({
  initials,
  userName,
  userEmail,
  onSignOut,
}: {
  initials: string
  userName: string
  userEmail: string
  onSignOut: () => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-ink hover:ring-2 hover:ring-accent/30"
        aria-label="User menu"
      >
        {initials || '?'}
      </button>
      {isOpen && (
        <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-border bg-white py-1 shadow-lg">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-medium text-ink">{userName}</p>
            <p className="text-xs text-muted">{userEmail}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false)
              onSignOut()
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-ink-2 hover:bg-row-hover"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

type OrgStatus = 'loading' | 'loaded' | 'error' | 'empty'

export function AppLayout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const queryClient = useQueryClient()
  const { data: session } = authClient.useSession()
  const { canManageEmployees, canApproveRequests } = useActiveMemberRole()
  const { data: pendingManagerExpensesData } = usePendingManagerExpenses()
  const canApproveExpenses = (pendingManagerExpensesData?.expenseRequests.length ?? 0) > 0
  const [organizationName, setOrganizationName] = useState('')
  const [orgStatus, setOrgStatus] = useState<OrgStatus>('loading')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(readStoredExpandedGroups)

  const activeGroupLabel = findGroupLabelForPath(pathname)

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

  const userId = session?.user.id

  useEffect(() => {
    if (!session) return
    const controller = new AbortController()
    const fetchOptions = { signal: controller.signal }
    setOrgStatus('loading')

    async function loadOrganization() {
      try {
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
        if (controller.signal.aborted) return
        setOrgStatus('error')
      }
    }

    loadOrganization()
    return () => {
      controller.abort()
    }
  }, [userId])

  if (!session) return null

  async function handleSignOut() {
    await queryClient.cancelQueries({ queryKey: ['active-member'] })
    await authClient.signOut()
    navigate('/login', { replace: true })
  }

  const permissionFlags: Record<NavPermission, boolean> = {
    manageEmployees: canManageEmployees,
    approveRequests: canApproveRequests,
    approveExpenses: canApproveExpenses,
  }
  const isItemVisible = (item: NavItem) => !item.permission || permissionFlags[item.permission]

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

  const orgMonogram = organizationName
    ? organizationName.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('')
    : ''

  return (
    <div className="flex min-h-screen bg-canvas">
      <aside
        className={`flex shrink-0 flex-col gap-6 bg-sidebar py-6 transition-[width] ${
          isSidebarCollapsed ? 'w-20 overflow-visible px-2' : 'w-64 overflow-y-auto px-4 max-md:w-56'
        }`}
      >
        <div className={`flex items-center gap-2.5 px-2 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
          {orgStatus === 'loaded' && orgMonogram && (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-white">
              {orgMonogram}
            </span>
          )}
          {!isSidebarCollapsed && (
            <div className="min-w-0">
              {orgStatus === 'loaded' && (
                <p className="truncate text-sm font-semibold text-ink">{organizationName}</p>
              )}
              {orgStatus === 'loading' && <p className="text-sm text-muted">Loading…</p>}
              {orgStatus === 'error' && <p className="text-sm text-error">Error</p>}
              {orgStatus === 'empty' && <p className="text-sm text-muted">No org</p>}
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted">HRM</p>
            </div>
          )}
        </div>
        <nav className="flex flex-1 flex-col gap-1">
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
        <header className="flex items-center justify-between gap-4 border-b border-border bg-panel px-6 py-3">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-border bg-canvas px-4 py-1.5 text-ink-2 max-w-md">
            <Search className="h-4 w-4 shrink-0 text-muted" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
              readOnly
            />
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <CompactCheckIn />
            <button
              type="button"
              aria-label="Notifications"
              className="rounded-full p-2 text-ink-2 hover:bg-row-hover"
            >
              <Bell className="h-5 w-5" />
            </button>
            <AvatarMenu
              initials={initials}
              userName={session.user.name}
              userEmail={session.user.email}
              onSignOut={handleSignOut}
            />
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
