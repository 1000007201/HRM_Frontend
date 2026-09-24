import type { CalcType, ComponentType } from './types'

// Mirrors computeSalaryStructure in the backend's salaryComputation.ts (same
// three-pass order: FIXED, then PERCENTAGE off an already-resolved base, then
// BALANCE last) so the live preview here matches what the backend expects —
// see that file's comment for why the pass order is safe. The one difference:
// a FIXED component's amount is a caller-supplied override here rather than
// the org rulebook's own `fixedAmount`, since assigning a structure lets HR
// enter a per-employee amount for a FIXED component (e.g. a one-off
// allowance) instead of always taking the org default.
export interface LiveSalaryComponentInput {
  id: string
  sequence: number
  calcType: CalcType
  componentType: ComponentType
  percentage?: number | null
  baseComponentId?: string | null
}

export interface ResolvedLiveSalaryComponent {
  componentId: string
  componentType: ComponentType
  annualAmount: number
  monthlyAmount: number
}

const roundToRupees = (value: number): number => Math.round(value * 100) / 100

export function computeLiveSalaryStructure(
  annualCtc: number,
  components: LiveSalaryComponentInput[],
  fixedAnnualAmountByComponentId: Record<string, number>,
): ResolvedLiveSalaryComponent[] {
  const sortedBySequence = [...components].sort((a, b) => a.sequence - b.sequence)
  const resolvedAnnualById = new Map<string, number>()

  for (const component of sortedBySequence) {
    if (component.calcType === 'FIXED') {
      resolvedAnnualById.set(component.id, fixedAnnualAmountByComponentId[component.id] ?? 0)
    }
  }

  for (const component of sortedBySequence) {
    if (component.calcType === 'PERCENTAGE') {
      // No base component = a percentage of the whole annual CTC (Basic Pay
      // is usually defined this way), which needs no prior resolution.
      const baseAnnual = component.baseComponentId ? (resolvedAnnualById.get(component.baseComponentId) ?? 0) : annualCtc
      resolvedAnnualById.set(component.id, (baseAnnual * (component.percentage ?? 0)) / 100)
    }
  }

  const balanceComponent = sortedBySequence.find((component) => component.calcType === 'BALANCE')
  if (balanceComponent) {
    const othersAnnualTotal = sortedBySequence
      .filter((component) => component.id !== balanceComponent.id)
      .reduce((sum, component) => sum + (resolvedAnnualById.get(component.id) ?? 0), 0)
    resolvedAnnualById.set(balanceComponent.id, annualCtc - othersAnnualTotal)
  }

  return sortedBySequence.map((component) => {
    const annualAmount = roundToRupees(resolvedAnnualById.get(component.id) ?? 0)
    return {
      componentId: component.id,
      componentType: component.componentType,
      annualAmount,
      monthlyAmount: roundToRupees(annualAmount / 12),
    }
  })
}

// Matches the backend's own check in createSalaryStructure (a ₹1 tolerance
// for monthly-amount rounding, not sloppy input) — computed client-side too
// so the form can flag a mismatch before the user submits instead of only
// after a 400 comes back.
export const EARNING_SUM_TOLERANCE_RUPEES = 1

export function earningAnnualTotal(resolved: ResolvedLiveSalaryComponent[]): number {
  return resolved
    .filter((component) => component.componentType === 'EARNING')
    .reduce((sum, component) => sum + component.annualAmount, 0)
}
