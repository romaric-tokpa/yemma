/**
 * Utilitaires pour la gestion des photos de profil
 */

/**
 * Génère un avatar par défaut basé sur les initiales
 */
export const generateAvatarUrl = (firstName, lastName) => {
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U'
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=200&background=random&color=fff&bold=true`
}

/**
 * Génère un avatar par défaut basé sur un nom complet
 */
export const generateAvatarFromFullName = (fullName) => {
  const parts = fullName.split(' ').filter(Boolean)
  const initials = parts.length >= 2 
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : (parts[0]?.[0] || 'U').toUpperCase()
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=200&background=random&color=fff&bold=true`
}

/**
 * Vérifie si une URL est une URL présignée (S3/MinIO)
 */
export const isPresignedUrl = (url) => {
  if (!url) return false
  return url.includes('X-Amz-Algorithm') || 
         url.includes('X-Amz-Signature') ||
         url.includes('X-Amz-Credential') ||
         url.includes('localhost:9000') ||
         url.includes('minio') ||
         url.includes('amazonaws.com')
}

/**
 * Vérifie si une URL de photo est valide et accessible
 */
export const isValidPhotoUrl = async (url) => {
  if (!url) return false
  if (!isPresignedUrl(url)) return true // URLs non-présignées sont considérées valides
  
  try {
    const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' })
    // En mode no-cors, on ne peut pas vérifier le statut, donc on assume que c'est valide
    // si l'URL existe
    return true
  } catch (error) {
    return false
  }
}

/**
 * Récupère une nouvelle URL présignée pour une photo de profil
 * en cherchant le document de type PROFILE_PHOTO
 */
export const refreshProfilePhotoUrl = async (candidateId, documentApi) => {
  try {
    // Récupérer tous les documents du candidat
    const documents = await documentApi.getCandidateDocuments(candidateId)
    
    // Chercher le document de type PROFILE_PHOTO ou OTHER (pour rétrocompatibilité)
    const photoDoc = documents
      .filter(doc => 
        doc.document_type === 'PROFILE_PHOTO' || 
        doc.document_type === 'OTHER'
      )
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
    
    if (photoDoc) {
      // Récupérer une nouvelle URL présignée
      const viewResponse = await documentApi.getDocumentViewUrl(photoDoc.id)
      return viewResponse.view_url
    }
    
    return null
  } catch (error) {
    console.error('Error refreshing profile photo URL:', error)
    return null
  }
}

/**
 * Construit l'URL complète d'une photo de profil à partir d'une photo_url (relative ou absolue)
 * @param {string|null|undefined} photoUrl - L'URL de la photo (peut être relative, absolue, ou null)
 * @param {object} documentApi - L'instance de l'API des documents
 * @returns {string|null} - L'URL complète de la photo ou null si invalide
 */
export const buildPhotoUrl = (photoUrl, documentApi) => {
  if (!photoUrl || typeof photoUrl !== 'string') {
    return null
  }

  // Si c'est déjà une URL complète valide (http/https), la retourner telle quelle
  if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
    // Vérifier que ce n'est pas l'URL de l'avatar par défaut
    if (photoUrl.includes('ui-avatars.com')) {
      return null
    }
    return photoUrl
  }

  // Si c'est une URL relative (commence par /), construire l'URL complète
  if (photoUrl.startsWith('/')) {
    const match = photoUrl.match(/\/api\/v1\/documents\/serve\/(\d+)/)
    if (match && match[1]) {
      try {
        const documentId = parseInt(match[1])
        return documentApi.getDocumentServeUrl(documentId)
      } catch (err) {
        console.warn('Error building photo URL from relative path:', err)
        return null
      }
    }
  }

  return null
}

// Note: Le hook useProfilePhoto nécessite React, donc il est commenté ici
// Il peut être utilisé dans les composants React si nécessaire
// Pour l'instant, on utilise une approche plus simple avec useState directement dans les composants
