import { describe, it, expect } from 'vitest'
import {
  loginSchema,
  registerCandidatSchema,
  registerCompanySchema,
} from './auth'

describe('auth schemas', () => {
  describe('loginSchema', () => {
    it('valide un email et mot de passe valides', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: 'password123',
      })
      expect(result.success).toBe(true)
    })

    it('rejette un email invalide', () => {
      const result = loginSchema.safeParse({
        email: 'invalid',
        password: 'password123',
      })
      expect(result.success).toBe(false)
    })

    it('rejette un mot de passe trop court', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: 'short',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('registerCandidatSchema', () => {
    it('valide des données candidat valides', () => {
      const result = registerCandidatSchema.safeParse({
        email: 'candidat@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        firstName: 'Jean',
        lastName: 'Dupont',
      })
      expect(result.success).toBe(true)
    })

    it('rejette si les mots de passe ne correspondent pas', () => {
      const result = registerCandidatSchema.safeParse({
        email: 'candidat@example.com',
        password: 'password123',
        confirmPassword: 'otherpass',
        firstName: 'Jean',
        lastName: 'Dupont',
      })
      expect(result.success).toBe(false)
    })

    it('rejette un prénom trop court', () => {
      const result = registerCandidatSchema.safeParse({
        email: 'candidat@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        firstName: 'J',
        lastName: 'Dupont',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('registerCompanySchema', () => {
    it('valide des données entreprise valides', () => {
      const result = registerCompanySchema.safeParse({
        email: 'contact@company.com',
        password: 'password123',
        confirmPassword: 'password123',
        firstName: 'Marie',
        lastName: 'Martin',
        companyName: 'Acme SARL',
        companyLegalId: 'RCCM-AB-2024-001',
      })
      expect(result.success).toBe(true)
    })

    it('rejette si RCCM manquant', () => {
      const result = registerCompanySchema.safeParse({
        email: 'contact@company.com',
        password: 'password123',
        confirmPassword: 'password123',
        firstName: 'Marie',
        lastName: 'Martin',
        companyName: 'Acme SARL',
        companyLegalId: '',
      })
      expect(result.success).toBe(false)
    })
  })
})
