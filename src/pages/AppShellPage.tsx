import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/auth/Button'
import { authClient } from '../lib/auth-client'

type OrgStatus = 'loading' | 'loaded' | 'error' | 'empty'

export function AppShellPage() {
  const navigate = useNavigate()
  const { data: session } = authClient.useSession()
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

  async function handleSignOut() {
    await authClient.signOut()
    navigate('/sign-in', { replace: true })
  }

  // The domain Employee.role (ADMIN/HR/MANAGER/EMPLOYEE) has no dedicated endpoint yet;
  // surface it only if the backend has attached it to the session user.
  const employeeRole = (session?.user as { role?: string } | undefined)?.role

  return (
    <div className="min-h-screen bg-charcoal-50">
      <header className="flex items-center justify-between border-b border-card-border bg-white px-6 py-4">
        <div>
          <p className="font-semibold text-heading">HRM Portal</p>
          {orgStatus === 'loading' && <p className="text-sm text-secondary">Loading organization...</p>}
          {orgStatus === 'loaded' && <p className="text-sm text-secondary">{organizationName}</p>}
          {orgStatus === 'error' && <p className="text-sm text-error">Could not load organization</p>}
          {orgStatus === 'empty' && <p className="text-sm text-secondary">No active organization</p>}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-body">{session?.user.name}</p>
            <p className="text-xs text-secondary">
              {session?.user.email}
              {employeeRole && ` — ${employeeRole}`}
            </p>
          </div>
          <Button variant="secondary" className="w-auto" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </header>
      <main className="p-6">
        <p className="text-sm text-secondary">Signed in. Nothing to show here yet.</p>
      </main>
    </div>
  )
}
