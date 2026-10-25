import type { ReactNode } from 'react'

// Section label, question as heading, and a one-line hint. Every step starts with this.
function StepHeading({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="mb-2 md:mb-3">
      <span className="kicker">{label}</span>
      <h2 tabIndex={-1} className="mt-1.5 text-[1.6rem] md:text-[1.75rem]">
        {children}
      </h2>
      {hint && <p className="mt-1 max-w-prose text-graphite">{hint}</p>}
    </div>
  )
}

export { StepHeading }
