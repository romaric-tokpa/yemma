import { useState, useEffect } from 'react'
import { generateAvatarUrl, generateAvatarFromFullName } from '@/utils/photoUtils'

/**
 * Composant réutilisable pour afficher une photo de profil avec fallback automatique
 * Gère automatiquement les erreurs de chargement et les URLs expirées
 */
export function ProfilePhoto({ 
  photoUrl, 
  firstName, 
  lastName, 
  fullName,
  candidateId,
  documentApi,
  className = "w-16 h-16 rounded-full object-cover",
  size = 200,
  ...props 
}) {
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState(photoUrl)
  const [hasError, setHasError] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Générer l'avatar par défaut
  const defaultAvatar = fullName 
    ? generateAvatarFromFullName(fullName)
    : generateAvatarUrl(firstName, lastName)

  // Réinitialiser quand photoUrl change
  useEffect(() => {
    if (photoUrl) {
      setCurrentPhotoUrl(photoUrl)
      setHasError(false)
    }
  }, [photoUrl])

  // Fonction pour régénérer l'URL si elle est expirée
  const refreshPhotoUrl = async () => {
    if (!candidateId || !documentApi || isRefreshing) return

    setIsRefreshing(true)
    try {
      // Récupérer tous les documents du candidat
      const documents = await documentApi.getCandidateDocuments(candidateId)
      
      // Chercher le document de type PROFILE_PHOTO
      const photoDoc = documents
        .filter(doc => 
          doc.document_type === 'PROFILE_PHOTO' || 
          doc.document_type === 'OTHER'
        )
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
      
      if (photoDoc) {
        // Récupérer une nouvelle URL présignée ou serve
        try {
          const viewResponse = await documentApi.getDocumentViewUrl(photoDoc.id)
          const newUrl = viewResponse.view_url
          setCurrentPhotoUrl(newUrl)
          setHasError(false)
          
          // Mettre à jour le profil avec la nouvelle URL
          const { candidateApi } = await import('@/services/api')
          await candidateApi.updateProfile(candidateId, { photo_url: newUrl })
        } catch (viewError) {
          // Si getDocumentViewUrl échoue, utiliser getDocumentServeUrl
          const serveUrl = documentApi.getDocumentServeUrl(photoDoc.id)
          setCurrentPhotoUrl(serveUrl)
          setHasError(false)
          
          const { candidateApi } = await import('@/services/api')
          await candidateApi.updateProfile(candidateId, { photo_url: serveUrl })
        }
      }
    } catch (error) {
      console.error('Error refreshing photo URL:', error)
      setHasError(true)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleError = async (e) => {
    if (hasError) {
      // Si on a déjà une erreur, utiliser l'avatar par défaut
      e.target.src = defaultAvatar
      return
    }

    setHasError(true)
    
    // Si c'est une URL présignée expirée, essayer de la régénérer
    if (currentPhotoUrl && (
      currentPhotoUrl.includes('X-Amz-Algorithm') ||
      currentPhotoUrl.includes('X-Amz-Signature') ||
      currentPhotoUrl.includes('localhost:9000') ||
      currentPhotoUrl.includes('minio')
    )) {
      // Essayer de régénérer l'URL
      await refreshPhotoUrl()
    } else {
      // Sinon, utiliser l'avatar par défaut
      e.target.src = defaultAvatar
    }
  }

  const handleLoad = () => {
    // Si l'image se charge avec succès, réinitialiser l'erreur
    if (hasError && currentPhotoUrl) {
      setHasError(false)
    }
  }

  const displayUrl = (currentPhotoUrl && !hasError) ? currentPhotoUrl : defaultAvatar

  return (
    <img
      src={displayUrl}
      alt={fullName || `${firstName} ${lastName}` || 'Photo de profil'}
      className={className}
      onError={handleError}
      onLoad={handleLoad}
      {...props}
    />
  )
}
