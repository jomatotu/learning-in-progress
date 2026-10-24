import { useState } from 'react'
import { FileText, Link2, Type, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { Profile } from './profile'

type Mode = 'text' | 'link' | 'file'

const modes = [
  { id: 'text', label: 'Paste text', icon: Type },
  { id: 'link', label: 'Add a link', icon: Link2 },
  { id: 'file', label: 'Upload files', icon: Upload },
] as const

// One place to add learning material: pasted text, links, or files. Added items are listed below.
function MaterialInput({
  profile,
  update,
}: {
  profile: Profile
  update: (patch: Partial<Profile>) => void
}) {
  const [mode, setMode] = useState<Mode>('text')
  const [draft, setDraft] = useState('')
  const [linkError, setLinkError] = useState('')

  const addText = () => {
    if (!draft.trim()) return
    update({ texts: [...profile.texts, draft.trim()] })
    setDraft('')
  }

  const addLink = () => {
    const value = draft.trim()
    if (!value) return
    try {
      const url = new URL(value.includes('://') ? value : `https://${value}`)
      update({ links: [...profile.links, url.href] })
      setDraft('')
      setLinkError('')
    } catch {
      setLinkError('That doesn’t look like a link. Check it and try again.')
    }
  }

  const addFiles = (files: FileList | null) => {
    if (files?.length) update({ files: [...profile.files, ...files] })
  }

  const items = [
    ...profile.texts.map((text, i) => ({
      key: `t${i}`,
      icon: Type,
      label: text.length > 60 ? `${text.slice(0, 60)}…` : text,
      remove: () => update({ texts: profile.texts.filter((_, j) => j !== i) }),
    })),
    ...profile.links.map((link, i) => ({
      key: `l${i}`,
      icon: Link2,
      label: link,
      remove: () => update({ links: profile.links.filter((_, j) => j !== i) }),
    })),
    ...profile.files.map((file, i) => ({
      key: `f${i}`,
      icon: FileText,
      label: file.name,
      remove: () => update({ files: profile.files.filter((_, j) => j !== i) }),
    })),
  ]

  return (
    <div className="flex flex-col gap-4">
      <fieldset
        aria-label="How to add material"
        className="flex flex-wrap gap-2"
      >
        {modes.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            aria-pressed={mode === id}
            onClick={() => {
              setMode(id)
              setDraft('')
              setLinkError('')
            }}
            className={cn(
              'inline-flex items-center gap-2 rounded-[14px] border-[1.5px] px-4 py-2 text-[0.88rem] font-normal transition-colors',
              mode === id
                ? 'border-ink bg-sheet shadow-hard-sm'
                : 'border-rule bg-paper hover:border-graphite',
            )}
          >
            <Icon className="size-4" strokeWidth={1.75} aria-hidden />
            {label}
          </button>
        ))}
      </fieldset>

      {mode === 'text' && (
        <div className="flex flex-col items-start gap-3">
          <Textarea
            aria-label="Paste your text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Paste a chapter, your lecture notes, or an exercise sheet"
          />
          <Button
            type="button"
            variant="outline"
            onClick={addText}
            className="h-10 rounded-[14px] border-[1.5px] px-4"
          >
            Add text
          </Button>
        </div>
      )}

      {mode === 'link' && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-3">
            <Input
              aria-label="Link to your material"
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value)
                setLinkError('')
              }}
              onKeyDown={(e) =>
                e.key === 'Enter' && (e.preventDefault(), addLink())
              }
              placeholder="youtube.com/watch?v=… or a course page"
              aria-invalid={!!linkError}
            />
            <Button
              type="button"
              variant="outline"
              onClick={addLink}
              className="h-12 rounded-[14px] border-[1.5px] px-5"
            >
              Add
            </Button>
          </div>
          {linkError && (
            <p role="alert" className="border-l-[3px] border-clay pl-3 text-sm">
              {linkError}
            </p>
          )}
        </div>
      )}

      {mode === 'file' && (
        // Drag and drop is a mouse shortcut; the file input inside is the keyboard path.
        // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
        <label
          className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-[1.5px] border-dashed border-graphite bg-paper px-6 py-8 text-center hover:bg-sheet"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            addFiles(e.dataTransfer.files)
          }}
        >
          <Upload className="size-6 text-pine" strokeWidth={1.5} aria-hidden />
          <span className="font-normal">Drop files here or choose them</span>
          <span className="text-sm text-graphite">
            PDF, Word, slides, images, or audio
          </span>
          <input
            type="file"
            multiple
            className="sr-only"
            onChange={(e) => {
              addFiles(e.target.files)
              e.target.value = ''
            }}
          />
        </label>
      )}

      {items.length > 0 && (
        <ul className="flex flex-col gap-2" aria-label="Added material">
          {items.map(({ key, icon: Icon, label, remove }) => (
            <li
              key={key}
              className="flex items-center gap-3 rounded-xl border-[1.5px] border-ink bg-marigold-soft px-3 py-2 text-sm"
            >
              <Icon
                className="size-4 shrink-0"
                strokeWidth={1.75}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate">{label}</span>
              <button
                type="button"
                onClick={remove}
                aria-label={`Remove ${label}`}
                className="rounded-md p-1 hover:bg-sheet"
              >
                <X className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export { MaterialInput }
