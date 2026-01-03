import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2 } from 'lucide-react'

export default function Step5({ form, onNext, onPrevious, isFirstStep }) {
  const { register, handleSubmit, watch, setValue } = form
  const technicalSkills = watch('technicalSkills') || []

  const addTechnicalSkill = () => {
    const newSkills = [...technicalSkills, {
      name: '',
      level: 'BEGINNER',
      yearsOfPractice: 0,
    }]
    setValue('technicalSkills', newSkills)
  }

  const removeTechnicalSkill = (index) => {
    const newSkills = technicalSkills.filter((_, i) => i !== index)
    setValue('technicalSkills', newSkills)
  }

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="space-y-6">
        <div>
          <h3 className="font-medium mb-4">Compétences techniques</h3>
          <div className="space-y-4">
            {technicalSkills.map((_, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Compétence {index + 1}</h4>
                  {technicalSkills.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeTechnicalSkill(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Compétence *</Label>
                    <Input {...register(`technicalSkills.${index}.name`)} />
                  </div>

                  <div className="space-y-2">
                    <Label>Niveau *</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      {...register(`technicalSkills.${index}.level`)}
                    >
                      <option value="BEGINNER">Débutant</option>
                      <option value="INTERMEDIATE">Intermédiaire</option>
                      <option value="ADVANCED">Avancé</option>
                      <option value="EXPERT">Expert</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Années de pratique</Label>
                    <Input 
                      type="number" 
                      min="0"
                      {...register(`technicalSkills.${index}.yearsOfPractice`, { valueAsNumber: true })} 
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={addTechnicalSkill}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une compétence technique
            </Button>
          </div>
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

