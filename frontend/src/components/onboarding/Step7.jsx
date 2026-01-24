import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function Step7({ form, onNext, onPrevious, isFirstStep }) {
  const { register, handleSubmit, formState: { errors }, watch, setValue } = form
  const desiredPositions = watch('desiredPositions') || []

  const addPosition = () => {
    const newPositions = [...desiredPositions, '']
    setValue('desiredPositions', newPositions)
  }

  const removePosition = (index) => {
    const newPositions = desiredPositions.filter((_, i) => i !== index)
    setValue('desiredPositions', newPositions)
  }

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Poste(s) recherché(s) * (max 5)</Label>
          {desiredPositions.map((_, index) => (
            <div key={index} className="flex gap-2">
              <Input {...register(`desiredPositions.${index}`)} />
              {desiredPositions.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => removePosition(index)}
                >
                  Supprimer
                </Button>
              )}
            </div>
          ))}
          {desiredPositions.length < 5 && (
            <Button type="button" variant="outline" onClick={addPosition}>
              Ajouter un poste
            </Button>
          )}
          {errors.desiredPositions && (
            <p className="text-sm text-destructive">{errors.desiredPositions.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="contractType">Type de contrat souhaité *</Label>
          <select
            id="contractType"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            {...register('contractType')}
          >
            <option value="">Sélectionner...</option>
            <option value="CDI">CDI</option>
            <option value="CDD">CDD</option>
            <option value="FREELANCE">Freelance</option>
            <option value="STAGE">Stage</option>
            <option value="ALTERNANCE">Alternance</option>
          </select>
          {errors.contractType && (
            <p className="text-sm text-destructive">{errors.contractType.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="desiredLocation">Localisation souhaitée *</Label>
          <Input id="desiredLocation" {...register('desiredLocation')} />
          {errors.desiredLocation && (
            <p className="text-sm text-destructive">{errors.desiredLocation.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="mobility">Mobilité géographique</Label>
          <Input id="mobility" {...register('mobility')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="availability">Disponibilité *</Label>
          <select
            id="availability"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            {...register('availability')}
          >
            <option value="">Sélectionner...</option>
            <option value="IMMEDIATE">Immédiate</option>
            <option value="1_MONTH">1 mois</option>
            <option value="2_MONTHS">2 mois</option>
            <option value="3_MONTHS">3 mois</option>
            <option value="MORE">Plus de 3 mois</option>
          </select>
          {errors.availability && (
            <p className="text-sm text-destructive">{errors.availability.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Prétentions salariales * (CFA/mois)</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="salaryMin" className="text-sm font-normal">Minimum (CFA/mois)</Label>
              <Input
                id="salaryMin"
                type="number"
                min="0"
                placeholder="Ex: 250000"
                {...register('salaryMin', { valueAsNumber: true })}
              />
              {errors.salaryMin && (
                <p className="text-sm text-destructive">{errors.salaryMin.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="salaryMax" className="text-sm font-normal">Maximum (CFA/mois)</Label>
              <Input
                id="salaryMax"
                type="number"
                min="0"
                placeholder="Ex: 500000"
                {...register('salaryMax', { valueAsNumber: true })}
              />
              {errors.salaryMax && (
                <p className="text-sm text-destructive">{errors.salaryMax.message}</p>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Indiquez la fourchette salariale mensuelle que vous souhaitez (minimum et maximum)
          </p>
        </div>
      </div>

    </form>
  )
}

