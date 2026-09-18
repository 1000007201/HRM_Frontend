import { apiFetch } from '../../lib/apiClient'
import type {
  CreateSalaryComponentInput,
  CreateSalaryStructureInput,
  SalaryComponent,
  SalaryStructure,
  UpdateSalaryComponentInput,
} from './types'

export function listSalaryComponents() {
  return apiFetch<{ salaryComponents: SalaryComponent[] }>('/api/salary-components')
}

export function createSalaryComponent(input: CreateSalaryComponentInput) {
  return apiFetch<{ salaryComponent: SalaryComponent }>('/api/salary-components', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateSalaryComponent(id: string, input: UpdateSalaryComponentInput) {
  return apiFetch<{ salaryComponent: SalaryComponent }>(`/api/salary-components/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

// Soft-delete — the backend just flips isActive: false (see
// deactivateSalaryComponent in the backend's salaryComponents.service.ts).
export function deactivateSalaryComponent(id: string) {
  return apiFetch<{ salaryComponent: SalaryComponent }>(`/api/salary-components/${id}`, { method: 'DELETE' })
}

export function getEmployeeSalaryStructure(employeeId: string) {
  return apiFetch<{ structure: SalaryStructure }>(`/api/employees/${employeeId}/salary-structure`)
}

export function listSalaryStructureHistory(employeeId: string) {
  return apiFetch<{ structures: SalaryStructure[] }>(`/api/employees/${employeeId}/salary-structure/history`)
}

export function createSalaryStructure(employeeId: string, input: CreateSalaryStructureInput) {
  return apiFetch<{ structure: SalaryStructure }>(`/api/employees/${employeeId}/salary-structure`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}
