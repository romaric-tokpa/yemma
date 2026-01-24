import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function Step5({ form, onNext, onPrevious, isFirstStep }) {
  const { register, handleSubmit, watch, setValue } = form
  const technicalSkills = watch('technicalSkills') || []
  const softSkills = watch('softSkills') || []
  const [newSoftSkill, setNewSoftSkill] = useState('')

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

  const addSoftSkill = () => {
    if (newSoftSkill.trim() && !softSkills.includes(newSoftSkill.trim())) {
      const newSkills = [...softSkills, newSoftSkill.trim()]
      setValue('softSkills', newSkills)
      setNewSoftSkill('')
    }
  }

  const removeSoftSkill = (index) => {
    const newSkills = softSkills.filter((_, i) => i !== index)
    setValue('softSkills', newSkills)
  }

  const handleSoftSkillKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addSoftSkill()
    }
  }

  // Liste prédéfinie de soft-skills courants
  const commonSoftSkills = [
    'Communication', 'Leadership', 'Travail en équipe', 'Gestion du temps',
    'Résolution de problèmes', 'Adaptabilité', 'Créativité', 'Empathie',
    'Organisation', 'Motivation', 'Persévérance', 'Esprit critique',
    'Négociation', 'Prise de décision', 'Gestion du stress', 'Autonomie'
  ]

  const addCommonSoftSkill = (skill) => {
    if (!softSkills.includes(skill)) {
      const newSkills = [...softSkills, skill]
      setValue('softSkills', newSkills)
    }
  }

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="space-y-6">
        {/* Compétences techniques */}
        <div>
          <h3 className="font-medium mb-4 text-base sm:text-lg">Compétences techniques</h3>
          <div className="space-y-4">
            {technicalSkills.map((_, index) => (
              <div key={index} className="border rounded-lg p-3 sm:p-4 space-y-3 sm:space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-sm sm:text-base">Compétence {index + 1}</h4>
                  {technicalSkills.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeTechnicalSkill(index)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm">Compétence *</Label>
                    <Input 
                      {...register(`technicalSkills.${index}.name`)} 
                      className="text-sm sm:text-base"
                      placeholder="Ex: Python, React..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm">Niveau *</Label>
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
                    <Label className="text-xs sm:text-sm">Années de pratique</Label>
                    <Input 
                      type="number" 
                      min="0"
                      className="text-sm sm:text-base"
                      {...register(`technicalSkills.${index}.yearsOfPractice`, { valueAsNumber: true })} 
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={addTechnicalSkill} className="w-full sm:w-auto text-xs sm:text-sm">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une compétence technique
            </Button>
          </div>
        </div>

        {/* Soft Skills */}
        <div className="border-t pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-[#226D68]" />
            <h3 className="font-medium text-base sm:text-lg">Compétences comportementales (Soft Skills)</h3>
          </div>
          
          <div className="space-y-4">
            {/* Champ de saisie pour ajouter une soft skill */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                value={newSoftSkill}
                onChange={(e) => setNewSoftSkill(e.target.value)}
                onKeyPress={handleSoftSkillKeyPress}
                placeholder="Ajouter une compétence comportementale..."
                className="flex-1 text-sm sm:text-base"
              />
              <Button 
                type="button" 
                variant="outline" 
                onClick={addSoftSkill}
                disabled={!newSoftSkill.trim() || softSkills.includes(newSoftSkill.trim())}
                className="w-full sm:w-auto text-xs sm:text-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter
              </Button>
            </div>

            {/* Liste prédéfinie de soft skills courants */}
            <div>
              <Label className="text-xs sm:text-sm text-muted-foreground mb-2 block">
                Suggestions courantes :
              </Label>
              <div className="flex flex-wrap gap-2">
                {commonSoftSkills.map((skill) => (
                  <Badge
                    key={skill}
                    variant={softSkills.includes(skill) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-[#226D68]/10 transition-colors text-xs sm:text-sm"
                    onClick={() => addCommonSoftSkill(skill)}
                  >
                    {skill}
                    {softSkills.includes(skill) && (
                      <span className="ml-1">✓</span>
                    )}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Liste des soft skills ajoutées */}
            {softSkills.length > 0 && (
              <div>
                <Label className="text-xs sm:text-sm font-medium mb-2 block">
                  Vos compétences comportementales ({softSkills.length}) :
                </Label>
                <div className="flex flex-wrap gap-2">
                  {softSkills.map((skill, index) => (
                    <Badge
                      key={index}
                      variant="default"
                      className="bg-[#226D68]/10 text-[#226D68] border-[#226D68]/20 text-xs sm:text-sm px-3 py-1.5 flex items-center gap-2"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSoftSkill(index)}
                        className="ml-1 hover:text-red-600 transition-colors"
                        aria-label={`Supprimer ${skill}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {softSkills.length === 0 && (
              <p className="text-xs sm:text-sm text-muted-foreground italic">
                Aucune compétence comportementale ajoutée. Cliquez sur les suggestions ci-dessus ou ajoutez-en une manuellement.
              </p>
            )}
          </div>
        </div>
      </div>

    </form>
  )
}

