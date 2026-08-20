import { z } from 'zod'
import { ATTENDANCE_STATUSES, MARKABLE_ATTENDANCE_STATUSES, REGULARIZATION_TYPES } from './types'

// Mirrors createRegularizationSchema (backend src/routes/regularizations.ts):
// reason required, and at least one of the three "requested" fields — a
// request that asks for nothing is meaningless.
export const regularizationFormSchema = z
  .object({
    date: z.string().min(1, 'Date is required'),
    type: z.enum(REGULARIZATION_TYPES),
    requestedCheckInTime: z.string(),
    requestedCheckOutTime: z.string(),
    requestedStatus: z.enum(ATTENDANCE_STATUSES).or(z.literal('')),
    reason: z.string().trim().min(1, 'Reason is required').max(500),
  })
  .refine(
    (values) =>
      values.requestedCheckInTime !== '' || values.requestedCheckOutTime !== '' || values.requestedStatus !== '',
    {
      message: 'Request at least one change — a check-in time, a check-out time, or a status',
      path: ['requestedStatus'],
    },
  )

export type RegularizationFormValues = z.infer<typeof regularizationFormSchema>

// Mirrors markAttendanceSchema: at least one of status/checkInAt/checkOutAt.
export const markAttendanceFormSchema = z
  .object({
    status: z.enum(MARKABLE_ATTENDANCE_STATUSES).or(z.literal('')),
    checkInTime: z.string(),
    checkOutTime: z.string(),
    note: z.string().trim().max(500),
  })
  .refine((values) => values.status !== '' || values.checkInTime !== '' || values.checkOutTime !== '', {
    message: 'Set a status, a check-in time, or a check-out time',
    path: ['status'],
  })

export type MarkAttendanceFormValues = z.infer<typeof markAttendanceFormSchema>
