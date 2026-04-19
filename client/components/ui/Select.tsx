import { SelectHTMLAttributes, forwardRef, useId } from 'react'
import { cn } from '@/lib/utils'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, id, ...props }, ref) => {
    const generatedId = useId()
    const selectId = id ?? generatedId

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-ds-text-secondary">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'w-full appearance-none rounded-lg border bg-ds-surface px-4 py-2.5 text-ds-text-primary outline-none transition-all',
            error
              ? 'border-red-500 focus:ring-2 focus:ring-red-500'
              : 'border-ds-border focus:border-ds-accent focus:ring-2 focus:ring-ds-accent/25',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-ds-surface text-ds-text-primary">
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1.5 text-sm text-red-400">{error}</p>}
      </div>
    )
  },
)

Select.displayName = 'Select'
