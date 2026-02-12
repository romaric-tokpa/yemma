import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

/**
 * Dialog de confirmation de déconnexion - design compact et conforme à la charte Yemma
 */
export function LogoutConfirmDialog({ open, onOpenChange, onConfirm }) {
  const handleConfirm = () => {
    onConfirm?.()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0 gap-0 overflow-hidden border-[#e5e7eb] shadow-lg">
        <div className="p-4 pt-5 pr-12">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#e76f51]/10 flex items-center justify-center flex-shrink-0">
              <LogOut className="w-5 h-5 text-[#e76f51]" />
            </div>
            <DialogHeader className="flex-1 p-0 space-y-1">
              <DialogTitle className="text-base font-semibold text-[#2C2C2C]">
                Se déconnecter ?
              </DialogTitle>
              <p className="text-sm text-[#9ca3af] leading-relaxed">
                Vous devrez vous reconnecter pour accéder à votre espace.
              </p>
            </DialogHeader>
          </div>
        </div>
        <DialogFooter className="flex flex-row-reverse gap-2 p-4 pt-0 border-t border-[#e5e7eb]">
          <Button
            size="sm"
            onClick={handleConfirm}
            className="h-8 px-4 bg-[#e76f51] hover:bg-[#c04a2f] text-white text-sm font-medium"
          >
            Se déconnecter
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 px-4 border-[#e5e7eb] text-[#2C2C2C] hover:bg-[#F4F6F8] text-sm"
          >
            Annuler
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
