import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
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
    <div className="rounded-[20px] border border-rule bg-sheet p-8 shadow-card md:p-14">
      <span className="kicker">All set</span>
      <h2
        tabIndex={-1}
        className="mt-3 max-w-[18ch] text-[2.2rem] outline-none md:text-[2.8rem]"
      >
        Thanks, {name}. <em>Your profile is ready.</em>
      </h2>
      <p className="mt-4 max-w-[46ch] text-graphite">
        Next, we look at what helps people who learn like you, and suggest a
        tool built around your material.
      </p>

      <details className="mt-10 rounded-2xl border border-rule bg-paper">
        <summary className="cursor-pointer px-5 py-4 font-normal">
          See your profile JSON
        </summary>
        <div className="border-t border-rule p-5">
          <div className="mb-3 flex justify-end">
            <button type="button" className="secondary-button" onClick={copy}>
              {copied ? (
                <Check size={16} aria-hidden />
              ) : (
                <Copy size={16} aria-hidden />
              )}
              {copied ? 'Copied' : 'Copy JSON'}
            </button>
          </div>
          <pre className="max-h-96 overflow-auto rounded-xl bg-sheet p-4 font-mono text-[0.78rem] leading-relaxed">
            {json}
          </pre>
        </div>
      </details>

      <button className="text-button mt-6 pl-0" onClick={onBack}>
        Back to my profile
      </button>
    </div>
  )
}

export { FinishedScreen }
