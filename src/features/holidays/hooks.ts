import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from './api'
import type { HolidayInput } from './types'

const holidaysKey = (year: number) => ['holidays', year] as const

export function useHolidays(year: number) {
  return useQuery({
    queryKey: holidaysKey(year),
    queryFn: () => api.listHolidays(year),
  })
}

// Every mutation invalidates the whole `holidays` root rather than one year:
// a bulk paste can span years, and re-fetching one extra year's list is a
// cheaper trade than tracking which years a payload touched.
function useInvalidateHolidays() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['holidays'] })
}

export function useCreateHoliday() {
  const invalidateHolidays = useInvalidateHolidays()
  return useMutation({
    mutationFn: (input: HolidayInput) => api.createHoliday(input),
    onSuccess: invalidateHolidays,
  })
}

export function useBulkCreateHolidays() {
  const invalidateHolidays = useInvalidateHolidays()
  return useMutation({
    mutationFn: (holidays: HolidayInput[]) => api.bulkCreateHolidays(holidays),
    onSuccess: invalidateHolidays,
  })
}

export function useDeleteHoliday() {
  const invalidateHolidays = useInvalidateHolidays()
  return useMutation({
    mutationFn: (id: string) => api.deleteHoliday(id),
    onSuccess: invalidateHolidays,
  })
}
