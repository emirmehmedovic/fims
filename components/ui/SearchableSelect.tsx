'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Search, X } from 'lucide-react'

interface Option {
  id: string
  label: string
  sublabel?: string
}

interface SearchableSelectProps {
  options: Option[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  emptyMessage?: string
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Odaberite...',
  className = '',
  emptyMessage = 'Nema rezultata'
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0, maxHeight: 240, openUpwards: false })
  const [mounted, setMounted] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const isOutsideButton = buttonRef.current && !buttonRef.current.contains(target)
      const isOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(target)

      if (isOutsideButton && isOutsideDropdown) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }

    if (isOpen && buttonRef.current) {
      const updatePosition = () => {
        if (buttonRef.current) {
          const rect = buttonRef.current.getBoundingClientRect()
          const viewportHeight = window.innerHeight
          const dropdownMaxHeight = 240 // Max height from max-h-60 (15rem = 240px)
          const dropdownHeight = dropdownMaxHeight + 56 // Account for search input + padding

          // Calculate space above and below
          const spaceBelow = viewportHeight - rect.bottom
          const spaceAbove = rect.top

          // Determine if we should open upwards
          const shouldOpenUpwards = spaceBelow < dropdownHeight && spaceAbove > spaceBelow

          // Calculate available height
          const availableHeight = shouldOpenUpwards
            ? Math.min(spaceAbove - 16, dropdownMaxHeight)
            : Math.min(spaceBelow - 16, dropdownMaxHeight)

          // Calculate actual dropdown height with search input
          const actualDropdownHeight = availableHeight + 56 // 56px for search input area

          setDropdownPosition({
            top: shouldOpenUpwards ? rect.top - actualDropdownHeight : rect.bottom + 8,
            left: rect.left,
            width: rect.width,
            maxHeight: availableHeight,
            openUpwards: shouldOpenUpwards
          })
        }
      }

      updatePosition()

      // Update position on scroll and resize
      const handleScrollOrResize = () => {
        updatePosition()
      }

      window.addEventListener('scroll', handleScrollOrResize, true)
      window.addEventListener('resize', handleScrollOrResize)

      return () => {
        window.removeEventListener('scroll', handleScrollOrResize, true)
        window.removeEventListener('resize', handleScrollOrResize)
      }
    }
  }, [isOpen])

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    option.sublabel?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedOption = options.find(opt => opt.id === value)

  const handleSelect = (optionId: string) => {
    onChange(optionId)
    setIsOpen(false)
    setSearchQuery('')
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
  }

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`input w-full flex items-center justify-between gap-2 text-left transition-all ${
          isOpen ? 'ring-2 ring-primary-500 border-primary-500' : ''
        }`}
      >
        <span className={selectedOption ? 'text-dark-900' : 'text-dark-400'}>
          {selectedOption ? (
            <span>
              {selectedOption.label}
              {selectedOption.sublabel && (
                <span className="text-dark-500 text-sm ml-2">({selectedOption.sublabel})</span>
              )}
            </span>
          ) : (
            placeholder
          )}
        </span>
        <div className="flex items-center gap-1">
          {value && (
            <span
              onClick={handleClear}
              className="p-1 hover:bg-dark-100 rounded transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 text-dark-400" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-dark-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {mounted && isOpen && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[9999] bg-white border-2 border-primary-500 rounded-2xl shadow-[var(--shadow-soft-xl)] overflow-hidden ring-4 ring-primary-100"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`
          }}
        >
          {/* Search Input */}
          <div className="p-3 border-b border-primary-200 bg-primary-50/30">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-600" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pretraži..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-primary-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Options List */}
          <div
            className="overflow-y-auto"
            style={{ maxHeight: `${dropdownPosition.maxHeight}px` }}
          >
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-8 text-center text-dark-500 text-sm">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelect(option.id)}
                  className={`w-full px-4 py-3 text-left hover:bg-primary-50 transition-colors ${
                    option.id === value ? 'bg-primary-50 text-primary-700' : 'text-dark-900'
                  }`}
                >
                  <div className="font-medium text-sm">{option.label}</div>
                  {option.sublabel && (
                    <div className="text-xs text-dark-500 mt-0.5">{option.sublabel}</div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
