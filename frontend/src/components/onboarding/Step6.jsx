import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Controller } from 'react-hook-form'
import { documentApi } from '@/services/api'
import { Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react'

export default function Step6({ form, onNext, onPrevious, isFirstStep, profileId, setFormData }) {
  const { control, handleSubmit, formState: { errors }, watch, setValue } = form
  const cvFile = watch('cv')
  const additionalDocuments = watch('additionalDocuments')
  
  // États pour gérer l'upload et les documents sauvegardés
  const [uploadingCV, setUploadingCV] = useState(false)
  const [uploadingDocs, setUploadingDocs] = useState(false)
  const [uploadedCVId, setUploadedCVId] = useState(null)
  const [uploadedDocIds, setUploadedDocIds] = useState([])
  const [uploadErrors, setUploadErrors] = useState({})
  const [uploadSuccess, setUploadSuccess] = useState({})

  // Fonction helper pour vérifier si un objet est un fichier valide
  const isFile = (obj) => {
    if (!obj || typeof obj !== 'object') return false
    if (typeof obj.name === 'string' && typeof obj.size === 'number' && typeof obj.type === 'string') {
      try {
        return obj instanceof File || obj instanceof Blob || obj.constructor?.name === 'File'
      } catch {
        return true
      }
    }
    return false
  }

  // Sauvegarder automatiquement le CV dès qu'il est sélectionné
  const handleCVChange = async (file) => {
    if (!file || !profileId) return
    
    // Vérifier que c'est un fichier valide
    if (!isFile(file)) {
      console.warn('CV invalide ignoré:', file)
      return
    }

    // Vérifier la taille (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadErrors(prev => ({ ...prev, cv: 'Le fichier ne doit pas dépasser 10MB' }))
      return
    }

    setUploadingCV(true)
    setUploadErrors(prev => ({ ...prev, cv: null }))
    setUploadSuccess(prev => ({ ...prev, cv: false }))

    try {
      // Supprimer l'ancien CV s'il existe
      if (uploadedCVId) {
        try {
          await documentApi.deleteDocument(uploadedCVId)
        } catch (error) {
          console.warn('Erreur lors de la suppression de l\'ancien CV:', error)
        }
      }

      // Uploader le nouveau CV
      const uploadedDoc = await documentApi.uploadDocument(file, profileId, 'CV')
      setUploadedCVId(uploadedDoc.id)
      setUploadSuccess(prev => ({ ...prev, cv: true }))
      
      // Mettre à jour le formData pour indiquer que le CV est sauvegardé
      if (setFormData) {
        setFormData(prev => ({
          ...prev,
          step6: {
            ...prev.step6,
            cv_document_id: uploadedDoc.id,
            // Ne pas garder le fichier dans formData une fois sauvegardé
            // pour éviter les problèmes de validation lors de la soumission
            cv: undefined,
          }
        }))
      }

      console.log('CV sauvegardé avec succès:', uploadedDoc.id)
    } catch (error) {
      console.error('Erreur lors de l\'upload du CV:', error)
      const errorMessage = error.response?.data?.detail || error.message || 'Erreur lors de l\'upload du CV'
      setUploadErrors(prev => ({ ...prev, cv: errorMessage }))
      // Réinitialiser le champ en cas d'erreur
      setValue('cv', null)
    } finally {
      setUploadingCV(false)
    }
  }

  // Sauvegarder automatiquement les documents complémentaires dès qu'ils sont sélectionnés
  const handleAdditionalDocumentsChange = async (files) => {
    if (!profileId) return

    setUploadingDocs(true)
    setUploadErrors(prev => ({ ...prev, additionalDocuments: null }))
    setUploadSuccess(prev => ({ ...prev, additionalDocuments: false }))

    // Si aucun fichier n'est sélectionné, on garde les documents existants
    if (!files || files.length === 0) {
      setUploadingDocs(false)
      return
    }

    // Filtrer uniquement les nouveaux fichiers valides
    const newFiles = Array.from(files).filter(file => isFile(file))
    
    if (newFiles.length === 0) {
      setUploadingDocs(false)
      return
    }

    const uploadedIds = []
    const errors = []

    try {
      // Optionnel : Supprimer les anciens documents complémentaires si on veut les remplacer
      // Pour l'instant, on ajoute les nouveaux documents aux existants
      // Si vous voulez remplacer au lieu d'ajouter, décommentez le code ci-dessous :
      /*
      if (uploadedDocIds.length > 0) {
        for (const docId of uploadedDocIds) {
          try {
            await documentApi.deleteDocument(docId)
          } catch (error) {
            console.warn(`Erreur lors de la suppression de l'ancien document ${docId}:`, error)
          }
        }
        setUploadedDocIds([])
      }
      */

      // Uploader chaque nouveau fichier
      for (const file of newFiles) {
        // Vérifier la taille (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          errors.push(`${file.name}: Le fichier ne doit pas dépasser 10MB`)
          continue
        }

        try {
          // Déterminer le type de document selon le nom
          const fileType = file.name.toLowerCase().includes('attestation') ? 'ATTESTATION' :
                          file.name.toLowerCase().includes('certificat') ? 'CERTIFICATE' :
                          file.name.toLowerCase().includes('recommandation') ? 'RECOMMENDATION_LETTER' : 'OTHER'
          
          const uploadedDoc = await documentApi.uploadDocument(file, profileId, fileType)
          uploadedIds.push(uploadedDoc.id)
          console.log(`Document ${file.name} sauvegardé avec succès:`, uploadedDoc.id)
        } catch (error) {
          console.error(`Erreur lors de l'upload de ${file.name}:`, error)
          const errorMessage = error.response?.data?.detail || error.message || `Erreur lors de l'upload de ${file.name}`
          errors.push(`${file.name}: ${errorMessage}`)
        }
      }

      // Mettre à jour les IDs des documents uploadés (ajouter aux existants)
      const allUploadedIds = [...uploadedDocIds, ...uploadedIds]
      setUploadedDocIds(allUploadedIds)

      if (errors.length > 0) {
        setUploadErrors(prev => ({ ...prev, additionalDocuments: errors.join(', ') }))
      } else {
        setUploadSuccess(prev => ({ ...prev, additionalDocuments: true }))
      }

      // Mettre à jour le formData
      if (setFormData) {
        setFormData(prev => ({
          ...prev,
          step6: {
            ...prev.step6,
            additional_document_ids: allUploadedIds,
            additionalDocuments: files, // Garder les fichiers pour la validation
          }
        }))
      }
    } catch (error) {
      console.error('Erreur lors de l\'upload des documents:', error)
      setUploadErrors(prev => ({ ...prev, additionalDocuments: 'Erreur lors de l\'upload des documents' }))
    } finally {
      setUploadingDocs(false)
    }
  }

  // Charger les documents existants au montage
  useEffect(() => {
    const loadExistingDocuments = async () => {
      if (!profileId) return

      try {
        const documents = await documentApi.getCandidateDocuments(profileId)
        
        // Trouver le CV existant
        const cvDoc = documents.find(doc => doc.document_type === 'CV' && !doc.deleted_at)
        if (cvDoc) {
          setUploadedCVId(cvDoc.id)
          setUploadSuccess(prev => ({ ...prev, cv: true }))
          // Mettre à jour formData pour indiquer que le CV existe
          if (setFormData) {
            setFormData(prev => ({
              ...prev,
              step6: {
                ...prev.step6,
                cv_document_id: cvDoc.id,
              }
            }))
          }
        }

        // Trouver les documents complémentaires existants
        const additionalDocs = documents.filter(doc => 
          doc.document_type !== 'CV' && 
          doc.document_type !== 'PROFILE_PHOTO' && 
          !doc.deleted_at
        )
        if (additionalDocs.length > 0) {
          const docIds = additionalDocs.map(doc => doc.id)
          setUploadedDocIds(docIds)
          setUploadSuccess(prev => ({ ...prev, additionalDocuments: true }))
          // Mettre à jour formData pour indiquer que les documents existent
          if (setFormData) {
            setFormData(prev => ({
              ...prev,
              step6: {
                ...prev.step6,
                additional_document_ids: docIds,
              }
            }))
          }
        }
      } catch (error) {
        console.warn('Erreur lors du chargement des documents existants:', error)
      }
    }

    loadExistingDocuments()
  }, [profileId, setFormData])

  // Fonction pour gérer la soumission du formulaire
  const handleFormSubmit = async (data) => {
    // Si le CV est déjà uploadé, on peut passer à l'étape suivante
    // Sinon, vérifier qu'un fichier CV est présent
    if (!uploadedCVId && !data.cv) {
      // Le CV n'est pas uploadé et aucun fichier n'est sélectionné
      // La validation du formulaire devrait déjà gérer cela
      return
    }
    
    // Appeler onNext pour passer à l'étape suivante
    onNext()
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="cv">CV (PDF - obligatoire) *</Label>
          <Controller
            name="cv"
            control={control}
            rules={{ 
              validate: (value) => {
                // Le CV est valide s'il est uploadé (uploadedCVId existe)
                // On ne vérifie plus value car le fichier n'est pas gardé dans formData après upload
                if (uploadedCVId) {
                  return true
                }
                // Si aucun CV n'est uploadé, vérifier qu'un fichier est sélectionné
                if (value && isFile(value)) {
                  return true
                }
                return "Le CV est obligatoire"
              }
            }}
            render={({ field: { onChange, value, ...field } }) => (
              <div className="space-y-2">
                <Input
                  id="cv"
                  type="file"
                  accept=".pdf"
                  disabled={uploadingCV}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      onChange(file)
                      handleCVChange(file)
                    }
                  }}
                  {...field}
                  value={undefined} // Réinitialiser la valeur pour permettre la sélection du même fichier
                />
                {uploadingCV && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Sauvegarde du CV en cours...</span>
                  </div>
                )}
                {uploadSuccess.cv && !uploadingCV && (
                  <div className="flex items-center gap-2 text-sm text-[#226D68]">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>CV sauvegardé avec succès</span>
                  </div>
                )}
                {uploadErrors.cv && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>{uploadErrors.cv}</span>
                    <button
                      type="button"
                      onClick={() => setUploadErrors(prev => ({ ...prev, cv: null }))}
                      className="ml-auto"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          />
          {uploadedCVId && !uploadingCV && !cvFile && (
            <p className="text-sm text-[#226D68]">
              CV déjà sauvegardé. Vous pouvez le remplacer en sélectionnant un nouveau fichier.
            </p>
          )}
          {cvFile && !uploadingCV && (
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
              <div className="space-y-2">
                <Input
                  id="additionalDocuments"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                  disabled={uploadingDocs}
                  onChange={(e) => {
                    const files = e.target.files ? Array.from(e.target.files) : []
                    onChange(files)
                    handleAdditionalDocumentsChange(files)
                  }}
                  {...field}
                  value={undefined} // Réinitialiser la valeur pour permettre la sélection des mêmes fichiers
                />
                {uploadingDocs && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Sauvegarde des documents en cours...</span>
                  </div>
                )}
                {uploadSuccess.additionalDocuments && !uploadingDocs && uploadedDocIds.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-[#226D68]">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{uploadedDocIds.length} document(s) sauvegardé(s) avec succès</span>
                  </div>
                )}
                {uploadErrors.additionalDocuments && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="flex-1">{uploadErrors.additionalDocuments}</span>
                    <button
                      type="button"
                      onClick={() => setUploadErrors(prev => ({ ...prev, additionalDocuments: null }))}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          />
          <p className="text-sm text-muted-foreground">
            Formats autorisés: PDF, JPG, PNG (max 10MB par fichier)
          </p>
          {additionalDocuments && additionalDocuments.length > 0 && !uploadingDocs && (
            <p className="text-sm text-muted-foreground">
              {additionalDocuments.length} fichier(s) sélectionné(s)
            </p>
          )}
        </div>
      </div>

    </form>
  )
}

