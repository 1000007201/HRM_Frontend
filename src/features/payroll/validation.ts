import { z } from 'zod'
import { LOP_BASES, TAX_REGIMES } from './types'

export const createPayrollRunFormSchema = z.object({
  month: z.number('Select a month').int().min(1).max(12),
  year: z.number('Enter a year').int().min(2000),
})

export type CreatePayrollRunFormValues = z.infer<typeof createPayrollRunFormSchema>

export const payrollSettingsFormSchema = z.object({
  pfEnabled: z.boolean(),
  pfCeiling: z.boolean(),
  esiEnabled: z.boolean(),
  ptEnabled: z.boolean(),
  ptState: z.string().optional().or(z.literal('')),
  lopBasis: z.enum(LOP_BASES),
})

export type PayrollSettingsFormValues = z.infer<typeof payrollSettingsFormSchema>

// Mirrors the backend's upsertSchema (taxDeclaration.routes.ts) — old-regime
// fields stay optional here even under OLD; the backend clears them to null
// under NEW regardless of what's submitted (see upsertTaxDeclaration).
export const taxDeclarationFormSchema = z.object({
  regime: z.enum(TAX_REGIMES),
  previousEmployerIncome: z.number().min(0).optional(),
  previousEmployerTds: z.number().min(0).optional(),
  section80C: z.number().min(0).max(150000, 'Section 80C cannot exceed ₹1,50,000').optional(),
  section80D: z.number().min(0).optional(),
  hraExemption: z.number().min(0).optional(),
  otherDeductions: z.number().min(0).optional(),
})

export type TaxDeclarationFormValues = z.infer<typeof taxDeclarationFormSchema>
