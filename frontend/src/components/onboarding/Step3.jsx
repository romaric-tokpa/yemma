import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2 } from 'lucide-react'

export default function Step3({ form, onNext, onPrevious, isFirstStep }) {
  const { register, handleSubmit, formState: { errors }, watch, setValue } = form
  const educations = watch('educations') || []

  const addEducation = () => {
    const newEducations = [...educations, {
      diploma: '',
      institution: '',
      country: '',
      startYear: '',
      graduationYear: new Date().getFullYear(),
      level: '',
    }]
    setValue('educations', newEducations)
  }

  const removeEducation = (index) => {
    const newEducations = educations.filter((_, i) => i !== index)
    setValue('educations', newEducations)
  }

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="space-y-6">
        {educations.map((_, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Formation {index + 1}</h3>
              {educations.length > 1 && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeEducation(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Intitulé du diplôme / formation *</Label>
                <Input {...register(`educations.${index}.diploma`)} />
              </div>

              <div className="space-y-2">
                <Label>Établissement *</Label>
                <Input {...register(`educations.${index}.institution`)} />
              </div>

              <div className="space-y-2">
                <Label>Pays</Label>
                <Input {...register(`educations.${index}.country`)} />
              </div>

              <div className="space-y-2">
                <Label>Année de début</Label>
                <Input type="number" {...register(`educations.${index}.startYear`, { valueAsNumber: true })} />
              </div>

              <div className="space-y-2">
                <Label>Année d'obtention *</Label>
                <Input type="number" {...register(`educations.${index}.graduationYear`, { valueAsNumber: true })} />
              </div>

              <div className="space-y-2">
                <Label>Niveau *</Label>
                <Input {...register(`educations.${index}.level`)} placeholder="Bac, Bac+2, Bac+5, etc." />
              </div>
            </div>
          </div>
        ))}

        <Button type="button" variant="outline" onClick={addEducation}>
          <Plus className="w-4 h-4 mr-2" />
          Ajouter une formation
        </Button>
      </div>

      {errors.educations && (
        <p className="text-sm text-destructive">{errors.educations.message}</p>
      )}

    </form>
  )
}

