import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Trash2, Upload, X, Building2, FileText, Save, CheckCircle2 } from 'lucide-react'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { candidateApi } from '@/services/api'
import { mapStep2ToBackend } from '@/utils/onboardingApiMapper'

export default function Step2({ form, onNext, onPrevious, isFirstStep, profileId }) {
  const { register, handleSubmit, formState: { errors }, watch, setValue } = form
  const experiences = watch('experiences') || []
  const [uploadingLogos, setUploadingLogos] = useState({})
  const [uploadingDocs, setUploadingDocs] = useState({})
  const [savingExperiences, setSavingExperiences] = useState({})
  const [savedExperiences, setSavedExperiences] = useState(new Set())

  const addExperience = () => {
    const newExperiences = [...experiences, {
      companyName: '',
      companyLogoUrl: null,
      position: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
      description: '',
      achievements: '',
      hasDocument: false,
      documentId: null,
    }]
    setValue('experiences', newExperiences)
  }

  const removeExperience = async (index) => {
    const exp = experiences[index]
    // Si l'expérience a un ID (sauvegardée), la supprimer du backend
    if (exp?.id && profileId) {
      try {
        await candidateApi.deleteExperience(profileId, exp.id)
      } catch (error) {
        console.error('Erreur lors de la suppression de l\'expérience:', error)
      }
    }
    const newExperiences = experiences.filter((_, i) => i !== index)
    setValue('experiences', newExperiences)
    // Retirer de la liste des expériences sauvegardées
    setSavedExperiences(prev => {
      const newSet = new Set(prev)
      newSet.delete(index)
      return newSet
    })
  }

  // Sauvegarder une expérience individuelle
  const saveSingleExperience = async (index) => {
    const exp = experiences[index]
    if (!exp || !profileId) return

    // Valider les champs obligatoires
    if (!exp.companyName || !exp.position || !exp.startDate || !exp.description) {
      alert('Veuillez remplir tous les champs obligatoires (Nom de l\'entreprise, Poste, Date de début, Description)')
      return
    }

    try {
      setSavingExperiences(prev => ({ ...prev, [index]: true }))
      
      // Mapper l'expérience vers le format backend (les dates sont déjà converties dans le mapper)
      const backendExp = mapStep2ToBackend({ experiences: [exp] })[0]
      
      if (exp.id) {
        // Mettre à jour l'expérience existante : supprimer et recréer
        await candidateApi.deleteExperience(profileId, exp.id)
        const createdExp = await candidateApi.createExperience(profileId, backendExp)
        // Mettre à jour l'expérience avec le nouvel ID
        const updated = [...experiences]
        updated[index] = { ...exp, id: createdExp.id }
        setValue('experiences', updated)
      } else {
        // Créer une nouvelle expérience
        const createdExp = await candidateApi.createExperience(profileId, backendExp)
        // Mettre à jour l'expérience avec l'ID retourné
        const updated = [...experiences]
        updated[index] = { ...exp, id: createdExp.id }
        setValue('experiences', updated)
      }
      
      // Marquer comme sauvegardée
      setSavedExperiences(prev => new Set([...prev, index]))
      
      // Afficher un message de succès temporaire
      setTimeout(() => {
        setSavedExperiences(prev => {
          const newSet = new Set(prev)
          newSet.delete(index)
          return newSet
        })
      }, 3000)
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'expérience:', error)
      alert('Erreur lors de la sauvegarde: ' + (error.response?.data?.detail || error.message))
    } finally {
      setSavingExperiences(prev => ({ ...prev, [index]: false }))
    }
  }

  // Générer un avatar logo d'entreprise par défaut
  const generateCompanyAvatar = (companyName) => {
    const initials = companyName
      ? companyName.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
      : 'CO'
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=100&background=random&color=fff&bold=true&format=svg`
  }

  // Gérer l'upload du logo d'entreprise
  const handleLogoUpload = async (event, index) => {
    const file = event.target.files?.[0]
    if (!file || !profileId) return

    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image (JPG, PNG)')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Le logo ne doit pas dépasser 2MB')
      return
    }

    try {
      setUploadingLogos(prev => ({ ...prev, [index]: true }))
      
      const { documentApi } = await import('@/services/api')
      const uploadedDoc = await documentApi.uploadDocument(file, profileId, 'OTHER')
      const viewResponse = await documentApi.getDocumentViewUrl(uploadedDoc.id)
      const viewUrl = viewResponse.view_url
      
      const updatedExperiences = [...experiences]
      updatedExperiences[index].companyLogoUrl = viewUrl
      setValue('experiences', updatedExperiences)
    } catch (error) {
      console.error('Erreur lors de l\'upload du logo:', error)
      alert('Erreur lors de l\'upload du logo: ' + (error.response?.data?.detail || error.message))
    } finally {
      setUploadingLogos(prev => ({ ...prev, [index]: false }))
    }
  }

  // Gérer l'upload du document justificatif
  const handleDocumentUpload = async (event, index) => {
    const file = event.target.files?.[0]
    if (!file || !profileId) return

    if (file.size > 10 * 1024 * 1024) {
      alert('Le document ne doit pas dépasser 10MB')
      return
    }

    try {
      setUploadingDocs(prev => ({ ...prev, [index]: true }))
      
      // Déterminer le type de document selon le nom
      const fileName = file.name.toLowerCase()
      let docType = 'OTHER'
      if (fileName.includes('attestation') || fileName.includes('certificat')) {
        docType = 'ATTESTATION'
      } else if (fileName.includes('recommandation') || fileName.includes('lettre')) {
        docType = 'RECOMMENDATION_LETTER'
      } else if (fileName.includes('contrat')) {
        // Utiliser OTHER si CONTRACT n'existe pas, sinon utiliser le type approprié
        docType = 'OTHER'
      }
      
      const { documentApi } = await import('@/services/api')
      const uploadedDoc = await documentApi.uploadDocument(file, profileId, docType)
      
      const updatedExperiences = [...experiences]
      updatedExperiences[index].documentId = uploadedDoc.id
      updatedExperiences[index].hasDocument = true
      setValue('experiences', updatedExperiences)
    } catch (error) {
      console.error('Erreur lors de l\'upload du document:', error)
      alert('Erreur lors de l\'upload du document: ' + (error.response?.data?.detail || error.message))
    } finally {
      setUploadingDocs(prev => ({ ...prev, [index]: false }))
    }
  }

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="space-y-6">
        {experiences.map((_, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">Expérience {index + 1}</h3>
                {savedExperiences.has(index) && (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Sauvegardée
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => saveSingleExperience(index)}
                  disabled={savingExperiences[index]}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {savingExperiences[index] ? 'Sauvegarde...' : 'Sauvegarder'}
                </Button>
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
            </div>

            {/* Logo d'entreprise */}
            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="relative">
                    <img
                      src={experiences[index]?.companyLogoUrl || generateCompanyAvatar(experiences[index]?.companyName || '')}
                      alt={`Logo ${experiences[index]?.companyName || 'entreprise'}`}
                      className="w-16 h-16 rounded-lg object-cover border-2 border-primary"
                      onError={(e) => {
                        e.target.src = generateCompanyAvatar(experiences[index]?.companyName || '')
                      }}
                    />
                    {uploadingLogos[index] && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`logo-${index}`} className="text-sm font-medium">
                    Logo de l'entreprise (facultatif)
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id={`logo-${index}`}
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={(e) => handleLogoUpload(e, index)}
                      disabled={uploadingLogos[index]}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById(`logo-${index}`)?.click()}
                      disabled={uploadingLogos[index]}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {experiences[index]?.companyLogoUrl ? 'Changer' : 'Télécharger'}
                    </Button>
                    {experiences[index]?.companyLogoUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const updated = [...experiences]
                          updated[index].companyLogoUrl = null
                          setValue('experiences', updated)
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Formats: JPG, PNG (max 2MB). Si non renseigné, un avatar sera généré.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom de l'entreprise *</Label>
                <Input 
                  {...register(`experiences.${index}.companyName`)}
                  onChange={(e) => {
                    // Mettre à jour le nom et forcer la mise à jour de l'avatar si pas de logo
                    const updated = [...experiences]
                    updated[index].companyName = e.target.value
                    // Si pas de logo personnalisé, l'avatar sera mis à jour automatiquement
                    setValue('experiences', updated)
                  }}
                />
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
                <RichTextEditor
                  value={experiences[index]?.description || ''}
                  onChange={(value) => {
                    const updated = [...experiences]
                    updated[index].description = value
                    setValue('experiences', updated)
                  }}
                  placeholder="Décrivez vos missions et responsabilités..."
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label>Réalisations majeures</Label>
                <RichTextEditor
                  value={experiences[index]?.achievements || ''}
                  onChange={(value) => {
                    const updated = [...experiences]
                    updated[index].achievements = value
                    setValue('experiences', updated)
                  }}
                  placeholder="Listez vos réalisations et accomplissements..."
                />
              </div>

              {/* Document justificatif */}
              <div className="space-y-2 col-span-2 border rounded-lg p-4 bg-muted/30">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={`document-${index}`} className="text-sm font-medium">
                      Document justificatif (facultatif)
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Attestation, certificat de travail, lettre de recommandation, contrat, etc. (PDF, JPG, PNG - max 10MB)
                    </p>
                    <div className="flex items-center gap-2">
                      <Input
                        id={`document-${index}`}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleDocumentUpload(e, index)}
                        disabled={uploadingDocs[index]}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById(`document-${index}`)?.click()}
                        disabled={uploadingDocs[index]}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {uploadingDocs[index] ? 'Upload en cours...' : (experiences[index]?.documentId ? 'Changer le document' : 'Télécharger un document')}
                      </Button>
                      {experiences[index]?.documentId && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            try {
                              const { documentApi } = await import('@/services/api')
                              await documentApi.deleteDocument(experiences[index].documentId)
                              const updated = [...experiences]
                              updated[index].documentId = null
                              updated[index].hasDocument = false
                              setValue('experiences', updated)
                            } catch (error) {
                              console.error('Erreur lors de la suppression:', error)
                            }
                          }}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Supprimer
                        </Button>
                      )}
                    </div>
                    {experiences[index]?.documentId && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        Document téléchargé avec succès
                      </p>
                    )}
                  </div>
                </div>
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

