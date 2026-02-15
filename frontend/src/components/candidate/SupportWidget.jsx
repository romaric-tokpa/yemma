/**
 * Encart Expert Yemma — Accompagnement candidat
 * Popup flottant en bas à droite, ouvrable/fermable au clic
 * Copywriting adapté au BRIEF_PROJET.md
 */
import { useState } from 'react'
import { MessageCircle, X } from 'lucide-react'

const SUPPORT_AVATAR = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=96&h=96&fit=crop&crop=face'

/** Contenu de l'encart Expert Yemma */
function SupportContent({ compact = false }) {
  return (
    <div className="flex flex-col">
      <img
        src={SUPPORT_AVATAR}
        alt="Expert Yemma"
        className={`rounded-full object-cover border-2 border-white shadow-md shrink-0 ${compact ? 'w-14 h-14 mb-3' : 'w-16 h-16 mb-3'}`}
      />
      <h3 className="font-heading font-semibold text-[#2C2C2C]">Expert Yemma</h3>
      <p className="text-xs text-[#6b7280] mt-1 mb-3">Votre accompagnement</p>
      <div className="text-sm text-[#6b7280] leading-relaxed space-y-2">
        <p>Pour valider votre sélection, notre équipe doit s&apos;appuyer sur un profil complet.</p>
        <p>Une fois votre profil validé, vous entrez dans la CVthèque et devenez visible auprès des recruteurs. Objectif : mise en relation en 48h.</p>
        <p>Besoin d&apos;aide ? Je suis là pour vous accompagner.</p>
      </div>
      <a
        href="mailto:contact@yemma-solutions.com?subject=Support%20Candidat"
        className="mt-4 w-full inline-flex items-center justify-center rounded-lg text-sm font-medium border-2 border-[#226D68]/40 text-[#226D68] hover:bg-[#E8F4F3] h-9 px-3 transition-colors"
      >
        <MessageCircle className="w-4 h-4 mr-2" />
        Envoyer un message
      </a>
    </div>
  )
}

export default function SupportWidget({ compact = false, floating = false }) {
  const [isOpen, setIsOpen] = useState(floating)

  if (compact) {
    return (
      <a
        href="mailto:contact@yemma-solutions.com?subject=Support%20Candidat"
        className="flex items-center gap-2 w-full rounded-lg border border-[#226D68]/20 bg-[#E8F4F3]/50 hover:bg-[#E8F4F3] p-3 text-sm text-[#2C2C2C] transition-colors"
      >
        <MessageCircle className="w-4 h-4 text-[#226D68] shrink-0" />
        <span className="truncate">Demandez-moi n&apos;importe quoi...</span>
      </a>
    )
  }

  if (floating) {
    return (
      <div
        className="fixed right-4 z-40 flex flex-col items-end gap-2"
        style={{ bottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        {/* Popup */}
        {isOpen && (
          <div
            className="relative w-[320px] max-w-[calc(100vw-2rem)] rounded-xl border border-gray-200 bg-white shadow-xl p-4 animate-in"
            style={{ boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)' }}
          >
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-gray-100 text-[#6b7280] transition-colors"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
            <SupportContent compact />
          </div>
        )}
        {/* Bouton flottant - compact sur mobile */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 rounded-xl shadow-lg border transition-all ${
            isOpen
              ? 'bg-[#226D68] text-white border-[#1a5a55] px-4 py-3'
              : 'bg-white text-[#2C2C2C] border-gray-200 hover:bg-[#E8F4F3] hover:border-[#226D68]/30 px-3 py-2.5 sm:px-4 sm:py-3'
          }`}
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Fermer l\'accompagnement' : 'Ouvrir l\'accompagnement Expert Yemma'}
        >
          <MessageCircle className={`h-5 w-5 shrink-0 ${isOpen ? 'text-white' : 'text-[#226D68]'}`} />
          <span className={`text-sm font-medium ${isOpen ? 'inline' : 'hidden sm:inline'}`}>
            {isOpen ? 'Fermer' : 'Expert Yemma'}
          </span>
        </button>
      </div>
    )
  }

  /* Mode inline (sidebar) */
  return (
    <div
      className="bg-[#F0FDF4] border border-[#226D68]/20 rounded-xl p-5"
      style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}
    >
      <SupportContent />
    </div>
  )
}
