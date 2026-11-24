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

export const attendanceSettingsFormSchema = z
  .object({
    fullDayHours: z.number().int().min(0).max(23),
    fullDayMinutes: z.number().int().min(0).max(59),
    halfDayHours: z.number().int().min(0).max(23),
    halfDayMinutes: z.number().int().min(0).max(59),
    weekOffDays: z.array(z.number().int().min(0).max(6)),
    allowRegularization: z.boolean(),
    maxRegularizationsPerMonth: z.number().int().positive().nullable(),
    regularizationWindowDays: z.number().int().positive().nullable(),
  })
  .refine(
    (values) => {
      const fullTotal = values.fullDayHours * 60 + values.fullDayMinutes
      const halfTotal = values.halfDayHours * 60 + values.halfDayMinutes
      return fullTotal > 0 && halfTotal > 0 && halfTotal < fullTotal
    },
    { message: 'Half-day hours must be less than full-day hours, and both must be greater than zero', path: ['halfDayHours'] },
  )

export type AttendanceSettingsFormValues = z.infer<typeof attendanceSettingsFormSchema>
