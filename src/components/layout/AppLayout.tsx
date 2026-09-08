import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  Bell,
  Building2,
  Calendar,
  CheckCircle,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Clock,
  FilePlus,
  GitBranch,
  LayoutGrid,
  List,
  Mail,
  Search,
  Sun,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '../ui/Button'
import { authClient } from '../../lib/auth-client'
import { useActiveMemberRole } from '../../lib/useActiveMemberRole'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
  show: boolean
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const navLinkClassName =
  (isCollapsed: boolean) =>
  ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-xl py-2 text-sm transition-colors ${
      isCollapsed ? 'w-10 shrink-0 justify-center self-center px-0' : 'px-3'
    } ${isActive ? 'bg-active-pill-bg font-medium text-active-pill-ink shadow-sm' : 'text-ink-2 hover:bg-sidebar-hover'}`

type OrgStatus = 'loading' | 'loaded' | 'error' | 'empty'

export function AppLayout() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: session } = authClient.useSession()
  const { canManageEmployees, canApproveRequests } = useActiveMemberRole()
  const [organizationName, setOrganizationName] = useState('')
  const [orgStatus, setOrgStatus] = useState<OrgStatus>('loading')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

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

  const navGroups: NavGroup[] = [
    {
      label: 'Menu',
      items: [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutGrid, show: true },
        { to: '/employees', label: 'Employees', icon: Users, show: canManageEmployees },
        { to: '/departments', label: 'Departments', icon: Building2, show: canManageEmployees },
        { to: '/org-chart', label: 'Org chart', icon: GitBranch, show: canManageEmployees },
        { to: '/invitations', label: 'Invitations', icon: Mail, show: canManageEmployees },
        { to: '/holidays', label: 'Holidays', icon: Calendar, show: true },
      ],
    },
    {
      label: 'Time off & attendance',
      items: [
        { to: '/leave/apply', label: 'Apply for leave', icon: FilePlus, show: true },
        { to: '/leave', label: 'My leave', icon: Sun, end: true, show: true },
        { to: '/leave/approvals', label: 'Leave approvals', icon: CheckCircle, show: canApproveRequests },
        { to: '/attendance', label: 'My attendance', icon: Clock, end: true, show: true },
        { to: '/attendance/day', label: 'Attendance day view', icon: List, show: canManageEmployees },
        { to: '/attendance/approvals', label: 'Attendance approvals', icon: CheckSquare, show: canApproveRequests },
      ],
    },
  ]

  const initials = session.user.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  return (
    <div className="flex min-h-screen bg-canvas">
      <aside
        className={`flex shrink-0 flex-col gap-6 overflow-y-auto bg-sidebar py-6 transition-[width] ${
          isSidebarCollapsed ? 'w-20 px-2' : 'w-64 px-4 max-md:w-56'
        }`}
      >
        <div className={`flex items-center px-2 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
          {/* Company logo goes here once we have one; falls back to the name. */}
          {!isSidebarCollapsed && <p className="text-lg font-semibold text-ink">HRM Portal</p>}
        </div>
        <nav className="flex flex-1 flex-col gap-6">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter((item) => item.show)
            if (visibleItems.length === 0) return null
            return (
              <div key={group.label} className="flex flex-col gap-1">
                {visibleItems.map(({ to, label, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={navLinkClassName(isSidebarCollapsed)}
                    title={isSidebarCollapsed ? label : undefined}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!isSidebarCollapsed && label}
                  </NavLink>
                ))}
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
