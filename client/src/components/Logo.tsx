// Reflow mark: lines of text breaking into shorter chunks, one of them marigold.
function Logo() {
  return (
    <span className="flex items-center gap-3">
      <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
        <rect
          x="1"
          y="1"
          width="34"
          height="34"
          rx="9"
          fill="var(--sheet)"
          stroke="var(--ink)"
          strokeWidth="1.5"
        />
        <rect
          x="8"
          y="10"
          width="20"
          height="3.5"
          rx="1.75"
          fill="var(--ink)"
        />
        <rect
          x="8"
          y="16.25"
          width="12"
          height="3.5"
          rx="1.75"
          fill="var(--ink)"
        />
        <rect
          x="22"
          y="16.25"
          width="6"
          height="3.5"
          rx="1.75"
          fill="var(--ink)"
        />
        <rect
          x="8"
          y="22.5"
          width="5"
          height="3.5"
          rx="1.75"
          fill="var(--ink)"
        />
        <rect
          x="15"
          y="22.5"
          width="6"
          height="3.5"
          rx="1.75"
          fill="var(--marigold)"
          stroke="var(--ink)"
          strokeWidth="0.75"
        />
        <rect
          x="23"
          y="22.5"
          width="5"
          height="3.5"
          rx="1.75"
          fill="var(--ink)"
        />
      </svg>
      <span className="font-heading text-xl font-semibold tracking-tight">
        learning{' '}
        <span className="font-sans text-base font-normal tracking-normal text-graphite">
          in progress
        </span>
      </span>
    </span>
  )
}

export { Logo }
