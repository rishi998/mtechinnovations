import { InputHTMLAttributes, forwardRef, useId } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, type = 'text', id, ...props }, ref) => {
    const generatedId = useId()
    const inputId = id || `input-${generatedId.replace(/:/g, '')}`

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-ds-text-secondary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          id={inputId}
          className={cn(
            'w-full rounded-lg border bg-ds-surface px-4 py-2.5 text-ds-text-primary outline-none transition-all placeholder:text-ds-text-secondary',
            error
              ? 'border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-offset-0'
              : 'border-ds-border focus:border-ds-accent focus:ring-2 focus:ring-ds-accent/25',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm text-red-400">{error}</p>}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-ds-text-secondary">{helperText}</p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
