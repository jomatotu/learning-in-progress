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
    <div className="mb-8">
      <span className="label">{label}</span>
      <h2
        tabIndex={-1}
        className="mt-3 max-w-[20ch] text-[1.9rem] md:text-[2.2rem]"
      >
        {children}
      </h2>
      {hint && <p className="mt-3 max-w-prose text-graphite">{hint}</p>}
    </div>
  )
}

export { StepHeading }
