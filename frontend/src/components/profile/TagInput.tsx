import { useState, type KeyboardEvent } from 'react'
import Badge from '@/components/common/Badge'

interface TagInputProps {
  label: string
  id: string
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
}

export default function TagInput({ label, id, tags, onChange, placeholder }: TagInputProps) {
  const [input, setInput] = useState('')

  const add = () => {
    const val = input.trim()
    if (val && !tags.includes(val)) {
      onChange([...tags, val])
    }
    setInput('')
  }

  const remove = (tag: string) => onChange(tags.filter((t) => t !== tag))

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add()
    }
    if (e.key === 'Backspace' && input === '' && tags.length > 0) {
      remove(tags[tags.length - 1])
    }
  }

  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <div className="input-base min-h-[2.75rem] flex flex-wrap gap-1.5 cursor-text"
        onClick={() => document.getElementById(id)?.focus()}
      >
        {tags.map((t) => (
          <Badge key={t} variant="primary" className="flex items-center gap-1">
            {t}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); remove(t) }}
              className="ml-0.5 text-primary-300 hover:text-white"
              aria-label={`Remove ${t}`}
            >
              ×
            </button>
          </Badge>
        ))}
        <input
          id={id}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          onBlur={add}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-slate-100 placeholder-slate-500"
        />
      </div>
      <p className="text-xs text-slate-500 mt-1">Press Enter or comma to add</p>
    </div>
  )
}
