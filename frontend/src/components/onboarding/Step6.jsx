import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Controller } from 'react-hook-form'

export default function Step6({ form, onNext, onPrevious, isFirstStep }) {
  const { control, handleSubmit, formState: { errors }, watch } = form
  const cvFile = watch('cv')
  const additionalDocuments = watch('additionalDocuments')

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="cv">CV (PDF - obligatoire) *</Label>
          <Controller
            name="cv"
            control={control}
            rules={{ required: "Le CV est obligatoire" }}
            render={({ field: { onChange, value, ...field } }) => (
              <Input
                id="cv"
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  // Extraire le fichier du FileList
                  const file = e.target.files?.[0]
                  onChange(file) // Passer directement le File, pas le FileList
                }}
                {...field}
              />
            )}
          />
          {cvFile && (
            <p className="text-sm text-muted-foreground">
              Fichier sélectionné: {cvFile.name}
            </p>
          )}
          {errors.cv && (
            <p className="text-sm text-destructive">{errors.cv.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="additionalDocuments">Documents complémentaires (optionnel)</Label>
          <Controller
            name="additionalDocuments"
            control={control}
            render={({ field: { onChange, value, ...field } }) => (
              <Input
                id="additionalDocuments"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                multiple
                onChange={(e) => {
                  // Convertir FileList en tableau de Files
                  const files = e.target.files ? Array.from(e.target.files) : []
                  onChange(files)
                }}
                {...field}
              />
            )}
          />
          <p className="text-sm text-muted-foreground">
            Formats autorisés: PDF, JPG, PNG (max 10MB par fichier)
          </p>
          {additionalDocuments && additionalDocuments.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {additionalDocuments.length} fichier(s) sélectionné(s)
            </p>
          )}
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

