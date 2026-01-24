import { describe, it, expect, vi } from 'vitest'
import {
  generateAvatarUrl,
  generateAvatarFromFullName,
  isPresignedUrl,
  buildPhotoUrl,
} from './photoUtils'

describe('photoUtils', () => {
  describe('generateAvatarUrl', () => {
    it('génère une URL avec initiales prénom + nom', () => {
      const url = generateAvatarUrl('Jean', 'Dupont')
      expect(url).toContain('ui-avatars.com')
      expect(url).toContain(encodeURIComponent('JD'))
    })

    it('gère les noms vides', () => {
      const url = generateAvatarUrl('', '')
      expect(url).toContain('ui-avatars.com')
      expect(url).toContain(encodeURIComponent('U'))
    })

    it('gère uniquement le prénom', () => {
      const url = generateAvatarUrl('Jean', null)
      expect(url).toContain(encodeURIComponent('J'))
    })
  })

  describe('generateAvatarFromFullName', () => {
    it('prend première et dernière initiale pour "Prénom Nom"', () => {
      const url = generateAvatarFromFullName('Jean Dupont')
      expect(url).toContain(encodeURIComponent('JD'))
    })

    it('prend une seule initiale pour un seul mot', () => {
      const url = generateAvatarFromFullName('Jean')
      expect(url).toContain(encodeURIComponent('J'))
    })

    it('utilise U si chaîne vide', () => {
      const url = generateAvatarFromFullName('')
      expect(url).toContain(encodeURIComponent('U'))
    })
  })

  describe('isPresignedUrl', () => {
    it('retourne true pour URL avec X-Amz-Signature', () => {
      expect(
        isPresignedUrl('https://bucket.s3.amazonaws.com/key?X-Amz-Signature=abc')
      ).toBe(true)
    })

    it('retourne true pour URL avec X-Amz-Algorithm', () => {
      expect(
        isPresignedUrl('https://host/path?X-Amz-Algorithm=AWS4-HMAC-SHA256')
      ).toBe(true)
    })

    it('retourne true pour localhost:9000 (MinIO)', () => {
      expect(isPresignedUrl('http://localhost:9000/bucket/key')).toBe(true)
    })

    it('retourne false pour URL normale', () => {
      expect(isPresignedUrl('https://example.com/photo.jpg')).toBe(false)
    })

    it('retourne false pour null/undefined', () => {
      expect(isPresignedUrl(null)).toBe(false)
      expect(isPresignedUrl(undefined)).toBe(false)
    })
  })

  describe('buildPhotoUrl', () => {
    it('retourne null si photoUrl vide', () => {
      expect(buildPhotoUrl(null, {})).toBe(null)
      expect(buildPhotoUrl('', {})).toBe(null)
    })

    it('retourne null si photoUrl est ui-avatars', () => {
      expect(
        buildPhotoUrl('https://ui-avatars.com/api/?name=JD', {})
      ).toBe(null)
    })

    it('retourne l’URL telle quelle si http/https (hors ui-avatars)', () => {
      const url = 'https://cdn.example.com/photo.jpg'
      expect(buildPhotoUrl(url, {})).toBe(url)
    })

    it('utilise documentApi.getDocumentServeUrl pour chemin /api/v1/documents/serve/:id', () => {
      const documentApi = {
        getDocumentServeUrl: vi.fn((id) => `https://api.example.com/serve/${id}`),
      }
      const result = buildPhotoUrl('/api/v1/documents/serve/42', documentApi)
      expect(result).toBe('https://api.example.com/serve/42')
      expect(documentApi.getDocumentServeUrl).toHaveBeenCalledWith(42)
    })
  })
})
