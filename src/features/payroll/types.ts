import type { ComponentType } from '../salary/types'

export const PAYROLL_RUN_STATUSES = ['DRAFT', 'PROCESSING', 'REVIEW', 'APPROVED', 'PAID', 'CANCELLED'] as const
export type PayrollRunStatus = (typeof PAYROLL_RUN_STATUSES)[number]

export const LOP_BASES = ['CALENDAR_DAYS', 'WORKING_DAYS'] as const
export type LopBasis = (typeof LOP_BASES)[number]

export const TAX_REGIMES = ['OLD', 'NEW'] as const
export type TaxRegime = (typeof TAX_REGIMES)[number]

export interface PayrollSettings {
  id: string
  organizationId: string
  pfEnabled: boolean
  pfCeiling: boolean
  esiEnabled: boolean
  ptEnabled: boolean
  ptState: string | null
  lopBasis: LopBasis
  createdAt: string
  updatedAt: string
}

export interface UpdatePayrollSettingsInput {
  pfEnabled?: boolean
  pfCeiling?: boolean
  esiEnabled?: boolean
  ptEnabled?: boolean
  ptState?: string | null
  lopBasis?: LopBasis
}

// totalGross/totalDeductions/totalNet/totalEmployerCost come over the wire
// as strings (Prisma Decimal), and are null until the run has been
// processed at least once — same convention as SalaryStructure's fields.
export interface PayrollRun {
  id: string
  organizationId: string
  month: number
  year: number
  status: PayrollRunStatus
  totalGross: string | null
  totalDeductions: string | null
  totalNet: string | null
  totalEmployerCost: string | null
  processedAt: string | null
  approvedAt: string | null
  approvedById: string | null
  paidAt: string | null
  cancelledAt: string | null
  createdAt: string
  updatedAt: string
  _count: { payslips: number }
}

export interface PayrollRunListResult {
  payrollRuns: PayrollRun[]
  page: number
  pageSize: number
  total: number
}

export interface CreatePayrollRunInput {
  month: number
  year: number
}

export interface PayslipComponent {
  id: string
  payslipId: string
  componentId: string | null
  name: string
  componentType: ComponentType
  amount: string
}

// The row shape returned by the run's payslip list (admin) — no components,
// just the employee summary needed for a table.
export interface PayslipListItem {
  id: string
  payrollRunId: string
  employeeId: string
  daysInMonth: number
  lopDays: number
  paidDays: number
  grossEarnings: string
  totalDeductions: string
  netPay: string
  employerCost: string
  createdAt: string
  employee: { id: string; fullName: string; employeeCode: string | null }
}

// The row shape returned by an employee's own payslip history — no
// `employee` (the caller already knows who they are), but does carry the
// parent run's month/year/status.
export interface EmployeePayslipListItem {
  id: string
  payrollRunId: string
  employeeId: string
  daysInMonth: number
  lopDays: number
  paidDays: number
  grossEarnings: string
  totalDeductions: string
  netPay: string
  employerCost: string
  createdAt: string
  payrollRun: { month: number; year: number; status: PayrollRunStatus }
}

// The full single-payslip shape (GET .../payslips/:id) — components plus a
// richer employee projection and the parent run summary.
export interface Payslip {
  id: string
  payrollRunId: string
  employeeId: string
  daysInMonth: number
  lopDays: number
  paidDays: number
  grossEarnings: string
  totalDeductions: string
  netPay: string
  employerCost: string
  createdAt: string
  components: PayslipComponent[]
  employee: { id: string; fullName: string; employeeCode: string | null; designation: string | null; department: { name: string } | null }
  payrollRun: { month: number; year: number; status: PayrollRunStatus }
}

export interface EmployeeTaxDeclaration {
  id: string
  organizationId: string
  employeeId: string
  financialYear: string
  regime: TaxRegime
  previousEmployerIncome: string | null
  previousEmployerTds: string | null
  section80C: string | null
  section80D: string | null
  hraExemption: string | null
  otherDeductions: string | null
  createdAt: string
  updatedAt: string
}

export interface UpsertTaxDeclarationInput {
  financialYear?: string
  regime: TaxRegime
  previousEmployerIncome?: number
  previousEmployerTds?: number
  section80C?: number
  section80D?: number
  hraExemption?: number
  otherDeductions?: number
}
