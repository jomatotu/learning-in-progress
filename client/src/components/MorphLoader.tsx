import { useEffect, useRef } from 'react'
import { defineMessages, useMessages } from '@/lib/i18n'
import { prefersStill } from '@/lib/motion'

const messages = defineMessages({
  en: {
    label: 'Morph is working',
    steps: [
      'Morph is reading your text…',
      'Morph is shaping your page…',
      'Almost done…',
    ],
  },
  de: {
    label: 'Morph arbeitet',
    steps: [
      'Morph liest deinen Text…',
      'Morph formt deine Seite…',
      'Fast fertig…',
    ],
  },
})

// How far the build is: reading the material, shaping the page, almost done.
export type MorphStep = 0 | 1 | 2

type Point = [number, number]
// Every shape is three strokes of POINTS points plus a node size, so any two can be blended point by point.
type Shape = { strokes: Point[][]; width: number; node: number }

const POINTS = 8

function line(x1: number, y1: number, x2: number, y2: number): Point[] {
  return Array.from({ length: POINTS }, (_, i): Point => {
    const k = i / (POINTS - 1)
    return [x1 + (x2 - x1) * k, y1 + (y2 - y1) * k]
  })
}

// One third of a sound wave that swells in the middle.
function wave(third: number): Point[] {
  return Array.from({ length: POINTS }, (_, i): Point => {
    const k = (third + i / (POINTS - 1)) / 3
    return [
      20 + 60 * k,
      50 + 16 * Math.sin(k * 4 * Math.PI) * Math.sin(k * Math.PI),
    ]
  })
}

const DOT: Shape = {
  strokes: [line(50, 50, 50, 50), line(50, 50, 50, 50), line(50, 50, 50, 50)],
  width: 14,
  node: 0,
}

// dot, a few text lines, a sound wave, connected nodes, a block, and back to the dot.
const SHAPES: Shape[] = [
  DOT,
  {
    strokes: [line(26, 36, 74, 36), line(26, 50, 74, 50), line(26, 64, 58, 64)],
    width: 6,
    node: 0,
  },
  { strokes: [wave(0), wave(1), wave(2)], width: 5, node: 0 },
  {
    strokes: [line(28, 66, 50, 30), line(50, 30, 72, 66), line(72, 66, 28, 66)],
    width: 3,
    node: 7,
  },
  {
    // Lines thicker than their gaps, so they read as one solid block.
    strokes: [line(34, 38, 66, 38), line(34, 50, 66, 50), line(34, 62, 66, 62)],
    width: 14,
    node: 0,
  },
]

const HOLD_MS = 900
const MORPH_MS = 900

function mix(a: Shape, b: Shape, k: number): Shape {
  const blend = (x: number, y: number) => x + (y - x) * k
  return {
    strokes: a.strokes.map((stroke, s) =>
      stroke.map(([x, y], p): Point => {
        const [bx, by] = b.strokes[s][p]
        return [blend(x, bx), blend(y, by)]
      }),
    ),
    width: blend(a.width, b.width),
    node: blend(a.node, b.node),
  }
}

// The shape at a moment of the loop: each shape holds, then eases into the next.
export function shapeAt(ms: number): Shape {
  const step = HOLD_MS + MORPH_MS
  // rAF's first timestamp can be a little before the start time.
  const t = Math.max(0, ms) % (step * SHAPES.length)
  const index = Math.floor(t / step)
  const k = Math.max(0, (t - index * step - HOLD_MS) / MORPH_MS)
  const eased = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2
  return mix(SHAPES[index], SHAPES[(index + 1) % SHAPES.length], eased)
}

function pathOf(shape: Shape): string {
  return shape.strokes
    .map(
      (stroke) =>
        'M' +
        stroke.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L'),
    )
    .join('')
}

type MorphLoaderProps = {
  step: MorphStep
  // Off once the first block is on screen: then only the line keeps running.
  shape?: boolean
}

// Morph's wait state: one purple dot that morphs through text, sound, nodes and a block, and one friendly line.
// Students never see tool names or reasoning here. Still dot under reduced motion and in Graustufen.
export function MorphLoader({ step, shape = true }: MorphLoaderProps) {
  const t = useMessages(messages)
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      {shape && <MorphShape label={t.label} />}
      <p aria-live="polite" className="text-lg text-graphite">
        {t.steps[step]}
      </p>
    </div>
  )
}

function MorphShape({ label }: { label: string }) {
  const path = useRef<SVGPathElement>(null)
  const nodes = useRef<(SVGCircleElement | null)[]>([])

  useEffect(() => {
    if (prefersStill() || typeof requestAnimationFrame !== 'function') return
    const started = performance.now()
    let frame = requestAnimationFrame(function draw(now) {
      const shape = shapeAt(now - started)
      path.current?.setAttribute('d', pathOf(shape))
      path.current?.setAttribute('stroke-width', shape.width.toFixed(1))
      shape.strokes.forEach(([[x, y]], i) => {
        nodes.current[i]?.setAttribute('cx', x.toFixed(1))
        nodes.current[i]?.setAttribute('cy', y.toFixed(1))
        nodes.current[i]?.setAttribute('r', shape.node.toFixed(1))
      })
      frame = requestAnimationFrame(draw)
    })
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <svg
      // An inline SVG can't be an <img>; role="img" with a label is the accessible pattern for it.
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
      role="img"
      aria-label={label}
      viewBox="0 0 100 100"
      className="size-28"
    >
      <path
        ref={path}
        d={pathOf(DOT)}
        fill="none"
        stroke="#6955c6"
        strokeWidth={DOT.width}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {DOT.strokes.map(([[x, y]], i) => (
        <circle
          key={i}
          ref={(node) => {
            nodes.current[i] = node
          }}
          cx={x}
          cy={y}
          r={0}
          fill="#6955c6"
        />
      ))}
    </svg>
  )
}
