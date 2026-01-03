import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

export default function Step0({ form, onNext, isFirstStep }) {
  const { register, handleSubmit, formState: { errors } } = form

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <Checkbox
            id="acceptCGU"
            {...register('acceptCGU')}
          />
          <div className="space-y-1">
            <Label htmlFor="acceptCGU" className="text-sm font-medium leading-none">
              J'accepte les Conditions Générales d'Utilisation
            </Label>
            {errors.acceptCGU && (
              <p className="text-sm text-destructive">{errors.acceptCGU.message}</p>
            )}
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <Checkbox
            id="acceptRGPD"
            {...register('acceptRGPD')}
          />
          <div className="space-y-1">
            <Label htmlFor="acceptRGPD" className="text-sm font-medium leading-none">
              J'accepte le traitement de mes données personnelles (RGPD)
            </Label>
            {errors.acceptRGPD && (
              <p className="text-sm text-destructive">{errors.acceptRGPD.message}</p>
            )}
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <Checkbox
            id="acceptVerification"
            {...register('acceptVerification')}
          />
          <div className="space-y-1">
            <Label htmlFor="acceptVerification" className="text-sm font-medium leading-none">
              J'autorise la vérification des informations fournies
            </Label>
            {errors.acceptVerification && (
              <p className="text-sm text-destructive">{errors.acceptVerification.message}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit">Continuer</Button>
      </div>
    </form>
  )
}

