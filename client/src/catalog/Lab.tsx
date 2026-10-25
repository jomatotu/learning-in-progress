// An experiment board: sliders for 1 to 3 factors and a live chart of the output.
// The output comes from fixed, parameterized curves chosen in the spec; no model-written code ever runs.
import { useId } from 'react'
import { useStateBinding } from '@json-render/react'
import { Card, Original } from './blocks'
import { effect, type LabSlider } from './labModel'

interface LabProps {
  title?: string
  sliders?: LabSlider[]
  output?: { label?: string; unit?: string; max?: number }
  notes?: { upTo: number; text: string }[]
  source?: string
}

const W = 300
const H = 150
const POINTS = 48

function round(n: number) {
  return Math.abs(n) >= 10 ? Math.round(n) : Math.round(n * 10) / 10
}

export function Lab({
  title,
  sliders = [],
  output = {},
  notes = [],
  source,
}: LabProps) {
  // Slider values live in json-render's state, one object per Lab on the page.
  const [state, setState] = useStateBinding<Record<string, number>>(
    `/lab${useId()}`,
  )
  const used = sliders.slice(0, 3)
  const values = used.map((s, i) => state?.[s.key ?? i] ?? s.value ?? s.min)
  const max = output.max ?? 100
  const outputAt = (x: number) =>
    max *
    used.reduce(
      (product, s, i) => product * effect(s, i === 0 ? x : values[i]),
      1,
    )

  const first = used[0]
  if (!first) return null
  const xOf = (x: number) =>
    ((x - first.min) / (first.max - first.min || 1)) * W
  const yOf = (y: number) => H - (y / (max || 1)) * H
  const line = Array.from({ length: POINTS + 1 }, (_, i) => {
    const x = first.min + ((first.max - first.min) * i) / POINTS
    return `${xOf(x).toFixed(1)},${yOf(outputAt(x)).toFixed(1)}`
  })
  const current = outputAt(values[0])
  const note = notes.find((n) => values[0] <= n.upTo) ?? notes.at(-1)

  return (
    <Card>
      <h3 className="text-xl font-semibold">{title}</h3>
      <div className="mt-4 grid gap-4">
        {used.map((s, i) => (
          <div key={s.key ?? i} className="grid gap-1 text-base">
            <span className="flex justify-between">
              <span className="font-medium">{s.label}</span>
              <span className="text-graphite">
                {values[i]} {s.unit}
              </span>
            </span>
            <input
              type="range"
              min={s.min}
              max={s.max}
              step={s.step ?? (s.max - s.min) / 100}
              value={values[i]}
              onChange={(e) =>
                setState({ ...state, [s.key ?? i]: Number(e.target.value) })
              }
              aria-label={`${s.label} (${s.unit})`}
              className="w-full accent-pine"
            />
          </div>
        ))}
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        aria-hidden="true"
        data-testid="lab-chart"
        className="mt-5 w-full overflow-visible rounded-xl bg-pine-soft"
      >
        <polygon
          points={`0,${H} ${line.join(' ')} ${W},${H}`}
          className="fill-pine/20"
        />
        <polyline
          points={line.join(' ')}
          fill="none"
          strokeWidth={3}
          className="stroke-pine"
        />
        <circle
          cx={xOf(values[0])}
          cy={yOf(current)}
          r={7}
          className="fill-pine"
        />
      </svg>
      <p className="mt-2 flex justify-between text-sm text-graphite">
        <span>
          {first.label} ({first.unit})
        </span>
        <span>
          ↑ {output.label} ({output.unit})
        </span>
      </p>
      <output data-testid="lab-output" className="mt-4 block text-lg">
        <strong>
          {output.label}: {round(current)} {output.unit}
        </strong>
        <span aria-live="polite" className="block">
          {note?.text}
        </span>
      </output>
      <Original source={source} />
    </Card>
  )
}
