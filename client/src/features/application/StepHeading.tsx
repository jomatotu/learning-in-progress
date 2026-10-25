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
    <div className="mb-3 md:mb-4">
      <span className="kicker">{label}</span>
      <h2 tabIndex={-1} className="mt-2 text-[1.6rem] md:text-[1.9rem]">
        {children}
      </h2>
      {hint && <p className="mt-2 max-w-prose text-graphite">{hint}</p>}
    </div>
  )
}

export { StepHeading }
