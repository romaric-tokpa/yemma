/**
 * Tests unitaires pour onboardingApiMapper
 */
import { describe, it, expect } from 'vitest'
import {
  mapStep0ToBackend,
  mapStep1ToBackend,
  mapStep2ToBackend,
  mapStep5ToBackend,
} from '@/utils/onboardingApiMapper'

describe('onboardingApiMapper', () => {
  describe('mapStep0ToBackend', () => {
    it('devrait mapper les consentements correctement', () => {
      const step0Data = {
        acceptCGU: true,
        acceptRGPD: true,
        acceptVerification: true,
      }

      const result = mapStep0ToBackend(step0Data)

      expect(result).toEqual({
        accept_cgu: true,
        accept_rgpd: true,
        accept_verification: true,
      })
    })
  })

  describe('mapStep1ToBackend', () => {
    it('devrait mapper les données du profil correctement', () => {
      const step1Data = {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+33612345678',
        dateOfBirth: '1990-01-01',
        nationality: 'Française',
        address: '123 Rue Test',
        city: 'Paris',
        country: 'France',
        profileTitle: 'Développeur Fullstack',
        professionalSummary: 'Expérience en développement web',
        sector: 'Technologie',
        mainJob: 'Développeur',
        totalExperience: 5,
      }

      const result = mapStep1ToBackend(step1Data)

      expect(result).toEqual({
        first_name: 'John',
        last_name: 'Doe',
        phone: '+33612345678',
        date_of_birth: '1990-01-01T00:00:00',
        nationality: 'Française',
        address: '123 Rue Test',
        city: 'Paris',
        country: 'France',
        profile_title: 'Développeur Fullstack',
        professional_summary: 'Expérience en développement web',
        sector: 'Technologie',
        main_job: 'Développeur',
        total_experience: 5,
      })
    })
  })

  describe('mapStep2ToBackend', () => {
    it('devrait mapper les expériences correctement', () => {
      const step2Data = {
        experiences: [
          {
            companyName: 'Test Company',
            position: 'Développeur',
            startDate: '2020-01-01',
            endDate: '2022-12-31',
            isCurrent: false,
            description: 'Développement web',
          },
        ],
      }

      const result = mapStep2ToBackend(step2Data)

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        company_name: 'Test Company',
        position: 'Développeur',
        is_current: false,
      })
      expect(result[0].end_date).toBeDefined()
    })

    it('ne devrait pas inclure end_date si isCurrent est true', () => {
      const step2Data = {
        experiences: [
          {
            companyName: 'Test Company',
            position: 'Développeur',
            startDate: '2020-01-01',
            isCurrent: true,
            description: 'Développement web',
          },
        ],
      }

      const result = mapStep2ToBackend(step2Data)

      expect(result[0].is_current).toBe(true)
      expect(result[0].end_date).toBeUndefined()
    })
  })

  describe('mapStep5ToBackend', () => {
    it('devrait mapper les compétences techniques correctement', () => {
      const step5Data = {
        technicalSkills: [
          {
            name: 'Python',
            level: 'ADVANCED',
            yearsOfPractice: 5,
          },
        ],
        softSkills: ['Communication', 'Travail d\'équipe'],
        tools: [
          {
            name: 'Git',
            level: 'INTERMEDIATE',
          },
        ],
      }

      const result = mapStep5ToBackend(step5Data)

      expect(result).toHaveLength(3)
      expect(result[0]).toMatchObject({
        name: 'Python',
        skill_type: 'TECHNICAL',
        level: 'ADVANCED',
        years_of_practice: 5,
      })
      expect(result[1]).toMatchObject({
        name: 'Communication',
        skill_type: 'SOFT',
        level: null,
      })
      expect(result[2]).toMatchObject({
        name: 'Git',
        skill_type: 'TOOL',
        level: 'INTERMEDIATE',
      })
    })
  })
})
