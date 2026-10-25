import type { ReactNode } from 'react'
import { defineMessages, useMessages } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const messages = defineMessages({
  en: { optional: 'optional' },
  de: { optional: 'optional' },
})

// Label, optional hint, and inline error around one form control.
function Field({
  id,
  label,
  hint,
  error,
  optional,
  className,
  children,
}: {
  id?: string
  label: string
  hint?: string
  error?: string
  optional?: boolean
  className?: string
  children: ReactNode
}) {
  const t = useMessages(messages)

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-base font-normal">
        {label}
        {optional && (
          <span className="ml-2 text-sm text-graphite">{t.optional}</span>
        )}
      </label>
      {hint && <p className="-mt-1 text-sm text-graphite">{hint}</p>}
      {children}
      {error && (
        <p role="alert" className="border-l-[3px] border-clay pl-3 text-sm">
          {error}
        </p>
      )}
    </div>
  )
}

export { Field }
