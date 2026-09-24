import { formatInr } from '../expenses/display'
import type { SalaryComponent } from './types'

// "Value" column on the components table — the base component's own name has
// to come from the caller since a SalaryComponent only carries baseComponentId.
export function describeComponentValue(component: SalaryComponent, baseComponentName: string | undefined): string {
  if (component.calcType === 'FIXED') {
    return `${formatInr(component.fixedAmount ?? 0)} / yr`
  }
  if (component.calcType === 'PERCENTAGE') {
    return `${component.percentage}% of ${baseComponentName ?? 'annual CTC'}`
  }
  return 'Remaining balance'
}
