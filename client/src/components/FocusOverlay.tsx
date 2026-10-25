import { useEffect, useRef } from 'react'

// Elements the spotlight can rest on: one readable block at a time.
const BLOCK_SELECTOR =
  'p, h1, h2, h3, h4, h5, h6, li, blockquote, pre, figure, img, td, th, label, legend, fieldset, input, select, textarea, button, .topbar'

// In forms, the control alone is not useful without its question: climb from the
// control or legend to the surrounding label or fieldset, which holds both.
// Stacked groups ("flex flex-col gap-2") read as one unit, so hovering or focusing
// anything inside them lights the whole group, question and answers together.
// A button belongs to its button row, so the whole row lights up at once.
function resolveTarget(el: Element): Element {
  if (el.matches('input, select, textarea, legend')) {
    el = el.closest('fieldset') ?? el.closest('label') ?? el
  }
  if (el.matches('button')) {
    // The outermost small flex row holding the buttons is the button row,
    // so nested rows ("Back | Skip | Continue") light up as one full-width row.
    let best: Element | null = null
    let row: Element | null = el.parentElement
    while (row && isButtonRow(row)) {
      best = row
      row = row.parentElement
    }
    if (best) return best
  }
  return el.closest('fieldset') ?? el.closest('.flex.flex-col.gap-2') ?? el
}

// A button row: a small flex container that holds buttons.
function isButtonRow(el: Element): boolean {
  return (
    getComputedStyle(el).display.includes('flex') &&
    el.querySelectorAll('button').length > 0 &&
    el.getBoundingClientRect().height < 120
  )
}

// The column the block sits in: the nearest grid or flex item above it. The spotlight
// spans this full width, so every highlighted row stretches across the whole column.
function columnElement(el: Element): Element | null {
  let node: Element | null = el
  for (let depth = 0; node && depth < 8; depth++) {
    const parent = node.parentElement
    if (!parent) return null
    const display = getComputedStyle(parent).display
    if (display.includes('grid') || display.includes('flex')) return node
    node = parent
  }
  return null
}

// The dimmed page with a hole over the block under the mouse.
// The hole is a transparent rectangle whose huge box-shadow darkens everything else.
export function FocusOverlay() {
  const spotlightRef = useRef<HTMLDivElement>(null)
  const lastTargetRef = useRef<Element | null>(null)

  useEffect(() => {
    const spotlight = spotlightRef.current
    if (!spotlight) return

    // Room around the block, so its edges and nearby context stay readable.
    // Button rows sit at the end of the form with nothing below them: a large
    // pad there puts most of the band in empty space, so they hug the row.
    const PAD = 40
    const ROW_PAD = 12

    // The spotlight may breathe into empty space, but never into a neighbouring
    // block: between two survey questions the gap is small, and the highlight
    // must stay on the fieldset the mouse is over.
    const clampVertical = (target: Element, rect: DOMRect, pad: number) => {
      let top = rect.top - pad
      let bottom = rect.bottom + pad
      const parent = target.parentElement
      if (parent) {
        const siblings = Array.from(parent.children)
        const index = siblings.indexOf(target)
        const prev = siblings[index - 1]
        const next = siblings[index + 1]
        if (prev) {
          top = Math.max(top, prev.getBoundingClientRect().bottom + 2)
        }
        if (next) {
          bottom = Math.min(bottom, next.getBoundingClientRect().top - 2)
        }
      }
      return { top, height: bottom - top }
    }

    const show = (target: Element) => {
      lastTargetRef.current = target
      const rect = target.getBoundingClientRect()
      const column = columnElement(target)
      const columnRect = column ? column.getBoundingClientRect() : rect
      const rowPad = isButtonRow(target) ? ROW_PAD : PAD
      const { top, height } = clampVertical(target, rect, rowPad)
      spotlight.style.opacity = '1'
      spotlight.style.transform = `translate(${columnRect.left - PAD}px, ${top}px)`
      spotlight.style.width = `${columnRect.width + PAD * 2}px`
      spotlight.style.height = `${height}px`
    }

    const hide = () => {
      lastTargetRef.current = null
      spotlight.style.opacity = '0'
    }

    const onMouseMove = (event: MouseEvent) => {
      const node = event.target instanceof Element ? event.target : null
      if (!node) return
      const target = node.closest(BLOCK_SELECTOR)
      if (target) {
        const resolved = resolveTarget(target)
        if (resolved === lastTargetRef.current) return
        show(resolved)
        return
      }
      // Empty space over a button row (padding, gaps) lights the whole row.
      if (isButtonRow(node)) {
        if (node === lastTargetRef.current) return
        show(node)
      }
    }

    // While scrolling, the block moves but the mouse does not: redraw from the last target.
    const onScroll = () => {
      if (lastTargetRef.current) {
        show(lastTargetRef.current)
      } else {
        hide()
      }
    }

    // Keyboard focus lights the same rows the mouse would.
    const onFocusIn = (event: FocusEvent) => {
      const node = event.target instanceof Element ? event.target : null
      const target = node?.closest(BLOCK_SELECTOR)
      if (target) show(resolveTarget(target))
    }
    const onFocusOut = () => hide()

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('focusin', onFocusIn)
    document.addEventListener('focusout', onFocusOut)
    window.addEventListener('scroll', onScroll, true)
    document.documentElement.addEventListener('mouseleave', hide)

    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('focusin', onFocusIn)
      document.removeEventListener('focusout', onFocusOut)
      window.removeEventListener('scroll', onScroll, true)
      document.documentElement.removeEventListener('mouseleave', hide)
    }
  }, [])

  return (
    <div className="focus-overlay" aria-hidden>
      <div ref={spotlightRef} className="focus-spotlight" />
    </div>
  )
}
