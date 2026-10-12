import { useState, KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import { clsx } from 'clsx'

interface TagInputProps {
  label: string
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  className?: string
}

export function TagInput({ label, tags, onChange, placeholder = 'Type and press Enter', className }: TagInputProps) {
  const [input, setInput] = useState('')

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault()
      const tag = input.trim().toLowerCase()
      if (!tags.includes(tag)) onChange([...tags, tag])
      setInput('')
    }
    if (e.key === 'Backspace' && !input && tags.length) {
      onChange(tags.slice(0, -1))
    }
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag))
  }

  return (
    <div className={className}>
      <label className="label">{label}</label>
      <div
        className={clsx(
          'flex min-h-[44px] flex-wrap gap-1.5 rounded-lg border border-navy-500 bg-navy-700 px-3 py-2',
          'focus-within:border-accent-400 focus-within:ring-1 focus-within:ring-accent-400'
        )}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-accent-400/20 border border-accent-400/30 px-2.5 py-0.5 text-xs font-medium text-accent-300"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-accent-400/60 hover:text-accent-300 focus:outline-none"
              aria-label={`Remove ${tag}`}
            >
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="min-w-[120px] flex-1 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
        />
      </div>
      <p className="mt-1 text-xs text-gray-500">Press Enter or comma to add a tag</p>
    </div>
  )
}
