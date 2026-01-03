import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

export default function Step6({ form, onNext, onPrevious, isFirstStep }) {
  const { register, handleSubmit, formState: { errors }, watch } = form
  const cvFile = watch('cv')

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="cv">CV (PDF - obligatoire) *</Label>
          <Input
            id="cv"
            type="file"
            accept=".pdf"
            {...register('cv')}
          />
          {cvFile && (
            <p className="text-sm text-muted-foreground">
              Fichier sélectionné: {cvFile[0]?.name}
            </p>
          )}
          {errors.cv && (
            <p className="text-sm text-destructive">{errors.cv.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="additionalDocuments">Documents complémentaires (optionnel)</Label>
          <Input
            id="additionalDocuments"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            multiple
            {...register('additionalDocuments')}
          />
          <p className="text-sm text-muted-foreground">
            Formats autorisés: PDF, JPG, PNG (max 10MB par fichier)
          </p>
        </div>
      </div>

      <div className="flex justify-between">
        {!isFirstStep && (
          <Button type="button" variant="outline" onClick={onPrevious}>
            Précédent
          </Button>
        )}
        <Button type="submit" className="ml-auto">
          Suivant
        </Button>
      </div>
    </form>
  )
}

