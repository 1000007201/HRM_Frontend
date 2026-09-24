import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { Paperclip, X } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { FormInput } from '../../components/ui/FormInput'
import { FormSelect } from '../../components/ui/FormSelect'
import { LoadingState } from '../../components/ui/Spinner'
import { errorMessage } from '../../lib/apiClient'
import { uploadExpenseAttachment } from '../../features/expenses/api'
import {
  useApprovers,
  useCreateExpenseRequest,
  useCurrencies,
  useCurrencyRate,
  useExpenseTypes,
} from '../../features/expenses/hooks'
import { raiseExpenseFormSchema, todayIsoDate, type RaiseExpenseFormValues } from '../../features/expenses/validation'
import { formatInr } from '../../features/expenses/display'

const ALLOWED_BILL_TYPES = ['application/pdf', 'image/jpeg', 'image/png']

// Debounces the currency dropdown before asking the backend for a rate —
// typing in the amount field never re-triggers this (the rate endpoint
// doesn't take an amount), so the only thing worth debouncing is a fast
// sequence of dropdown changes.
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timeout)
  }, [value, delayMs])
  return debounced
}

function BillPicker({ files, onChange }: { files: File[]; onChange: (files: File[]) => void }) {
  return (
    <div className="mb-4">
      <span className="mb-1 block text-sm font-medium text-ink-2">Bills (optional)</span>
      <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-sm text-ink-2 hover:bg-row-hover">
        <Paperclip className="h-4 w-4 shrink-0 text-muted" />
        Attach one or more bills (PDF, JPEG or PNG)
        <input
          type="file"
          multiple
          accept={ALLOWED_BILL_TYPES.join(',')}
          className="hidden"
          onChange={(event) => {
            const picked = Array.from(event.target.files ?? [])
            onChange([...files, ...picked])
            event.target.value = ''
          }}
        />
      </label>
      {files.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1">
          {files.map((file, index) => (
            <li key={`${file.name}-${index}`} className="flex items-center justify-between rounded-md bg-canvas px-3 py-1.5 text-sm text-ink-2">
              <span className="truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => onChange(files.filter((_, fileIndex) => fileIndex !== index))}
                aria-label={`Remove ${file.name}`}
                className="shrink-0 rounded p-1 text-muted hover:bg-row-hover hover:text-ink-2"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function RaiseExpensePage() {
  const navigate = useNavigate()
  const { data: expenseTypesData, isPending: isExpenseTypesPending, isError: isExpenseTypesError } = useExpenseTypes()
  const { data: currenciesData, isPending: isCurrenciesPending, isError: isCurrenciesError } = useCurrencies()
  const { data: approversData, isPending: isApproversPending, isError: isApproversError } = useApprovers()
  const createExpenseRequest = useCreateExpenseRequest()
  const [serverError, setServerError] = useState('')
  const [billFiles, setBillFiles] = useState<File[]>([])
  // Expenses saved without leaving the page, so someone filing a trip's worth
  // of bills can see what already went in.
  const [savedExpenses, setSavedExpenses] = useState<{ id: string; title: string }[]>([])

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RaiseExpenseFormValues>({
    resolver: zodResolver(raiseExpenseFormSchema),
    defaultValues: {
      expenseTypeId: '',
      approverManagerId: '',
      title: '',
      description: '',
      // Most expenses are filed the day they're incurred — prefill today and
      // let the rare backdated bill be corrected.
      expenseDate: todayIsoDate(),
      // react-hook-form has no numeric input value until typed; the schema
      // still requires a positive number, so an untouched field fails
      // validation with a clear message rather than silently submitting 0.
      amount: 0,
      currency: 'INR',
    },
  })

  const amount = watch('amount')
  const currency = watch('currency')
  const debouncedCurrency = useDebouncedValue(currency, 300)
  const isForeignCurrency = debouncedCurrency !== '' && debouncedCurrency !== 'INR'
  const rateQuery = useCurrencyRate(debouncedCurrency, isForeignCurrency)

  const numericAmount = Number(amount)
  const previewAmountInInr =
    isForeignCurrency && rateQuery.data && Number.isFinite(numericAmount) && numericAmount > 0
      ? numericAmount * Number(rateQuery.data.inrPerUnit)
      : null

  async function handleFormSubmit(values: RaiseExpenseFormValues, shouldAddAnother: boolean) {
    setServerError('')
    try {
      const { expenseRequest } = await createExpenseRequest.mutateAsync({
        expenseTypeId: values.expenseTypeId,
        approverManagerId: values.approverManagerId,
        title: values.title,
        description: values.description || undefined,
        expenseDate: values.expenseDate,
        amount: values.amount,
        currency: values.currency,
      })

      if (billFiles.length > 0) {
        const uploadResults = await Promise.allSettled(
          billFiles.map((file) => uploadExpenseAttachment(expenseRequest.id, file)),
        )
        const failedCount = uploadResults.filter((result) => result.status === 'rejected').length
        if (failedCount > 0) {
          // The expense itself was created fine — only some bills failed to
          // attach. Land on the detail page (not My Expenses) so the user
          // can see which bills made it and retry the rest from there.
          navigate(`/expenses/${expenseRequest.id}`, { replace: true })
          return
        }
      }

      if (shouldAddAnother) {
        setSavedExpenses((current) => [...current, { id: expenseRequest.id, title: values.title }])
        setBillFiles([])
        // Type, manager and currency usually repeat across a batch — only the
        // per-expense fields are cleared.
        reset({ ...values, title: '', description: '', amount: 0 })
        return
      }

      navigate('/expenses', { replace: true })
    } catch (error) {
      setServerError(errorMessage(error, 'Could not submit the expense. Please try again.'))
    }
  }

  if (isExpenseTypesPending || isCurrenciesPending || isApproversPending) {
    return <LoadingState />
  }

  if (isExpenseTypesError || isCurrenciesError || isApproversError) {
    return <p className="text-sm text-error">Could not load the expense form. Please try again.</p>
  }

  return (
    <div className="max-w-lg">
      <Link to="/expenses" className="mb-4 inline-block text-sm text-primary hover:underline">
        ← Back to my expenses
      </Link>
      <h1 className="mb-6 text-lg font-semibold text-ink">Raise an expense</h1>
      {savedExpenses.length > 0 && (
        <div className="mb-4 rounded-md border border-border bg-canvas px-3 py-2 text-sm text-ink-2">
          <p className="mb-1 font-medium text-ink">Added so far ({savedExpenses.length})</p>
          <ul className="flex flex-col gap-1">
            {savedExpenses.map((savedExpense) => (
              <li key={savedExpense.id}>
                <Link to={`/expenses/${savedExpense.id}`} className="text-primary hover:underline">
                  {savedExpense.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      <form onSubmit={handleSubmit((values) => handleFormSubmit(values, false))}>
        {serverError && (
          <p className="mb-4 rounded-md border border-error bg-error-bg px-3 py-2 text-sm text-error">{serverError}</p>
        )}
        <FormSelect
          id="expenseTypeId"
          label="Expense type"
          disabled={isSubmitting}
          errorMessage={errors.expenseTypeId?.message}
          {...register('expenseTypeId')}
        >
          <option value="">Select an expense type</option>
          {expenseTypesData.expenseTypes.map((expenseType) => (
            <option key={expenseType.id} value={expenseType.id}>
              {expenseType.name}
            </option>
          ))}
        </FormSelect>
        <FormInput
          id="title"
          label="Title"
          placeholder="Client visit taxi fare"
          disabled={isSubmitting}
          errorMessage={errors.title?.message}
          {...register('title')}
        />
        <FormInput
          id="expenseDate"
          label="Date of expense"
          type="date"
          max={todayIsoDate()}
          disabled={isSubmitting}
          errorMessage={errors.expenseDate?.message}
          {...register('expenseDate')}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            id="amount"
            label="Amount"
            type="number"
            step="0.01"
            min={0}
            disabled={isSubmitting}
            errorMessage={errors.amount?.message}
            {...register('amount', { valueAsNumber: true })}
          />
          <FormSelect
            id="currency"
            label="Currency"
            disabled={isSubmitting}
            errorMessage={errors.currency?.message}
            {...register('currency')}
          >
            {currenciesData.currencies.map((currencyOption) => (
              <option key={currencyOption.code} value={currencyOption.code}>
                {`${currencyOption.code} — ${currencyOption.name}`}
              </option>
            ))}
          </FormSelect>
        </div>
        {isForeignCurrency && (
          <p className="-mt-2 mb-4 text-sm text-muted">
            {rateQuery.isPending && 'Looking up today’s rate...'}
            {rateQuery.isError && 'Could not fetch a live rate — the exact amount is calculated when you submit.'}
            {previewAmountInInr !== null && (
              <>
                ≈ <span className="font-medium text-ink">{formatInr(previewAmountInInr)}</span> at today's rate — the
                exact amount is finalized when you submit
              </>
            )}
          </p>
        )}
        <FormSelect
          id="approverManagerId"
          label="Reporting manager"
          disabled={isSubmitting}
          errorMessage={errors.approverManagerId?.message}
          {...register('approverManagerId')}
        >
          <option value="">Select a reporting manager</option>
          {approversData.approvers.map((approver) => (
            <option key={approver.id} value={approver.id}>
              {`${approver.fullName}${approver.designation ? ` — ${approver.designation}` : ''}`}
            </option>
          ))}
        </FormSelect>
        <div className="mb-4">
          <label htmlFor="description" className="mb-1 block text-sm font-medium text-ink-2">
            Description (optional)
          </label>
          <textarea
            id="description"
            rows={3}
            disabled={isSubmitting}
            className="w-full rounded-md border border-border px-3 py-2 text-ink-2 placeholder:text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            {...register('description')}
          />
          {errors.description && <p className="mt-1 text-sm text-error">{errors.description.message}</p>}
        </div>
        <BillPicker files={billFiles} onChange={setBillFiles} />
        <div className="flex gap-2">
          <Button type="submit" fullWidth={false} isLoading={isSubmitting}>
            {savedExpenses.length > 0 ? 'Submit and finish' : 'Submit request'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            fullWidth={false}
            disabled={isSubmitting}
            onClick={handleSubmit((values) => handleFormSubmit(values, true))}
          >
            Save and add another
          </Button>
        </div>
      </form>
    </div>
  )
}
