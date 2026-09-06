import {
  Children,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
  type SelectHTMLAttributes,
} from 'react'
import { ChevronDown } from 'lucide-react'

interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  errorMessage?: string
  ref?: Ref<HTMLSelectElement>
  // 'up' for a field that sits near the bottom of a short container (e.g. a
  // modal) — opening downward there would extend past the container's own
  // bottom edge and, since that overflow still counts toward a scrollable
  // ancestor's height, visibly inflate/scroll the whole container.
  openDirection?: 'down' | 'up'
}

interface SelectOption {
  value: string
  label: string
  disabled: boolean
}

// Pulls {value, label} pairs out of plain <option> children so callers keep
// writing FormSelect exactly like a native <select> (map over data, render
// <option>s) without knowing a custom listbox renders underneath.
function optionsFromChildren(children: ReactNode): SelectOption[] {
  const options: SelectOption[] = []
  Children.forEach(children, (child) => {
    if (isValidElement<{ value?: string; children?: ReactNode; disabled?: boolean }>(child) && child.type === 'option') {
      options.push({
        value: String(child.props.value ?? ''),
        label: typeof child.props.children === 'string' ? child.props.children : String(child.props.value ?? ''),
        disabled: Boolean(child.props.disabled),
      })
    }
  })
  return options
}

// A real <select> stays mounted (visually hidden) purely so react-hook-form's
// register() — ref, name, onChange, onBlur — keeps working unchanged; the
// visible trigger + listbox on top is what actually renders and gets styled.
// Selecting a custom option writes through the native element's value setter
// and dispatches a real "change" event so register()'s onChange still fires.
export function FormSelect({
  label,
  errorMessage,
  id,
  className,
  children,
  value,
  defaultValue,
  onChange,
  onBlur,
  disabled,
  name,
  ref,
  openDirection = 'down',
  ...rest
}: FormSelectProps) {
  const selectRef = useRef<HTMLSelectElement | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const [internalValue, setInternalValue] = useState(String(value ?? defaultValue ?? ''))

  const options = useMemo(() => optionsFromChildren(children), [children])

  // Controlled usage (a `value` prop, e.g. a plain useState filter) stays in
  // sync; register()'d usage never passes `value`, so this is a no-op there.
  useEffect(() => {
    if (value !== undefined) setInternalValue(String(value))
  }, [value])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function setNativeRef(node: HTMLSelectElement | null) {
    selectRef.current = node
    if (typeof ref === 'function') ref(node)
    else if (ref) ref.current = node
  }

  function commitValue(optionValue: string) {
    const nativeSelect = selectRef.current
    if (nativeSelect) {
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value')?.set
      nativeSetter?.call(nativeSelect, optionValue)
      nativeSelect.dispatchEvent(new Event('change', { bubbles: true }))
    }
    setInternalValue(optionValue)
    setIsOpen(false)
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
        setHighlightedIndex(Math.max(0, options.findIndex((option) => option.value === internalValue)))
        return
      }
      const direction = event.key === 'ArrowDown' ? 1 : -1
      setHighlightedIndex((current) => (current + direction + options.length) % options.length)
    } else if (event.key === 'Enter' || event.key === ' ') {
      if (isOpen) {
        event.preventDefault()
        const option = options[highlightedIndex]
        if (option && !option.disabled) commitValue(option.value)
      }
    } else if (event.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const selectedOption = options.find((option) => option.value === internalValue)

  return (
    <div className="mb-4" ref={containerRef}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-ink-2">
        {label}
      </label>
      <div className="relative">
        <select
          ref={setNativeRef}
          id={id}
          name={name}
          value={internalValue}
          disabled={disabled}
          onChange={(event) => {
            setInternalValue(event.target.value)
            onChange?.(event)
          }}
          onBlur={onBlur}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          {...rest}
        >
          {children}
        </select>
        <button
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          onClick={() => {
            setIsOpen((current) => !current)
            setHighlightedIndex(Math.max(0, options.findIndex((option) => option.value === internalValue)))
          }}
          onKeyDown={handleTriggerKeyDown}
          className={`flex w-full items-center justify-between gap-2 rounded-md border bg-white px-3 py-1.5 text-left text-ink-2 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-50 ${
            errorMessage ? 'border-error' : 'border-border'
          } ${className ?? ''}`}
        >
          <span className={`truncate ${selectedOption ? '' : 'text-muted'}`}>{selectedOption?.label ?? ''}</span>
          <ChevronDown className={`h-4 w-4 shrink-0 text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {isOpen && (
          <ul
            role="listbox"
            tabIndex={-1}
            className={`absolute z-10 max-h-60 w-full overflow-y-auto rounded-md border border-border bg-white py-1 shadow-sm ${
              openDirection === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'
            }`}
          >
            {options.map((option, index) => (
              <li
                key={option.value}
                role="option"
                aria-selected={option.value === internalValue}
                onMouseEnter={() => setHighlightedIndex(index)}
                onClick={() => !option.disabled && commitValue(option.value)}
                className={`cursor-pointer px-3 py-1.5 text-sm ${option.disabled ? 'cursor-not-allowed opacity-50' : ''} ${
                  option.value === internalValue
                    ? 'bg-active-pill-bg font-medium text-active-pill-ink'
                    : index === highlightedIndex
                      ? 'bg-row-hover text-ink-2'
                      : 'text-ink-2'
                }`}
              >
                {option.label}
              </li>
            ))}
          </ul>
        )}
      </div>
      {errorMessage && <p className="mt-1 text-sm text-error">{errorMessage}</p>}
    </div>
  )
}
