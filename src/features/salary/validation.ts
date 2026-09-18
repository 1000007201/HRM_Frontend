import { z } from 'zod'
import { CALC_TYPES, COMPONENT_TYPES } from './types'

// Mirrors the backend's codeSchema (salaryComponents.routes.ts) — transformed
// to uppercase before the pattern check so the user can type either case; the
// `uppercase` class on the input gives the same feedback visually as they type.
const codeSchema = z
  .string()
  .trim()
  .min(1, 'Code is required')
  .max(50)
  .transform((value) => value.toUpperCase())
  .pipe(z.string().regex(/^[A-Z0-9_]+$/, 'Use letters, numbers, and underscores only'))

// Mirrors assertValidCalcTypeShape in the backend's
// salaryComponents.service.ts — which of fixedAmount/percentage/baseComponentId
// is required depends on the chosen calcType.
export const salaryComponentFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(200),
    code: codeSchema,
    componentType: z.enum(COMPONENT_TYPES),
    calcType: z.enum(CALC_TYPES),
    fixedAmount: z.number().positive('Enter an amount greater than zero').optional(),
    percentage: z
      .number()
      .positive('Enter a percentage greater than zero')
      .max(100, 'Percentage cannot exceed 100')
      .optional(),
    baseComponentId: z.string().optional(),
    sequence: z.number('Enter a sequence number').int('Sequence must be a whole number').positive('Sequence must be positive'),
  })
  .superRefine((values, ctx) => {
    if (values.calcType === 'FIXED' && values.fixedAmount === undefined) {
      ctx.addIssue({ code: 'custom', path: ['fixedAmount'], message: 'Fixed amount is required' })
    }
    if (values.calcType === 'PERCENTAGE') {
      if (values.percentage === undefined) {
        ctx.addIssue({ code: 'custom', path: ['percentage'], message: 'Percentage is required' })
      }
      if (!values.baseComponentId) {
        ctx.addIssue({ code: 'custom', path: ['baseComponentId'], message: 'Select a base component' })
      }
    }
  })

export type SalaryComponentFormValues = z.infer<typeof salaryComponentFormSchema>

export const salaryStructureFormSchema = z.object({
  annualCtc: z.number('Enter the annual CTC').positive('CTC must be greater than zero'),
  effectiveFrom: z.string().min(1, 'Effective date is required'),
})

export type SalaryStructureFormValues = z.infer<typeof salaryStructureFormSchema>
