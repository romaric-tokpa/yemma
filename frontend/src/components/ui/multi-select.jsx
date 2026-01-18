import { useState, useRef, useEffect } from 'react'
import { X, Check, ChevronDown } from 'lucide-react'
import { Button } from './button'
import { Badge } from './badge'
import { cn } from '@/lib/utils'

export function MultiSelect({ options, selected, onChange, placeholder = "Sélectionner...", className }) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleOption = (option) => {
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option))
    } else {
      onChange([...selected, option])
    }
  }

  const removeOption = (option, e) => {
    e.stopPropagation()
    onChange(selected.filter(item => item !== option))
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Button
        type="button"
        variant="outline"
        className="w-full justify-between min-h-10 h-auto"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-1 flex-1">
          {selected.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            selected.map((option) => (
              <Badge
                key={option}
                variant="secondary"
                className="mr-1 mb-1"
                onClick={(e) => removeOption(option, e)}
              >
                {option}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            ))
          )}
        </div>
        <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform", isOpen && "rotate-180")} />
      </Button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
          {options.map((option) => {
            const isSelected = selected.includes(option)
            return (
              <div
                key={option}
                className={cn(
                  "px-4 py-2 cursor-pointer hover:bg-gray-100 flex items-center justify-between",
                  isSelected && "bg-blue-50"
                )}
                onClick={() => toggleOption(option)}
              >
                <span className="text-sm">{option}</span>
                {isSelected && <Check className="h-4 w-4 text-blue-600" />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

