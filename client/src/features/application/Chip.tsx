import * as React from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

// Pill-shaped answer option. Selected chips turn purple, like main's .chip.selected.
function Chip({
  selected,
  className,
  children,
  ...props
}: React.ComponentProps<'button'> & { selected: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-[0.88rem] font-normal transition-colors',
        selected
          ? 'border-pine bg-pine-soft text-pine-deep'
          : 'border-rule bg-paper hover:border-graphite',
        className,
      )}
      {...props}
    >
      {selected && <Check className="size-4" strokeWidth={2.25} aria-hidden />}
      {children}
    </button>
  )
}

export { Chip }
