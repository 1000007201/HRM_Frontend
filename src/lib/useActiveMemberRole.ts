import { useQuery } from '@tanstack/react-query'
import { authClient } from './auth-client'

// Better Auth's org member role (lowercase: admin/hr/manager/employee) is kept
// in 1:1 correspondence with the backend's EmployeeRole enum — see
// toOrgRole/toEmployeeRole in the backend's src/lib/invitations.ts. Reading it
// here avoids needing a dedicated "my employee record" endpoint just to know
// whether to show ADMIN/HR-only controls. The backend re-checks the real
// Employee.role on every request, so this is convenience gating only.
//
// "owner" is Better Auth's own built-in role, not one of the four custom
// ones — the user who registered the company keeps it (see registerCompany.ts)
// even though their domain Employee.role is "ADMIN". Must be treated the same
// as "admin" here or the org's own creator loses access to this UI.
const MANAGER_ORG_ROLES = new Set(['owner', 'admin', 'hr'])

// Approvals are gated wider than employee management — MANAGER can approve or
// reject both leave requests and attendance regularizations (backend
// APPROVER_ROLES in src/routes/leaveRequests.ts and src/routes/regularizations.ts)
// even though MANAGER can't create/edit employees.
const APPROVER_ORG_ROLES = new Set(['owner', 'admin', 'hr', 'manager'])

export function useActiveMemberRole() {
  const { data: session } = authClient.useSession()
  const { data, isPending } = useQuery({
    queryKey: ['active-member', session?.session.activeOrganizationId],
    // Forward React Query's abort signal so a cancelled/unmounted query
    // (e.g. sign-out cancelling it, see AppLayout's handleSignOut) aborts
    // the underlying request instead of letting it resolve into a 401 after
    // the session cookie is already gone.
    queryFn: async ({ signal }) => {
      const { data } = await authClient.organization.getActiveMember({ fetchOptions: { signal } })
      return data
    },
    enabled: Boolean(session?.session.activeOrganizationId),
  })

  const orgRole = data?.role
  return {
    isLoading: isPending,
    canManageEmployees: Boolean(orgRole && MANAGER_ORG_ROLES.has(orgRole)),
    canApproveRequests: Boolean(orgRole && APPROVER_ORG_ROLES.has(orgRole)),
  }
}
