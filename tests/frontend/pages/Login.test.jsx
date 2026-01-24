/**
 * Tests unitaires pour la page Login
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Login from '@/pages/Login'
import { authApiService } from '@/services/api'

// Mock du service API
vi.mock('@/services/api', () => ({
  authApiService: {
    login: vi.fn(),
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

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('devrait afficher le formulaire de connexion', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    )

    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Mot de passe/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Se connecter/i })).toBeInTheDocument()
  })

  it('devrait permettre la connexion avec des identifiants valides', async () => {
    authApiService.login.mockResolvedValue({
      access_token: 'test-token',
      token_type: 'bearer',
    })

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    )

    const emailInput = screen.getByLabelText(/Email/i)
    const passwordInput = screen.getByLabelText(/Mot de passe/i)
    const submitButton = screen.getByRole('button', { name: /Se connecter/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(authApiService.login).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })

  it('devrait afficher une erreur en cas d\'échec de connexion', async () => {
    authApiService.login.mockRejectedValue({
      response: {
        status: 401,
        data: { detail: 'Identifiants incorrects' },
      },
    })

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    )

    const emailInput = screen.getByLabelText(/Email/i)
    const passwordInput = screen.getByLabelText(/Mot de passe/i)
    const submitButton = screen.getByRole('button', { name: /Se connecter/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/incorrect/i)).toBeInTheDocument()
    })
  })
})
