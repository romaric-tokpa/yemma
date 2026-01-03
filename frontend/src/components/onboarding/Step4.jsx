import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2 } from 'lucide-react'

export default function Step4({ form, onNext, onPrevious, isFirstStep }) {
  const { register, handleSubmit, watch, setValue } = form
  const certifications = watch('certifications') || []

  const addCertification = () => {
    const newCertifications = [...certifications, {
      title: '',
      issuer: '',
      year: new Date().getFullYear(),
      expirationDate: '',
      verificationUrl: '',
      certificationId: '',
    }]
    setValue('certifications', newCertifications)
  }

  const removeCertification = (index) => {
    const newCertifications = certifications.filter((_, i) => i !== index)
    setValue('certifications', newCertifications)
  }

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="space-y-6">
        {certifications.map((_, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Certification {index + 1}</h3>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => removeCertification(index)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Intitulé de la certification *</Label>
                <Input {...register(`certifications.${index}.title`)} />
              </div>

              <div className="space-y-2">
                <Label>Organisme délivreur *</Label>
                <Input {...register(`certifications.${index}.issuer`)} />
              </div>

              <div className="space-y-2">
                <Label>Année d'obtention *</Label>
                <Input type="number" {...register(`certifications.${index}.year`, { valueAsNumber: true })} />
              </div>

              <div className="space-y-2">
                <Label>Date d'expiration</Label>
                <Input type="date" {...register(`certifications.${index}.expirationDate`)} />
              </div>

              <div className="space-y-2">
                <Label>URL de vérification</Label>
                <Input type="url" {...register(`certifications.${index}.verificationUrl`)} />
              </div>

              <div className="space-y-2">
                <Label>ID de la certification</Label>
                <Input {...register(`certifications.${index}.certificationId`)} />
              </div>
            </div>
          </div>
        ))}

        <Button type="button" variant="outline" onClick={addCertification}>
          <Plus className="w-4 h-4 mr-2" />
          Ajouter une certification
        </Button>
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

