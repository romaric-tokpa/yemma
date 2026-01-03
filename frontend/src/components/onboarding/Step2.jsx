import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Trash2 } from 'lucide-react'

export default function Step2({ form, onNext, onPrevious, isFirstStep }) {
  const { register, handleSubmit, formState: { errors }, watch, setValue } = form
  const experiences = watch('experiences') || []

  const addExperience = () => {
    const newExperiences = [...experiences, {
      companyName: '',
      position: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
      description: '',
      achievements: '',
      hasDocument: false,
    }]
    setValue('experiences', newExperiences)
  }

  const removeExperience = (index) => {
    const newExperiences = experiences.filter((_, i) => i !== index)
    setValue('experiences', newExperiences)
  }

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="space-y-6">
        {experiences.map((_, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Expérience {index + 1}</h3>
              {experiences.length > 1 && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeExperience(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom de l'entreprise *</Label>
                <Input {...register(`experiences.${index}.companyName`)} />
              </div>

              <div className="space-y-2">
                <Label>Poste occupé *</Label>
                <Input {...register(`experiences.${index}.position`)} />
              </div>

              <div className="space-y-2">
                <Label>Date de début *</Label>
                <Input type="date" {...register(`experiences.${index}.startDate`)} />
              </div>

              <div className="space-y-2">
                <Label>Date de fin</Label>
                <Input 
                  type="date" 
                  {...register(`experiences.${index}.endDate`)}
                  disabled={watch(`experiences.${index}.isCurrent`)}
                />
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`isCurrent-${index}`}
                    {...register(`experiences.${index}.isCurrent`)}
                  />
                  <Label htmlFor={`isCurrent-${index}`} className="text-sm">
                    En cours
                  </Label>
                </div>
              </div>

              <div className="space-y-2 col-span-2">
                <Label>Description des missions *</Label>
                <Textarea rows={4} {...register(`experiences.${index}.description`)} />
              </div>

              <div className="space-y-2 col-span-2">
                <Label>Réalisations majeures</Label>
                <Textarea rows={3} {...register(`experiences.${index}.achievements`)} />
              </div>

              <div className="flex items-center space-x-2 col-span-2">
                <Checkbox
                  id={`hasDocument-${index}`}
                  {...register(`experiences.${index}.hasDocument`)}
                />
                <Label htmlFor={`hasDocument-${index}`}>
                  Cette expérience est justifiable par un document
                </Label>
              </div>
            </div>
          </div>
        ))}

        <Button type="button" variant="outline" onClick={addExperience}>
          <Plus className="w-4 h-4 mr-2" />
          Ajouter une expérience
        </Button>
      </div>

      {errors.experiences && (
        <p className="text-sm text-destructive">{errors.experiences.message}</p>
      )}

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

