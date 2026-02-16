/**
 * Toast de notification redesigné - design moderne conforme à la charte Yemma
 * Types : success, error, info, warning
 */
import { useEffect } from 'react'
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react'

const TOAST_CONFIG = {
  success: {
    icon: CheckCircle2,
    bg: 'bg-[#226D68]/10',
    border: 'border-[#226D68]/30',
    iconColor: 'text-[#226D68]',
    textColor: 'text-[#1a5a55]',
  },
  error: {
    icon: AlertCircle,
    bg: 'bg-[#e76f51]/10',
    border: 'border-[#e76f51]/30',
    iconColor: 'text-[#e76f51]',
    textColor: 'text-[#c04a2f]',
  },
  info: {
    icon: Info,
    bg: 'bg-[#0B3C5D]/10',
    border: 'border-[#0B3C5D]/30',
    iconColor: 'text-[#0B3C5D]',
    textColor: 'text-[#0B3C5D]',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-[#F2C94C]/15',
    border: 'border-[#F2C94C]/40',
    iconColor: 'text-[#b8860b]',
    textColor: 'text-[#8b6914]',
  },
}

export function Toast({ message, type = 'success', visible, onClose, duration = 4000 }) {
  const config = TOAST_CONFIG[type] || TOAST_CONFIG.success
  const Icon = config.icon

  useEffect(() => {
    if (!visible || !onClose) return
    const t = setTimeout(onClose, duration)
    return () => clearTimeout(t)
  }, [visible, onClose, duration])

  if (!visible || message == null || String(message).trim() === '') return null

  const displayMessage = typeof message === 'string' ? message : String(message)

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-[9999] max-w-[min(calc(100vw-2rem),380px)] animate-toast-in"
    >
      <div
        className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 shadow-xl backdrop-blur-sm ${config.bg} ${config.border}`}
      >
        <div className={`flex-shrink-0 mt-0.5 rounded-full p-1.5 ${config.bg}`}>
          <Icon className={`h-5 w-5 ${config.iconColor}`} aria-hidden />
        </div>
        <p className={`flex-1 text-sm font-medium leading-relaxed ${config.textColor} min-w-0`}>
          {displayMessage}
        </p>
        <button
          type="button"
          onClick={onClose}
          className={`flex-shrink-0 rounded-lg p-1.5 transition-colors hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-[#226D68]/30 ${config.iconColor}`}
          aria-label="Fermer la notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
