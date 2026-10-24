import type { ReactNode } from 'react'
import { defineMessages, useMessages } from '@/lib/i18n'

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
  children,
}: {
  id?: string
  label: string
  hint?: string
  error?: string
  optional?: boolean
  children: ReactNode
}) {
  const t = useMessages(messages)

  return (
    <div className="flex flex-col gap-2">
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
