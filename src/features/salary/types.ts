export const COMPONENT_TYPES = ['EARNING', 'EMPLOYEE_DEDUCTION', 'EMPLOYER_CONTRIBUTION'] as const
export type ComponentType = (typeof COMPONENT_TYPES)[number]

export const CALC_TYPES = ['FIXED', 'PERCENTAGE', 'BALANCE'] as const
export type CalcType = (typeof CALC_TYPES)[number]

export const COMPONENT_TYPE_LABELS: Record<ComponentType, string> = {
  EARNING: 'Earning',
  EMPLOYEE_DEDUCTION: 'Employee deduction',
  EMPLOYER_CONTRIBUTION: 'Employer contribution',
}

export const CALC_TYPE_LABELS: Record<CalcType, string> = {
  FIXED: 'Fixed',
  PERCENTAGE: 'Percentage',
  BALANCE: 'Balance',
}

// fixedAmount/percentage come over the wire as strings (Prisma Decimal
// serializes via toJSON to a decimal string, not a number) — same convention
// as LeaveType.accrualPerMonth.
export interface SalaryComponent {
  id: string
  organizationId: string
  name: string
  code: string
  componentType: ComponentType
  calcType: CalcType
  fixedAmount: string | null
  percentage: string | null
  baseComponentId: string | null
  sequence: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateSalaryComponentInput {
  name: string
  code: string
  componentType: ComponentType
  calcType: CalcType
  fixedAmount?: number
  percentage?: number
  baseComponentId?: string
  sequence: number
}

export interface UpdateSalaryComponentInput {
  name?: string
  code?: string
  componentType?: ComponentType
  calcType?: CalcType
  fixedAmount?: number | null
  percentage?: number | null
  baseComponentId?: string | null
  sequence?: number
  isActive?: boolean
}

// monthlyAmount/annualAmount are the RESOLVED, frozen-at-submission amounts
// (see the SalaryStructureComponent model comment in schema.prisma) — not
// recomputed from the live component rulebook.
export interface SalaryStructureComponent {
  id: string
  structureId: string
  componentId: string
  monthlyAmount: string
  annualAmount: string
  component: SalaryComponent
}

// effectiveTo: null marks the single currently-active structure.
export interface SalaryStructure {
  id: string
  organizationId: string
  employeeId: string
  annualCtc: string
  effectiveFrom: string
  effectiveTo: string | null
  createdAt: string
  updatedAt: string
  components: SalaryStructureComponent[]
}

export interface CreateSalaryStructureComponentInput {
  componentId: string
  monthlyAmount: number
  annualAmount: number
}

export interface CreateSalaryStructureInput {
  annualCtc: number
  effectiveFrom: string
  components: CreateSalaryStructureComponentInput[]
}
