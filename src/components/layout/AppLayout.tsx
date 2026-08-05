import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Button } from '../auth/Button'
import { authClient } from '../../lib/auth-client'
import { useActiveMemberRole } from '../../lib/useActiveMemberRole'

const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-2 text-sm text-white ${isActive ? 'bg-charcoal-300' : 'hover:bg-charcoal-300'}`

type OrgStatus = 'loading' | 'loaded' | 'error' | 'empty'

export function AppLayout() {
  const navigate = useNavigate()
  const { data: session } = authClient.useSession()
  const { canManageEmployees } = useActiveMemberRole()
  const [organizationName, setOrganizationName] = useState('')
  const [orgStatus, setOrgStatus] = useState<OrgStatus>('loading')

  useEffect(() => {
    if (!session) return
    let cancelled = false
    setOrgStatus('loading')

    async function loadOrganization() {
      // A plain sign-in doesn't restore activeOrganizationId the way registration does.
      // Every user belongs to exactly one org at this stage, so auto-select it rather
      // than showing "no organization" after every normal sign-in.
      let activeOrganizationId = session!.session.activeOrganizationId
      if (!activeOrganizationId) {
        const { data: organizations } = await authClient.organization.list()
        if (cancelled) return
        if (!organizations || organizations.length === 0) {
          setOrgStatus('empty')
          return
        }
        const { error: setActiveError } = await authClient.organization.setActive({
          organizationId: organizations[0].id,
        })
        if (cancelled) return
        if (setActiveError) {
          setOrgStatus('error')
          return
        }
        activeOrganizationId = organizations[0].id
      }

      const { data, error } = await authClient.organization.getFullOrganization()
      if (cancelled) return
      if (error || !data) {
        setOrgStatus('error')
        return
      }
      setOrganizationName(data.name)
      setOrgStatus('loaded')
    }

    loadOrganization()
    return () => {
      cancelled = true
    }
  }, [session])

  // RequireAuth (the parent route) already guarantees a session exists before
  // this layout renders, so `session` is only briefly null on the very first tick.
  if (!session) return null

  async function handleSignOut() {
    await authClient.signOut()
    navigate('/login', { replace: true })
  }

  // The domain Employee.role (ADMIN/HR/MANAGER/EMPLOYEE) has no dedicated endpoint yet;
  // surface it only if the backend has attached it to the session user.
  const employeeRole = (session.user as { role?: string } | undefined)?.role

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 bg-charcoal-400 px-4 py-6">
        <p className="mb-6 text-lg font-semibold text-white">HRM Portal</p>
        <nav className="flex flex-col gap-1">
          <NavLink to="/dashboard" className={navLinkClassName}>
            Dashboard
          </NavLink>
          {canManageEmployees && (
            <>
              <NavLink to="/employees" className={navLinkClassName}>
                Employees
              </NavLink>
              <NavLink to="/invitations" className={navLinkClassName}>
                Invitations
              </NavLink>
            </>
          )}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col bg-charcoal-50">
        <header className="flex items-center justify-between border-b border-card-border bg-white px-6 py-4">
          <div>
            {orgStatus === 'loading' && <p className="text-sm text-secondary">Loading organization...</p>}
            {orgStatus === 'loaded' && <p className="font-semibold text-heading">{organizationName}</p>}
            {orgStatus === 'error' && <p className="text-sm text-error">Could not load organization</p>}
            {orgStatus === 'empty' && <p className="text-sm text-secondary">No active organization</p>}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-body">{session.user.name}</p>
              <p className="text-xs text-secondary">
                {session.user.email}
                {employeeRole && ` — ${employeeRole}`}
              </p>
            </div>
            <Button variant="secondary" className="w-auto" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </header>
        <main className="flex-1 p-6">
          <div className="rounded-lg border border-card-border bg-white p-6 shadow-sm">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
