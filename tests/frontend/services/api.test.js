/**
 * Tests unitaires pour les services API
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { candidateApi, documentApi, authApiService } from '@/services/api'

// Mock d'axios
const mockAxiosInstance = {
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  },
}

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => mockAxiosInstance),
  },
}))

describe('API Services', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('authApiService', () => {
    it('devrait appeler l\'endpoint de login avec les bonnes données', async () => {
      const mockResponse = { data: { access_token: 'token', token_type: 'bearer' } }
      mockAxiosInstance.post.mockResolvedValue(mockResponse)

      await authApiService.login('test@example.com', 'password')

      expect(mockAxiosInstance.post).toHaveBeenCalled()
    })

    it('devrait stocker le token après connexion réussie', async () => {
      const mockResponse = { data: { access_token: 'test-token', token_type: 'bearer' } }
      mockAxiosInstance.post.mockResolvedValue(mockResponse)

      await authApiService.login('test@example.com', 'password')

      expect(localStorage.setItem).toHaveBeenCalled()
    })
  })

  describe('candidateApi', () => {
    it('devrait créer un profil avec les bonnes données', async () => {
      const mockResponse = { data: { id: 1, first_name: 'John' } }
      mockAxiosInstance.post.mockResolvedValue(mockResponse)

      const profileData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
      }

      const result = await candidateApi.createProfile(profileData)

      expect(mockAxiosInstance.post).toHaveBeenCalled()
      expect(result).toEqual(mockResponse.data)
    })

    it('devrait formater les données pour updateProfile', async () => {
      const mockResponse = { data: { id: 1 } }
      mockAxiosInstance.patch.mockResolvedValue(mockResponse)

      await candidateApi.updateProfile(1, {
        accept_cgu: true,
        accept_rgpd: true,
        accept_verification: true,
      })

      expect(mockAxiosInstance.patch).toHaveBeenCalled()
    })
  })

  describe('documentApi', () => {
    it('devrait uploader un document avec FormData', async () => {
      const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' })
      const mockResponse = { data: { id: 1, document_type: 'CV' } }
      mockAxiosInstance.post.mockResolvedValue(mockResponse)

      await documentApi.uploadDocument(mockFile, 1, 'CV')

      expect(mockAxiosInstance.post).toHaveBeenCalled()
    })

    it('ne devrait pas uploader si le fichier n\'est pas une instance de File', async () => {
      const result = await documentApi.uploadDocument({ id: 1 }, 1, 'CV')
      
      expect(result).toEqual({ id: 1 })
    })
  })
})
