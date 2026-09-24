// Self-check for the calcType-dependent shape rules. Run with Node's built-in
// TypeScript stripping (no test framework in this repo):
//
//   node src/features/salary/validation.check.ts
import { salaryComponentFormSchema } from './validation.ts'

function check(description: string, condition: boolean): void {
  if (!condition) throw new Error(`FAILED: ${description}`)
}

const percentageComponent = {
  name: 'PF',
  code: 'PF',
  componentType: 'EMPLOYEE_DEDUCTION',
  calcType: 'PERCENTAGE',
  percentage: 2.75,
  baseComponentId: 'component-id',
  sequence: 6,
}

check('accepts a percentage component', salaryComponentFormSchema.safeParse(percentageComponent).success)

// An empty number input reads back as NaN, so a fixedAmount abandoned by
// switching calcType used to fail validation on an unmounted field — the form
// then refused to submit with nothing on screen to explain why. The form sets
// shouldUnregister so the stale value never reaches the schema.
check(
  'a leftover NaN fixedAmount still fails',
  !salaryComponentFormSchema.safeParse({ ...percentageComponent, fixedAmount: NaN }).success,
)

check(
  'reads an empty base as a percentage of the annual CTC',
  salaryComponentFormSchema.safeParse({ ...percentageComponent, baseComponentId: '' }).success,
)

const fixedComponent = { name: 'Basic Pay', code: 'BASIC', componentType: 'EARNING', calcType: 'FIXED', sequence: 1 }
check('requires a fixed amount', !salaryComponentFormSchema.safeParse(fixedComponent).success)
check('accepts a fixed component', salaryComponentFormSchema.safeParse({ ...fixedComponent, fixedAmount: 500000 }).success)
check('uppercases the code', salaryComponentFormSchema.safeParse({ ...fixedComponent, code: 'hra', fixedAmount: 1 }).data?.code === 'HRA')

console.log('salary validation: all checks passed')
