import { describe, it, expect } from 'vitest'
import { ROUTES, getDefaultRouteForRole } from './routes'

describe('routes', () => {
  describe('ROUTES', () => {
    it('expose les routes publiques', () => {
      expect(ROUTES.HOME).toBe('/')
      expect(ROUTES.LOGIN).toBe('/login')
      expect(ROUTES.REGISTER_CHOICE).toBe('/register/choice')
      expect(ROUTES.CONTACT).toBe('/contact')
    })

    it('ONBOARDING_STEP génère la bonne URL', () => {
      expect(ROUTES.ONBOARDING_STEP(3)).toBe('/onboarding/step3')
    })

    it('CANDIDATE_DETAIL génère la bonne URL', () => {
      expect(ROUTES.CANDIDATE_DETAIL(42)).toBe('/candidates/42')
    })

    it('ADMIN_REVIEW génère la bonne URL', () => {
      expect(ROUTES.ADMIN_REVIEW(10)).toBe('/admin/review/10')
    })
  })

  describe('getDefaultRouteForRole', () => {
    it('retourne HOME si pas de rôles', () => {
      expect(getDefaultRouteForRole([])).toBe(ROUTES.HOME)
      expect(getDefaultRouteForRole(null)).toBe(ROUTES.HOME)
    })

    it('retourne candidat dashboard pour ROLE_CANDIDAT', () => {
      expect(getDefaultRouteForRole(['ROLE_CANDIDAT'])).toBe(
        ROUTES.DEFAULT_ROUTES.ROLE_CANDIDAT
      )
    })

    it('retourne company dashboard pour ROLE_COMPANY_ADMIN', () => {
      expect(getDefaultRouteForRole(['ROLE_COMPANY_ADMIN'])).toBe(
        ROUTES.DEFAULT_ROUTES.ROLE_COMPANY_ADMIN
      )
    })

    it('retourne company dashboard pour ROLE_RECRUITER', () => {
      expect(getDefaultRouteForRole(['ROLE_RECRUITER'])).toBe(
        ROUTES.DEFAULT_ROUTES.ROLE_COMPANY_ADMIN
      )
    })

    it('retourne admin dashboard pour ROLE_ADMIN', () => {
      expect(getDefaultRouteForRole(['ROLE_ADMIN'])).toBe(
        ROUTES.DEFAULT_ROUTES.ROLE_ADMIN
      )
    })

    it('retourne admin dashboard pour ROLE_SUPER_ADMIN', () => {
      expect(getDefaultRouteForRole(['ROLE_SUPER_ADMIN'])).toBe(
        ROUTES.DEFAULT_ROUTES.ROLE_ADMIN
      )
    })

    it('priorise ROLE_CANDIDAT si plusieurs rôles', () => {
      expect(
        getDefaultRouteForRole(['ROLE_ADMIN', 'ROLE_CANDIDAT'])
      ).toBe(ROUTES.DEFAULT_ROUTES.ROLE_CANDIDAT)
    })
  })
})
