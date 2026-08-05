import { Button } from '../../components/auth/Button'
import { ApiError } from '../../lib/apiClient'
import { useCancelInvitation, useInvitations } from '../../features/employees/hooks'

export function PendingInvitationsPage() {
  const { data, isPending, isError, error } = useInvitations()
  const cancelInvitation = useCancelInvitation()

  if (isPending) {
    return (
      <div className="flex justify-center py-8">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary-100 border-t-primary-300" />
      </div>
    )
  }

  if (isError) {
    if (error instanceof ApiError && error.status === 403) {
      return <p className="text-sm text-secondary">You don't have access to pending invitations.</p>
    }
    return <p className="text-sm text-error">Could not load pending invitations. Please try again.</p>
  }

  if (data.invitations.length === 0) {
    return <p className="text-sm text-secondary">No pending invitations.</p>
  }

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold text-heading">Pending invitations</h1>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-card-border text-xs text-secondary">
            <th className="py-2 font-medium">Email</th>
            <th className="py-2 font-medium">Role</th>
            <th className="py-2 font-medium">Expires</th>
            <th className="py-2 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {data.invitations.map((invitation) => (
            <tr key={invitation.id} className="border-b border-card-border last:border-0">
              <td className="py-2 text-body">{invitation.email}</td>
              <td className="py-2 text-body">{invitation.role ?? '—'}</td>
              <td className="py-2 text-body">{new Date(invitation.expiresAt).toLocaleDateString()}</td>
              <td className="py-2 text-right">
                <Button
                  variant="secondary"
                  className="w-auto"
                  isLoading={cancelInvitation.isPending && cancelInvitation.variables === invitation.id}
                  onClick={() => cancelInvitation.mutate(invitation.id)}
                >
                  Cancel
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {cancelInvitation.isError && (
        <p className="mt-3 text-sm text-error">
          {cancelInvitation.error instanceof ApiError ? cancelInvitation.error.message : 'Could not cancel the invitation.'}
        </p>
      )}
    </div>
  )
}
