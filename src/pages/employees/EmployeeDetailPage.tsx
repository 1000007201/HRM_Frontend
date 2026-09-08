import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Download, Trash2 } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { FormSelect } from '../../components/ui/FormSelect'
import { ApiError, errorMessage } from '../../lib/apiClient'
import { useActiveMemberRole } from '../../lib/useActiveMemberRole'
import {
  useDeleteEmployeeDocument,
  useEmployee,
  useEmployeeDocuments,
  useInvitationLink,
  useInviteEmployee,
  useUploadEmployeeDocument,
} from '../../features/employees/hooks'
import { employeeDocumentDownloadUrl } from '../../features/employees/api'
import {
  EMPLOYEE_DOCUMENT_TYPES,
  EMPLOYEE_DOCUMENT_TYPE_LABELS,
  type EmployeeDocumentType,
} from '../../features/employees/types'
import { LoadingState } from '../../components/ui/Spinner'

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function DocumentsPanel({ employeeId }: { employeeId: string }) {
  const { data, isPending, isError } = useEmployeeDocuments(employeeId)
  const uploadDocument = useUploadEmployeeDocument(employeeId)
  const deleteDocument = useDeleteEmployeeDocument(employeeId)
  const [type, setType] = useState<EmployeeDocumentType>(EMPLOYEE_DOCUMENT_TYPES[0])
  const [file, setFile] = useState<File | null>(null)

  function handleUpload() {
    if (!file) return
    uploadDocument.mutate(
      { type, file },
      {
        onSuccess: () => setFile(null),
      },
    )
  }

  return (
    <div className="mt-6 rounded-2xl border border-border bg-canvas p-4">
      <p className="mb-3 text-sm font-medium text-ink">Documents</p>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <FormSelect
          label="Document type"
          className="w-56"
          value={type}
          onChange={(event) => setType(event.target.value as EmployeeDocumentType)}
        >
          {EMPLOYEE_DOCUMENT_TYPES.map((documentType) => (
            <option key={documentType} value={documentType}>
              {EMPLOYEE_DOCUMENT_TYPE_LABELS[documentType]}
            </option>
          ))}
        </FormSelect>
        <input
          type="file"
          accept="application/pdf,image/jpeg,image/png"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="mb-4 text-sm text-ink-2 file:mr-3 file:rounded-md file:border file:border-border file:bg-white file:px-3 file:py-1.5 file:text-sm file:text-ink-2 hover:file:bg-row-hover"
        />
        <Button
          fullWidth={false}
          className="mb-4"
          disabled={!file}
          isLoading={uploadDocument.isPending}
          onClick={handleUpload}
        >
          Upload
        </Button>
      </div>
      {uploadDocument.isError && (
        <p className="mb-3 text-sm text-error">{errorMessage(uploadDocument.error, 'Could not upload the file.')}</p>
      )}

      {isPending && <LoadingState padding="py-4" />}
      {isError && <p className="text-sm text-error">Could not load documents.</p>}
      {data && data.documents.length === 0 && <p className="text-sm text-muted">No documents uploaded yet.</p>}
      {data && data.documents.length > 0 && (
        <ul className="divide-y divide-border">
          {data.documents.map((document) => (
            <li key={document.id} className="flex items-center justify-between gap-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm text-ink-2">{document.fileName}</p>
                <p className="text-xs text-muted">
                  {EMPLOYEE_DOCUMENT_TYPE_LABELS[document.type]} · {formatFileSize(document.fileSize)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <a
                  href={employeeDocumentDownloadUrl(employeeId, document.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md p-1.5 text-ink-2 hover:bg-row-hover"
                  aria-label={`Download ${document.fileName}`}
                >
                  <Download className="h-4 w-4" />
                </a>
                <button
                  type="button"
                  onClick={() => deleteDocument.mutate(document.id)}
                  disabled={deleteDocument.isPending}
                  className="rounded-md p-1.5 text-error hover:bg-row-hover disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={`Delete ${document.fileName}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {deleteDocument.isError && (
        <p className="mt-2 text-sm text-error">{errorMessage(deleteDocument.error, 'Could not delete the document.')}</p>
      )}
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-sm text-ink-2">{value}</dd>
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
    <div className="mt-6 rounded-2xl border border-border bg-canvas p-4">
      <p className="mb-3 text-sm font-medium text-ink">Portal access</p>
      {inviteEmployee.isSuccess ? (
        <p className="mb-3 rounded-md border border-success bg-success-bg px-3 py-2 text-sm text-ink-2">
          Invitation sent.
        </p>
      ) : (
        <Button
          variant="secondary"
          className="mb-3"

          fullWidth={false}
          isLoading={inviteEmployee.isPending}
          onClick={() => inviteEmployee.mutate()}
        >
          Invite to portal
        </Button>
      )}
      {inviteEmployee.isError && (
        <p className="mb-3 text-sm text-error">
          {errorMessage(inviteEmployee.error, 'Could not send the invitation.')}
        </p>
      )}
      {inviteEmployee.isSuccess && (
        <div>
          <Button variant="secondary" fullWidth={false} isLoading={invitationLink.isPending} onClick={handleCopyLink}>
            {copied ? 'Copied!' : 'Copy invite link'}
          </Button>
          {invitationLink.data && <p className="mt-2 break-all text-xs text-muted">{invitationLink.data.url}</p>}
          {invitationLink.isError && (
            <p className="mt-2 text-sm text-error">
              {errorMessage(invitationLink.error, 'Could not fetch the invite link.')}
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
    return <LoadingState />
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
      <Link to="/employees" className="mb-4 inline-block text-sm text-primary hover:underline">
        ← Back to employees
      </Link>
      <div className="mb-6 flex items-start justify-between">
        <h1 className="text-lg font-semibold text-ink">{employee.fullName}</h1>
        {canManageEmployees && (
          <Link
            to={`/employees/${employee.id}/edit`}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-ink-2 hover:bg-row-hover"
          >
            Edit
          </Link>
        )}
      </div>
      <dl className="grid grid-cols-2 gap-4">
        <DetailRow label="Email" value={employee.email} />
        <DetailRow label="Role" value={employee.role} />
        <DetailRow label="Department" value={employee.department?.name ?? '—'} />
        <DetailRow label="Designation" value={employee.designation ?? '—'} />
        <DetailRow label="Reporting Person" value={employee.manager?.fullName ?? '—'} />
        <DetailRow
          label="Date of joining"
          value={employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : '—'}
        />
        <DetailRow
          label="Date of leaving"
          value={employee.leavingDate ? new Date(employee.leavingDate).toLocaleDateString() : '—'}
        />
        <DetailRow label="Portal access" value={hasPortalAccess ? 'Active' : employee.invitedAt ? 'Invited' : 'Not invited'} />
      </dl>

      <div className="mt-6 border-t border-border pt-4">
        <p className="mb-3 text-sm font-medium text-ink">Additional details</p>
        <dl className="grid grid-cols-2 gap-4">
          <DetailRow label="Employee code" value={employee.employeeCode ?? '—'} />
          <DetailRow label="Phone" value={employee.phone ?? '—'} />
          <DetailRow
            label="Date of birth"
            value={employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString() : '—'}
          />
          <DetailRow label="Gender" value={employee.gender ?? '—'} />
          <DetailRow label="Emergency contact name" value={employee.emergencyContactName ?? '—'} />
          <DetailRow label="Emergency contact phone" value={employee.emergencyContactPhone ?? '—'} />
          <div className="col-span-2">
            <DetailRow label="Address" value={employee.address ?? '—'} />
          </div>
        </dl>
      </div>
      {canManageEmployees && !hasPortalAccess && <InviteToPortal employeeId={employee.id} />}
      {canManageEmployees && <DocumentsPanel employeeId={employee.id} />}
    </div>
  )
}
