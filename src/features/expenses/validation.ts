import { z } from 'zod'

// Local calendar day as "YYYY-MM-DD" — toISOString() would shift to UTC and
// hand back yesterday for anyone east of Greenwich late in the evening.
export function todayIsoDate(): string {
  return new Date().toLocaleDateString('en-CA')
}

// Currency isn't a static client-side enum — it comes from GET /currencies
// (server-driven, so a new supported currency needs no frontend change) — so
// this only checks a value was picked, not which one. The backend is still
// the source of truth and re-validates against the real supported list.
export const raiseExpenseFormSchema = z.object({
  expenseTypeId: z.string().min(1, 'Select an expense type'),
  approverManagerId: z.string().min(1, 'Select a reporting manager'),
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  // <input type="date"> yields "YYYY-MM-DD" or '' — the backend re-checks
  // "not in the future" too, this is just the inline message.
  expenseDate: z
    .string()
    .min(1, 'Select the date of the expense')
    .refine((value) => value <= todayIsoDate(), 'The expense date cannot be in the future'),
  amount: z.number('Enter an amount').positive('Amount must be greater than zero'),
  currency: z.string().min(1, 'Select a currency'),
})
export type RaiseExpenseFormValues = z.infer<typeof raiseExpenseFormSchema>

export const expenseTypeFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
})
export type ExpenseTypeFormValues = z.infer<typeof expenseTypeFormSchema>
