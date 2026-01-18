import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Controller } from 'react-hook-form'

export default function Step0({ form, onNext, isFirstStep }) {
  const { handleSubmit, formState: { errors }, control } = form

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <Controller
            name="acceptCGU"
            control={control}
            defaultValue={false}
            render={({ field }) => (
              <Checkbox
                id="acceptCGU"
                checked={field.value || false}
                onCheckedChange={(checked) => field.onChange(checked === true)}
              />
            )}
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
          <Controller
            name="acceptRGPD"
            control={control}
            defaultValue={false}
            render={({ field }) => (
              <Checkbox
                id="acceptRGPD"
                checked={field.value || false}
                onCheckedChange={(checked) => field.onChange(checked === true)}
              />
            )}
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
          <Controller
            name="acceptVerification"
            control={control}
            defaultValue={false}
            render={({ field }) => (
              <Checkbox
                id="acceptVerification"
                checked={field.value || false}
                onCheckedChange={(checked) => field.onChange(checked === true)}
              />
            )}
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

