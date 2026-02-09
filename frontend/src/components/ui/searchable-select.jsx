import { useState, useRef, useEffect, useMemo } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

function normalizeForSearch(str) {
  if (!str) return ''
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

/**
 * Liste déroulante avec recherche (sélection unique).
 * options: string[]
 * value: string
 * onChange: (value: string) => void
 */
export function SearchableSelect({
  options = [],
  value = '',
  onChange,
  placeholder = 'Rechercher ou sélectionner...',
  id,
  disabled = false,
  className,
  'aria-label': ariaLabel,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const containerRef = useRef(null)
  const listRef = useRef(null)
  const searchInputRef = useRef(null)

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options
    const n = normalizeForSearch(search)
    return options.filter((opt) => normalizeForSearch(opt).includes(n))
  }, [options, search])

  // Fermer au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Focus du champ recherche à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setSearch('')
      setHighlightedIndex(0)
      requestAnimationFrame(() => searchInputRef.current?.focus())
    }
  }, [isOpen])

  // Scroll l'élément mis en surbrillance dans la vue
  useEffect(() => {
    const list = listRef.current
    const el = list?.querySelector('[data-highlighted="true"]')
    if (el) el.scrollIntoView({ block: 'nearest' })
  }, [highlightedIndex, filteredOptions])

  const handleSelect = (option) => {
    onChange(option)
    setIsOpen(false)
  }

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault()
        setIsOpen(true)
      }
      return
    }
    switch (e.key) {
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        break
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex((i) => Math.min(i + 1, filteredOptions.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex((i) => Math.max(i - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex])
        }
        break
      default:
        break
    }
  }

  const inputClasses =
    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={id ? `${id}-listbox` : undefined}
        aria-label={ariaLabel}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={handleKeyDown}
        onClick={() => !disabled && setIsOpen((o) => !o)}
        className={cn(
          inputClasses,
          'cursor-pointer flex items-center justify-between gap-2 pr-2'
        )}
      >
        <span className={cn(!value && 'text-muted-foreground')}>
          {value || placeholder}
        </span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 transition-transform', isOpen && 'rotate-180')}
          aria-hidden
        />
      </div>

      {isOpen && (
        <div
          id={id ? `${id}-listbox` : undefined}
          role="listbox"
          className="absolute z-50 mt-1 w-full rounded-md border border-input bg-popover shadow-md"
        >
          <div className="border-b border-input p-1">
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setHighlightedIndex(0)
              }}
              onKeyDown={handleKeyDown}
              placeholder="Rechercher..."
              className={cn(inputClasses, 'h-9 border-0 ring-0 focus-visible:ring-2')}
              aria-label="Rechercher dans la liste"
            />
          </div>
          <div
            ref={listRef}
            className="max-h-60 overflow-auto p-1"
          >
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                Aucun résultat
              </div>
            ) : (
              filteredOptions.map((option, index) => (
                <div
                  key={option}
                  role="option"
                  aria-selected={value === option}
                  data-highlighted={index === highlightedIndex}
                  className={cn(
                    'cursor-pointer rounded px-2 py-1.5 text-sm',
                    value === option && 'bg-accent',
                    index === highlightedIndex && 'bg-accent'
                  )}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => handleSelect(option)}
                >
                  {option}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
