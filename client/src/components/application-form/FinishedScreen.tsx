import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { StudentProfileJson } from './studentProfile'

// Shown after "Build my tool". Also shows the profile JSON the server built, for the team and the demo.
function FinishedScreen({
  name,
  profileJson,
  onBack,
}: {
  name: string
  profileJson: StudentProfileJson
  onBack: () => void
}) {
  const [copied, setCopied] = useState(false)
  const json = JSON.stringify(profileJson, null, 2)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="rounded-[22px] border-[1.5px] border-ink bg-sheet p-8 shadow-hard-lg md:p-14">
      <span className="label">All set</span>
      <h2
        tabIndex={-1}
        className="mt-3 max-w-[18ch] text-[2.2rem] outline-none md:text-[2.8rem]"
      >
        Thanks, {name}. <span className="mark">Your profile is ready.</span>
      </h2>
      <p className="mt-4 max-w-[46ch] text-graphite">
        Next, we look at what helps people who learn like you, and suggest a
        tool built around your material.
      </p>

      <details className="mt-10 rounded-2xl border-[1.5px] border-rule bg-paper">
        <summary className="cursor-pointer px-5 py-4 font-normal">
          See your profile JSON
        </summary>
        <div className="border-t-[1.5px] border-rule p-5">
          <div className="mb-3 flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={copy}
              className="h-9 rounded-[12px] border-[1.5px]"
            >
              {copied ? (
                <Check data-icon="inline-start" aria-hidden />
              ) : (
                <Copy data-icon="inline-start" aria-hidden />
              )}
              {copied ? 'Copied' : 'Copy JSON'}
            </Button>
          </div>
          <pre className="max-h-96 overflow-auto rounded-xl bg-sheet p-4 font-mono text-[0.78rem] leading-relaxed">
            {json}
          </pre>
        </div>
      </details>

      <Button variant="ghost" className="mt-8 px-0 text-base" onClick={onBack}>
        Back to my profile
      </Button>
    </div>
  )
}

export { FinishedScreen }
