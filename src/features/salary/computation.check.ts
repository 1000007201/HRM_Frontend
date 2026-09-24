// Self-check for the three-pass structure maths. Run with Node's built-in
// TypeScript stripping (no test framework in this repo):
//
//   node src/features/salary/computation.check.ts
import { computeLiveSalaryStructure } from './computation.ts'

function check(description: string, condition: boolean): void {
  if (!condition) throw new Error(`FAILED: ${description}`)
}

const ANNUAL_CTC = 1_200_000

// Basic is 50% of the whole CTC (no base component), HRA is 40% of Basic, and
// the balance soaks up whatever is left.
const resolved = computeLiveSalaryStructure(
  ANNUAL_CTC,
  [
    { id: 'basic', sequence: 1, calcType: 'PERCENTAGE', componentType: 'EARNING', percentage: 50 },
    { id: 'hra', sequence: 2, calcType: 'PERCENTAGE', componentType: 'EARNING', percentage: 40, baseComponentId: 'basic' },
    { id: 'special', sequence: 99, calcType: 'BALANCE', componentType: 'EARNING' },
  ],
  {},
)
const annualById = new Map(resolved.map((component) => [component.componentId, component.annualAmount]))

check('a percentage with no base resolves off the annual CTC', annualById.get('basic') === 600_000)
check('a percentage resolves off its base component', annualById.get('hra') === 240_000)
check('the balance takes the remainder', annualById.get('special') === 360_000)
check('earnings still add up to the CTC', resolved.reduce((sum, component) => sum + component.annualAmount, 0) === ANNUAL_CTC)

console.log('salary computation: all checks passed')
