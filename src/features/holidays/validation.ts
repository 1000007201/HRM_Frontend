import { z } from 'zod'

// Mirrors the backend's holidaySchema (src/routes/holidays.ts). The date comes
// from <input type="date">, so it's already a "YYYY-MM-DD" string or empty.
export const holidayFormSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  name: z.string().trim().min(1, 'Holiday name is required').max(200),
})

export type HolidayFormValues = z.infer<typeof holidayFormSchema>
