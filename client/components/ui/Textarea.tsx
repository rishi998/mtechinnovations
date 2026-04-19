import { TextareaHTMLAttributes, forwardRef, useId } from 'react'
import { cn } from '@/lib/utils'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const generatedId = useId()
    const textareaId = id ?? generatedId

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="mb-1.5 block text-sm font-medium text-ds-text-secondary">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'w-full resize-none rounded-lg border bg-ds-surface px-4 py-2.5 text-ds-text-primary outline-none transition-all placeholder:text-ds-text-secondary',
            error
              ? 'border-red-500 focus:ring-2 focus:ring-red-500'
              : 'border-ds-border focus:border-ds-accent focus:ring-2 focus:ring-ds-accent/25',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm text-red-400">{error}</p>}
      </div>
    )
  },
)

Textarea.displayName = 'Textarea'
