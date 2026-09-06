import { useState } from 'react'
import { Button } from './Button'
import { errorMessage } from '../../lib/apiClient'

// Structural rather than react-query's UseMutationResult, so this component
// stays free of react-query generics — any object with these four members
// fits, which is exactly what useApprove*/useReject* return.
export interface DecisionMutation {
  mutateAsync: (variables: { id: string; decisionNote?: string }) => Promise<unknown>
  isPending: boolean
  isError: boolean
  error: unknown
}

interface DecisionActionsProps {
  requestId: string
  approveMutation: DecisionMutation
  rejectMutation: DecisionMutation
}

// The Approve/Reject pair plus the optional decision-note step, shared by the
// leave and attendance-regularization approver queues. Both backends take the
// same { id, decisionNote } shape, so the only per-queue difference is which
// mutations get passed in.
export function DecisionActions({ requestId, approveMutation, rejectMutation }: DecisionActionsProps) {
  const [pendingKind, setPendingKind] = useState<'approve' | 'reject' | null>(null)
  const [decisionNote, setDecisionNote] = useState('')

  // Each row renders its own DecisionActions, so the open/closed state is
  // already per-row — no need to track which request is being acted on.
  const mutation = pendingKind === 'reject' ? rejectMutation : approveMutation

  function startDecision(kind: 'approve' | 'reject') {
    setPendingKind(kind)
    setDecisionNote('')
  }

  async function confirmDecision() {
    if (!pendingKind) return
    const chosen = pendingKind === 'approve' ? approveMutation : rejectMutation
    try {
      await chosen.mutateAsync({ id: requestId, decisionNote: decisionNote.trim() || undefined })
      setPendingKind(null)
    } catch {
      // surfaced below via mutation.isError
    }
  }

  if (pendingKind === null) {
    return (
      <div className="flex justify-end gap-2">
        <Button variant="secondary" fullWidth={false} onClick={() => startDecision('reject')}>
          Reject
        </Button>
        <Button fullWidth={false} onClick={() => startDecision('approve')}>
          Approve
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <textarea
        rows={2}
        placeholder="Decision note (optional)"
        value={decisionNote}
        onChange={(event) => setDecisionNote(event.target.value)}
        className="w-56 rounded-md border border-border px-2 py-1 text-sm text-ink-2 placeholder:text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
      />
      {mutation.isError && <p className="text-xs text-error">{errorMessage(mutation.error, 'Action failed.')}</p>}
      <div className="flex gap-2">
        <Button variant="secondary" fullWidth={false} onClick={() => setPendingKind(null)}>
          Cancel
        </Button>
        <Button fullWidth={false} isLoading={mutation.isPending} onClick={confirmDecision}>
          Confirm {pendingKind}
        </Button>
      </div>
    </div>
  )
}
