import { z } from 'zod'

// Mirrors the backend's createLeaveRequestSchema (src/routes/leaveRequests.ts)
// as a client-side guardrail; the backend is still the source of truth and is
// re-validated on submit regardless.
export const applyLeaveFormSchema = z
  .object({
    leaveTypeId: z.string().min(1, 'Select a leave type'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    isHalfDay: z.boolean(),
    reason: z.string().trim().max(500).optional().or(z.literal('')),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'End date must be on or after the start date',
    path: ['endDate'],
  })
  .refine((data) => !data.isHalfDay || data.startDate === data.endDate, {
    message: 'Half-day is only valid for a single-day request',
    path: ['isHalfDay'],
  })

export type ApplyLeaveFormValues = z.infer<typeof applyLeaveFormSchema>
