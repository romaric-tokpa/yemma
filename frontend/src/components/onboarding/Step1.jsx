import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Upload, X } from 'lucide-react'

export default function Step1({ form, onNext, onPrevious, isFirstStep, profileId, formData: parentFormData }) {
  const { register, handleSubmit, formState: { errors }, watch, setValue } = form
  const [photoPreview, setPhotoPreview] = useState(null)
  const [photoUrl, setPhotoUrl] = useState(watch('photoUrl') || null)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)

  // Charger la photo existante depuis le profil
  useEffect(() => {
    const loadExistingPhoto = async () => {
      if (profileId) {
        try {
          const { candidateApi } = await import('@/services/api')
          const profile = await candidateApi.getMyProfile()
          if (profile.photo_url) {
            // Toujours recharger depuis le profil pour avoir l'URL la plus récente
            // Si l'URL présignée a expiré, onError la régénérera automatiquement
            setPhotoUrl(profile.photo_url)
            setValue('photoUrl', profile.photo_url)
          } else {
            // Pas de photo dans le profil, réinitialiser
            setPhotoUrl(null)
            setValue('photoUrl', null)
          }
        } catch (error) {
          console.error('Erreur lors du chargement de la photo:', error)
        }
      }
    }
    loadExistingPhoto()
  }, [profileId, setValue]) // Retirer photoUrl des dépendances pour recharger à chaque fois

  // Fonction pour régénérer l'URL de la photo si elle a expiré
  const regeneratePhotoUrl = async () => {
    if (!profileId) return
    
    try {
      const { documentApi, candidateApi } = await import('@/services/api')
      // Récupérer tous les documents du candidat
      const documents = await documentApi.getCandidateDocuments(profileId)
      // Trouver le document le plus récent de type OTHER (photo de profil)
      const photoDoc = documents
        .filter(doc => doc.document_type === 'OTHER')
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
      
      if (photoDoc) {
        // Régénérer l'URL présignée
        const viewResponse = await documentApi.getDocumentViewUrl(photoDoc.id)
        const newUrl = viewResponse.view_url
        
        // Mettre à jour le profil avec la nouvelle URL
        await candidateApi.updateProfile(profileId, { photo_url: newUrl })
        
        // Mettre à jour l'état local
        setPhotoUrl(newUrl)
        setValue('photoUrl', newUrl)
        
        return newUrl
      }
    } catch (error) {
      console.error('Erreur lors de la régénération de l\'URL de la photo:', error)
    }
    return null
  }

  // Gérer l'upload de la photo
  const handlePhotoUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file || !profileId) return

    // Valider le type de fichier
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image (JPG, PNG)')
      return
    }

    // Valider la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La photo ne doit pas dépasser 5MB')
      return
    }

    try {
      setIsUploadingPhoto(true)
      
      // Upload vers le document service
      const { documentApi } = await import('@/services/api')
      const uploadedDoc = await documentApi.uploadDocument(file, profileId, 'OTHER')
      const viewResponse = await documentApi.getDocumentViewUrl(uploadedDoc.id)
      const viewUrl = viewResponse.view_url
      
      // Mettre à jour le profil avec l'URL de la photo
      const { candidateApi } = await import('@/services/api')
      await candidateApi.updateProfile(profileId, { photo_url: viewUrl })
      
      // Mettre à jour l'état local
      setPhotoPreview(null)
      setPhotoUrl(viewUrl)
      setValue('photoUrl', viewUrl)
    } catch (error) {
      console.error('Erreur lors de l\'upload de la photo:', error)
      alert('Erreur lors de l\'upload de la photo: ' + (error.response?.data?.detail || error.message))
      setPhotoPreview(null)
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  // Générer un avatar par défaut basé sur les initiales
  const generateAvatarUrl = (firstName, lastName) => {
    const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U'
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=200&background=random&color=fff&bold=true`
  }

  // Récupérer les initiales depuis le formulaire
  const firstName = watch('firstName') || ''
  const lastName = watch('lastName') || ''
  const defaultAvatarUrl = generateAvatarUrl(firstName, lastName)

  // Afficher la photo ou l'avatar par défaut (même logique que Step2 pour le logo)
  const displayPhoto = photoUrl || photoPreview || defaultAvatarUrl

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      {/* Section Photo de profil */}
      <div className="border rounded-lg p-4 bg-muted/50">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <div className="relative">
              <img
                src={displayPhoto}
                alt="Photo de profil"
                className="w-16 h-16 rounded-lg object-cover border-2 border-primary"
                onError={async (e) => {
                  // Si l'URL a échoué et que c'était une URL présignée, essayer de la régénérer
                  if (photoUrl && (photoUrl.includes('X-Amz-Algorithm') || photoUrl.includes('localhost:9000') || photoUrl.includes('minio'))) {
                    console.log('URL présignée expirée, régénération...')
                    const newUrl = await regeneratePhotoUrl()
                    if (newUrl) {
                      // Réessayer avec la nouvelle URL
                      e.target.src = newUrl
                      return
                    }
                  }
                  // Si la régénération a échoué ou si ce n'est pas une URL présignée, utiliser l'avatar par défaut
                  e.target.src = defaultAvatarUrl
                }}
              />
              {isUploadingPhoto && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <Label htmlFor="photo" className="text-sm font-medium">
              Photo de profil (facultative)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="photo"
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                onChange={handlePhotoUpload}
                disabled={isUploadingPhoto}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('photo')?.click()}
                disabled={isUploadingPhoto}
              >
                <Upload className="w-4 h-4 mr-2" />
                {photoUrl || photoPreview ? 'Changer' : 'Télécharger'}
              </Button>
              {(photoUrl || photoPreview) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPhotoPreview(null)
                    setPhotoUrl(null)
                    setValue('photoUrl', null)
                    // Supprimer la photo du backend si elle existe
                    if (photoUrl && profileId) {
                      import('@/services/api').then(({ candidateApi }) => {
                        candidateApi.updateProfile(profileId, { photo_url: null }).catch(console.error)
                      })
                    }
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Formats: JPG, PNG (max 5MB). Si non renseigné, un avatar sera généré.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">Prénom *</Label>
          <Input id="firstName" {...register('firstName')} />
          {errors.firstName && (
            <p className="text-sm text-destructive">{errors.firstName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Nom *</Label>
          <Input id="lastName" {...register('lastName')} />
          {errors.lastName && (
            <p className="text-sm text-destructive">{errors.lastName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date de naissance *</Label>
          <Input id="dateOfBirth" type="date" {...register('dateOfBirth')} />
          {errors.dateOfBirth && (
            <p className="text-sm text-destructive">{errors.dateOfBirth.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="nationality">Nationalité *</Label>
          <Input id="nationality" {...register('nationality')} />
          {errors.nationality && (
            <p className="text-sm text-destructive">{errors.nationality.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input id="email" type="email" {...register('email')} />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone *</Label>
          <Input id="phone" type="tel" {...register('phone')} />
          {errors.phone && (
            <p className="text-sm text-destructive">{errors.phone.message}</p>
          )}
        </div>

        <div className="space-y-2 col-span-2">
          <Label htmlFor="address">Adresse / Ville *</Label>
          <Input id="address" {...register('address')} />
          {errors.address && (
            <p className="text-sm text-destructive">{errors.address.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">Ville *</Label>
          <Input id="city" {...register('city')} />
          {errors.city && (
            <p className="text-sm text-destructive">{errors.city.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">Pays *</Label>
          <Input id="country" {...register('country')} />
          {errors.country && (
            <p className="text-sm text-destructive">{errors.country.message}</p>
          )}
        </div>

        <div className="space-y-2 col-span-2">
          <Label htmlFor="profileTitle">Titre du profil *</Label>
          <Input id="profileTitle" {...register('profileTitle')} />
          {errors.profileTitle && (
            <p className="text-sm text-destructive">{errors.profileTitle.message}</p>
          )}
        </div>

        <div className="space-y-2 col-span-2">
          <Label htmlFor="professionalSummary">Résumé professionnel (min. 300 caractères) *</Label>
          <Textarea 
            id="professionalSummary" 
            rows={5}
            {...register('professionalSummary')} 
          />
          {errors.professionalSummary && (
            <p className="text-sm text-destructive">{errors.professionalSummary.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="sector">Secteur(s) d'activité *</Label>
          <Input id="sector" {...register('sector')} />
          {errors.sector && (
            <p className="text-sm text-destructive">{errors.sector.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="mainJob">Métier principal *</Label>
          <Input id="mainJob" {...register('mainJob')} />
          {errors.mainJob && (
            <p className="text-sm text-destructive">{errors.mainJob.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="totalExperience">Années d'expérience totale *</Label>
          <Input id="totalExperience" type="number" min="0" {...register('totalExperience', { valueAsNumber: true })} />
          {errors.totalExperience && (
            <p className="text-sm text-destructive">{errors.totalExperience.message}</p>
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

