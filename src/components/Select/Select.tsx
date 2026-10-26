import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import './Select.css'

type SelectProps<T extends string | number> = {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}

export function Select<T extends string | number>({ label, value, options, onChange }: SelectProps<T>) {
  const id = useId()
  const root = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const [open, setOpen] = useState(false)
  const selected = Math.max(0, options.findIndex((o) => o.value === value))
  const [active, setActive] = useState(selected)

  useEffect(() => {
    if (!open) return
    list.current?.focus()
    const close = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open])

  const show = () => {
    setActive(selected)
    setOpen(true)
  }

  const pick = (i: number) => {
    onChange(options[i].value)
    setOpen(false)
    root.current?.querySelector('button')?.focus()
  }

  const onListKey = (event: KeyboardEvent) => {
    if (event.key === 'ArrowDown') setActive((i) => Math.min(options.length - 1, i + 1))
    else if (event.key === 'ArrowUp') setActive((i) => Math.max(0, i - 1))
    else if (event.key === 'Home') setActive(0)
    else if (event.key === 'End') setActive(options.length - 1)
    else if (event.key === 'Enter' || event.key === ' ') pick(active)
    else if (event.key === 'Escape' || event.key === 'Tab') {
      setOpen(false)
      if (event.key === 'Escape') root.current?.querySelector('button')?.focus()
      return
    } else return
    event.preventDefault()
  }

  return (
    <div className="select" ref={root}>
      <button
        type="button"
        className="select__trigger"
        aria-label={`${label}: ${options[selected]?.label}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            show()
          }
        }}
      >
        <span className="select__value">{options[selected]?.label}</span>
        <svg className="select__chevron" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul
          ref={list}
          className="select__list"
          role="listbox"
          tabIndex={-1}
          aria-label={label}
          aria-activedescendant={`${id}-${active}`}
          onKeyDown={onListKey}
        >
          {options.map((option, i) => (
            <li
              key={String(option.value)}
              id={`${id}-${i}`}
              role="option"
              aria-selected={i === selected}
              className={i === active ? 'select__option select__option--active' : 'select__option'}
              onPointerEnter={() => setActive(i)}
              onClick={() => pick(i)}
            >
              {option.label}
              {i === selected && (
                <svg className="select__check" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 12.5 10 17 19 7.5" />
                </svg>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
