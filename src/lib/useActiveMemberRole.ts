import { useQuery } from '@tanstack/react-query'
import { authClient } from './auth-client'

// Better Auth's org member role (lowercase: admin/employee) is kept in 1:1
// correspondence with the backend's two-role EmployeeRole enum — see
// toOrgRole/toEmployeeRole in the backend's src/lib/invitations.ts. Reading it
// here avoids needing a dedicated "my employee record" endpoint just to know
// whether to show ADMIN-only controls. The backend re-checks the real
// Employee.role on every request, so this is convenience gating only.
//
// "owner" is Better Auth's own built-in role, not the custom "admin" one —
// the user who registered the company keeps it (see registerCompany.ts) even
// though their domain Employee.role is "ADMIN". Must be treated the same as
// "admin" here or the org's own creator loses access to this UI.
//
// Employee management, approvals, and department management are all
// ADMIN-only now that HR/MANAGER no longer exist as distinct roles.
const ADMIN_ORG_ROLES = new Set(['owner', 'admin'])

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
  const isAdmin = Boolean(orgRole && ADMIN_ORG_ROLES.has(orgRole))
  return {
    isLoading: isPending,
    canManageEmployees: isAdmin,
    canApproveRequests: isAdmin,
  }
}
