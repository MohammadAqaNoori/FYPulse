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
      if (!tags.includes(tag)) {
        onChange([...tags, tag])
      }
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
      <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
      <div
        className={clsx(
          'flex min-h-[42px] flex-wrap gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2',
          'focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500'
        )}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-700"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-0.5 rounded-full text-brand-500 hover:text-brand-700 focus:outline-none"
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
          className="min-w-[120px] flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
        />
      </div>
      <p className="mt-1 text-xs text-gray-400">Press Enter or comma to add a tag</p>
    </div>
  )
}
