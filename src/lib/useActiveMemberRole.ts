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

export function useActiveMemberRole() {
  const { data: session } = authClient.useSession()
  const { data, isPending } = useQuery({
    queryKey: ['active-member', session?.session.activeOrganizationId],
    queryFn: async () => {
      const { data } = await authClient.organization.getActiveMember()
      return data
    },
    enabled: Boolean(session?.session.activeOrganizationId),
  })

  const orgRole = data?.role
  return {
    isLoading: isPending,
    canManageEmployees: Boolean(orgRole && MANAGER_ORG_ROLES.has(orgRole)),
  }
}
