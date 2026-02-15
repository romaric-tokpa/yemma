/**
 * Modale de consentement (Étape 0) — Bloquante
 * Conformité CGU, RGPD et autorisation de vérification.
 * Impossible de fermer sans accepter.
 */
import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const ConsentModalOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
))
ConsentModalOverlay.displayName = 'ConsentModalOverlay'

export function ConsentModal({ open = true, onAccept, loading, error }) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={() => {}}>
      <DialogPrimitive.Portal>
        <ConsentModalOverlay />
        <DialogPrimitive.Content
          className="fixed left-[50%] top-[50%] z-50 w-full max-w-[calc(100vw-2rem)] sm:max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-[#E5E7EB] bg-white p-6 shadow-xl rounded-xl"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          aria-describedby="consent-description"
        >
          <DialogPrimitive.Title className="text-xl font-bold text-[#2C2C2C]">
            Bienvenue sur Yemma Solutions 🌟
          </DialogPrimitive.Title>
          <DialogPrimitive.Description id="consent-description" className="text-sm text-[#6b7280] mt-2 leading-relaxed">
            Avant de créer votre profil, veuillez prendre connaissance et accepter nos conditions d&apos;utilisation, notre politique de confidentialité, et autoriser nos experts à vérifier vos informations.
          </DialogPrimitive.Description>
          <div className="mt-4 flex flex-wrap gap-x-2 gap-y-1">
            <a
              href="/legal/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#226D68] font-medium hover:text-[#1a5a55] underline underline-offset-2"
            >
              CGU
            </a>
            <span className="text-[#6b7280]">et</span>
            <a
              href="/legal/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#226D68] font-medium hover:text-[#1a5a55] underline underline-offset-2"
            >
              Politique de confidentialité
            </a>
          </div>
          {error && (
            <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm" role="alert">
              {error}
            </div>
          )}
          <div className="mt-6">
            <Button
              onClick={onAccept}
              disabled={loading}
              className="w-full h-12 text-base font-semibold bg-[#226D68] hover:bg-[#1a5a55] text-white focus-visible:ring-2 focus-visible:ring-[#226D68] focus-visible:ring-offset-2 disabled:opacity-50 rounded-lg transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enregistrement…
                </span>
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2 inline" strokeWidth={2.5} />
                  J&apos;accepte et je commence
                </>
              )}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
