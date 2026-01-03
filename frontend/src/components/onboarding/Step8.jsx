import { Button } from '@/components/ui/button'

export default function Step8({ formData, onSubmit, onPrevious, isFirstStep }) {
  return (
    <div className="space-y-6">
      <div className="bg-muted p-4 rounded-lg">
        <h3 className="font-medium mb-2">Récapitulatif de votre profil</h3>
        <p className="text-sm text-muted-foreground">
          Veuillez vérifier toutes les informations avant de soumettre votre profil.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Informations personnelles</h4>
          <pre className="text-sm bg-muted p-4 rounded overflow-auto">
            {JSON.stringify(formData.step1 || {}, null, 2)}
          </pre>
        </div>

        <div>
          <h4 className="font-medium mb-2">Expériences</h4>
          <pre className="text-sm bg-muted p-4 rounded overflow-auto">
            {JSON.stringify(formData.step2 || {}, null, 2)}
          </pre>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
        <p className="text-sm text-yellow-800">
          ⚠️ Votre profil sera analysé par notre équipe RH avant publication dans la CVthèque.
        </p>
      </div>

      <div className="flex justify-between">
        {!isFirstStep && (
          <Button type="button" variant="outline" onClick={onPrevious}>
            Précédent
          </Button>
        )}
        <Button onClick={onSubmit} className="ml-auto">
          Soumettre mon profil pour validation
        </Button>
      </div>
    </div>
  )
}

