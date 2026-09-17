import { useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Paperclip, Trash2 } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { LoadingState } from '../../components/ui/Spinner'
import { errorMessage } from '../../lib/apiClient'
import {
  useCancelExpenseRequest,
  useDeleteExpenseAttachment,
  useExpense,
  useMyExpenses,
  useUploadExpenseAttachment,
} from '../../features/expenses/hooks'
import { expenseAttachmentDownloadUrl } from '../../features/expenses/api'
import { formatInr, formatMoney } from '../../features/expenses/display'
import { ExpenseStatusBadge } from '../../features/expenses/StatusBadge'

const ALLOWED_BILL_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
const NOT_UPLOADABLE_STATUSES = new Set(['PAYMENT_INITIATED', 'REJECTED', 'CANCELLED'])

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })
const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function ExpenseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const expenseId = id ?? ''
  const { data, isPending, isError } = useExpense(expenseId)
  // GET /expenses/me is the one source of truth for "is this my expense" —
  // the detail response itself doesn't say so, and this works regardless of
  // how the page was reached (a link from My Expenses, a direct URL, a
  // redirect after raising one). Cheap: usually already cached from the My
  // Expenses page.
  const { data: myExpensesData } = useMyExpenses()
  const isRaiser = myExpensesData?.expenseRequests.some((expenseRequest) => expenseRequest.id === expenseId) ?? false

  const cancelExpenseRequest = useCancelExpenseRequest()
  const uploadAttachment = useUploadExpenseAttachment(expenseId)
  const deleteAttachment = useDeleteExpenseAttachment(expenseId)
  const [attachmentError, setAttachmentError] = useState('')
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (isPending) {
    return <LoadingState />
  }

  if (isError || !data) {
    return <p className="text-sm text-error">Could not load this expense. Please try again.</p>
  }

  const { expenseRequest } = data
  const attachments = expenseRequest.attachments ?? []
  const canUploadBill = isRaiser && !NOT_UPLOADABLE_STATUSES.has(expenseRequest.status)
  const canDeleteBills = isRaiser && expenseRequest.status === 'PENDING_MANAGER'
  const canCancel = isRaiser && expenseRequest.status === 'PENDING_MANAGER'

  async function handleFilesPicked(files: FileList | null) {
    if (!files || files.length === 0) return
    setAttachmentError('')
    const results = await Promise.allSettled(Array.from(files).map((file) => uploadAttachment.mutateAsync(file)))
    const failedCount = results.filter((result) => result.status === 'rejected').length
    if (failedCount > 0) {
      setAttachmentError(`${failedCount} of ${files.length} file(s) failed to upload. Please try again.`)
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleDeleteAttachment(attachmentId: string) {
    setAttachmentError('')
    setDeletingAttachmentId(attachmentId)
    try {
      await deleteAttachment.mutateAsync(attachmentId)
    } catch (error) {
      setAttachmentError(errorMessage(error, 'Could not remove the bill.'))
    } finally {
      setDeletingAttachmentId(null)
    }
  }

  return (
    <div className="max-w-2xl">
      <Link to="/expenses" className="mb-4 inline-block text-sm text-primary hover:underline">
        ← Back to my expenses
      </Link>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-ink">{expenseRequest.title}</h1>
          <p className="text-sm text-muted">
            {expenseRequest.expenseType.name} · raised by {expenseRequest.employee.fullName} on{' '}
            {dateFormatter.format(new Date(expenseRequest.createdAt))}
          </p>
        </div>
        <ExpenseStatusBadge status={expenseRequest.status} />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 rounded-2xl border border-border bg-canvas p-4 sm:grid-cols-3">
        <div>
          <p className="text-xs text-muted">Amount</p>
          <p className="text-sm font-medium text-ink">{formatMoney(expenseRequest.amount, expenseRequest.currency)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">INR equivalent</p>
          <p className="text-sm font-medium text-ink">{formatInr(expenseRequest.amountInInr)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Rate used</p>
          <p className="text-sm font-medium text-ink">
            1 {expenseRequest.currency} = ₹{Number(expenseRequest.exchangeRate).toFixed(4)}
          </p>
          <p className="text-xs text-muted">as of {dateFormatter.format(new Date(expenseRequest.rateDate))}</p>
        </div>
      </div>

      {expenseRequest.description && (
        <div className="mb-6">
          <p className="mb-1 text-sm font-medium text-ink">Description</p>
          <p className="text-sm text-ink-2">{expenseRequest.description}</p>
        </div>
      )}

      <div className="mb-6">
        <p className="mb-3 text-sm font-medium text-ink">Decision trail</p>
        <ol className="flex flex-col gap-3 border-l border-border pl-4">
          <li className="text-sm">
            <p className="text-ink-2">
              Raised by <span className="font-medium">{expenseRequest.employee.fullName}</span>
            </p>
            <p className="text-xs text-muted">{dateTimeFormatter.format(new Date(expenseRequest.createdAt))}</p>
          </li>
          <li className="text-sm">
            {expenseRequest.managerDecidedAt ? (
              <>
                <p className="text-ink-2">
                  Reviewed by reporting manager{' '}
                  <span className="font-medium">{expenseRequest.approverManager.fullName}</span>
                </p>
                <p className="text-xs text-muted">{dateTimeFormatter.format(new Date(expenseRequest.managerDecidedAt))}</p>
                {expenseRequest.managerDecisionNote && (
                  <p className="mt-1 text-xs text-ink-2">"{expenseRequest.managerDecisionNote}"</p>
                )}
              </>
            ) : (
              <p className="text-ink-2">
                Awaiting reporting manager{' '}
                <span className="font-medium">{expenseRequest.approverManager.fullName}</span>
              </p>
            )}
          </li>
          {(expenseRequest.status === 'PENDING_ADMIN' ||
            expenseRequest.status === 'APPROVED' ||
            expenseRequest.status === 'PAYMENT_INITIATED' ||
            expenseRequest.adminDecidedAt) && (
            <li className="text-sm">
              {expenseRequest.adminDecidedAt ? (
                <>
                  <p className="text-ink-2">Reviewed by admin</p>
                  <p className="text-xs text-muted">{dateTimeFormatter.format(new Date(expenseRequest.adminDecidedAt))}</p>
                  {expenseRequest.adminDecisionNote && (
                    <p className="mt-1 text-xs text-ink-2">"{expenseRequest.adminDecisionNote}"</p>
                  )}
                </>
              ) : (
                <p className="text-ink-2">Awaiting admin review</p>
              )}
            </li>
          )}
          {(expenseRequest.status === 'APPROVED' || expenseRequest.status === 'PAYMENT_INITIATED') && (
            <li className="text-sm">
              {expenseRequest.paymentInitiatedAt ? (
                <>
                  <p className="text-ink-2">Payment initiated</p>
                  <p className="text-xs text-muted">
                    {dateTimeFormatter.format(new Date(expenseRequest.paymentInitiatedAt))}
                  </p>
                </>
              ) : (
                <p className="text-ink-2">Awaiting payment initiation</p>
              )}
            </li>
          )}
        </ol>
      </div>

      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-ink">Bills</p>
          {canUploadBill && (
            <label className="flex cursor-pointer items-center gap-1.5 text-sm text-primary hover:underline">
              <Paperclip className="h-3.5 w-3.5" />
              Attach bill
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ALLOWED_BILL_TYPES.join(',')}
                className="hidden"
                disabled={uploadAttachment.isPending}
                onChange={(event) => handleFilesPicked(event.target.files)}
              />
            </label>
          )}
        </div>
        {attachmentError && <p className="mb-2 text-sm text-error">{attachmentError}</p>}
        {attachments.length === 0 ? (
          <p className="text-sm text-muted">No bills attached.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {attachments.map((attachment) => (
              <li
                key={attachment.id}
                className="flex items-center justify-between rounded-md border border-border bg-white px-3 py-2"
              >
                <a
                  href={expenseAttachmentDownloadUrl(expenseId, attachment.id)}
                  className="truncate text-sm text-primary hover:underline"
                >
                  {attachment.fileName}
                </a>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-xs text-muted">{formatFileSize(attachment.fileSize)}</span>
                  {canDeleteBills && (
                    <button
                      type="button"
                      onClick={() => handleDeleteAttachment(attachment.id)}
                      disabled={deletingAttachmentId === attachment.id}
                      aria-label={`Remove ${attachment.fileName}`}
                      className="rounded p-1 text-error hover:bg-row-hover disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {canCancel && (
        <div>
          <Button
            variant="secondary"
            fullWidth={false}
            isLoading={cancelExpenseRequest.isPending}
            onClick={() => cancelExpenseRequest.mutate(expenseId)}
          >
            Cancel request
          </Button>
          {cancelExpenseRequest.isError && (
            <p className="mt-2 text-sm text-error">
              {errorMessage(cancelExpenseRequest.error, 'Could not cancel the request.')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
