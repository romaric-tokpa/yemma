/**
 * Tests unitaires pour le composant AuthGuard
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import AuthGuard from '@/components/AuthGuard'
import { authApiService } from '@/services/api'

// Mock du service API
vi.mock('@/services/api', () => ({
  authApiService: {
    getCurrentUser: vi.fn(),
    logout: vi.fn(),
  },
}))

// Mock de useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('AuthGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('devrait rediriger vers /login si aucun token n\'est présent', async () => {
    render(
      <MemoryRouter>
        <AuthGuard requireAuth={true}>
          <div>Contenu protégé</div>
        </AuthGuard>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', expect.any(Object))
    })
  })

  it('devrait afficher le contenu si l\'utilisateur est authentifié', async () => {
    localStorage.setItem('auth_token', 'valid-token')
    authApiService.getCurrentUser.mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      roles: ['ROLE_CANDIDAT'],
    })

    render(
      <MemoryRouter>
        <AuthGuard requireAuth={true}>
          <div>Contenu protégé</div>
        </AuthGuard>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Contenu protégé')).toBeInTheDocument()
    })
  })

  it('devrait vérifier les rôles autorisés', async () => {
    localStorage.setItem('auth_token', 'valid-token')
    authApiService.getCurrentUser.mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      roles: ['ROLE_CANDIDAT'],
    })

    render(
      <MemoryRouter>
        <AuthGuard requireAuth={true} allowedRoles={['ROLE_ADMIN']}>
          <div>Contenu admin</div>
        </AuthGuard>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalled()
    })
  })

  it('devrait afficher un loader pendant la vérification', () => {
    localStorage.setItem('auth_token', 'valid-token')
    authApiService.getCurrentUser.mockImplementation(() => new Promise(() => {}))

    render(
      <MemoryRouter>
        <AuthGuard requireAuth={true}>
          <div>Contenu</div>
        </AuthGuard>
      </MemoryRouter>
    )

    expect(screen.getByText(/Vérification de l'authentification/i)).toBeInTheDocument()
  })
})
