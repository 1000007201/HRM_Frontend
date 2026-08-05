import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '../../components/auth/Button'
import { ApiError } from '../../lib/apiClient'
import { useActiveMemberRole } from '../../lib/useActiveMemberRole'
import { useEmployee, useInvitationLink, useInviteEmployee } from '../../features/employees/hooks'

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-secondary">{label}</dt>
      <dd className="text-sm text-body">{value}</dd>
    </div>
  )
}

function InviteToPortal({ employeeId }: { employeeId: string }) {
  const inviteEmployee = useInviteEmployee(employeeId)
  const invitationLink = useInvitationLink(employeeId)
  const [copied, setCopied] = useState(false)

  async function handleCopyLink() {
    const result = await invitationLink.mutateAsync()
    setCopied(false)
    void navigator.clipboard.writeText(result.url).then(() => setCopied(true))
  }

  return (
    <div className="mt-6 rounded-md border border-card-border bg-charcoal-50 p-4">
      <p className="mb-3 text-sm font-medium text-heading">Portal access</p>
      {inviteEmployee.isSuccess ? (
        <p className="mb-3 rounded-md border border-success bg-success-bg px-3 py-2 text-sm text-body">
          Invitation sent.
        </p>
      ) : (
        <Button
          variant="secondary"
          className="mb-3 w-auto"
          isLoading={inviteEmployee.isPending}
          onClick={() => inviteEmployee.mutate()}
        >
          Invite to portal
        </Button>
      )}
      {inviteEmployee.isError && (
        <p className="mb-3 text-sm text-error">
          {inviteEmployee.error instanceof ApiError ? inviteEmployee.error.message : 'Could not send the invitation.'}
        </p>
      )}
      {inviteEmployee.isSuccess && (
        <div>
          <Button variant="secondary" className="w-auto" isLoading={invitationLink.isPending} onClick={handleCopyLink}>
            {copied ? 'Copied!' : 'Copy invite link'}
          </Button>
          {invitationLink.data && <p className="mt-2 break-all text-xs text-secondary">{invitationLink.data.url}</p>}
          {invitationLink.isError && (
            <p className="mt-2 text-sm text-error">
              {invitationLink.error instanceof ApiError ? invitationLink.error.message : 'Could not fetch the invite link.'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data, isPending, isError, error } = useEmployee(id!)
  const { canManageEmployees } = useActiveMemberRole()

  if (isPending) {
    return (
      <div className="flex justify-center py-8">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary-100 border-t-primary-300" />
      </div>
    )
  }

  if (isError) {
    return (
      <p className="text-sm text-error">
        {error instanceof ApiError && error.status === 404 ? 'Employee not found.' : 'Could not load this employee.'}
      </p>
    )
  }

  const { employee } = data
  const hasPortalAccess = employee.userId !== null

  return (
    <div className="max-w-lg">
      <Link to="/employees" className="mb-4 inline-block text-sm text-primary-300 hover:underline">
        ← Back to employees
      </Link>
      <div className="mb-6 flex items-start justify-between">
        <h1 className="text-lg font-semibold text-heading">{employee.fullName}</h1>
        {canManageEmployees && (
          <Link
            to={`/employees/${employee.id}/edit`}
            className="rounded-md border border-charcoal-100 px-3 py-1.5 text-sm text-body hover:bg-charcoal-50"
          >
            Edit
          </Link>
        )}
      </div>
      <dl className="grid grid-cols-2 gap-4">
        <DetailRow label="Email" value={employee.email} />
        <DetailRow label="Role" value={employee.role} />
        <DetailRow label="Designation" value={employee.designation ?? '—'} />
        <DetailRow label="Manager" value={employee.manager?.fullName ?? '—'} />
        <DetailRow label="Portal access" value={hasPortalAccess ? 'Active' : employee.invitedAt ? 'Invited' : 'Not invited'} />
      </dl>
      {canManageEmployees && !hasPortalAccess && <InviteToPortal employeeId={employee.id} />}
    </div>
  )
}
