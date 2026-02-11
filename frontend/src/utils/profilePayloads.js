/**
 * Normalisation des données profil candidat : parsing → état → API
 * Une seule source de vérité pour les noms de champs et formats (aligné backend candidate + parsing).
 */

// ============== Champs canoniques (alignés backend) ==============

export const PROFILE_FIELDS = [
  'first_name', 'last_name', 'email', 'phone', 'date_of_birth', 'nationality',
  'address', 'city', 'country', 'profile_title', 'professional_summary',
  'sector', 'main_job', 'total_experience', 'photo_url'
]

/**
 * Convertit la réponse du parsing CV vers l'état utilisé dans l'onboarding (et affichage).
 * @param {object} parsedData - Réponse de parsingApi.parseCv()
 * @param {string} emailOverride - Email du compte (prioritaire)
 * @returns {object} { profile, experiences, educations, skills, certifications }
 */
export function parsedToOnboardingState(parsedData, emailOverride = '') {
  if (!parsedData) {
    return {
      profile: {},
      experiences: [],
      educations: [],
      skills: [],
      certifications: []
    }
  }
  const p = parsedData.profile || {}
  const profile = {
    first_name: p.first_name ?? '',
    last_name: p.last_name ?? '',
    email: emailOverride || p.email || '',
    phone: p.phone ?? '',
    address: p.address ?? '',
    city: p.city ?? '',
    country: p.country ?? '',
    profile_title: p.profile_title ?? '',
    professional_summary: p.professional_summary ?? '',
    sector: p.sector ?? '',
    main_job: p.main_job ?? '',
    total_experience: p.total_experience ?? null,
    nationality: p.nationality ?? '',
    date_of_birth: p.date_of_birth ? (typeof p.date_of_birth === 'string' ? p.date_of_birth.split('T')[0] : null) : null
  }

  const experiences = (parsedData.experiences || []).map((exp, idx) => ({
    id: `temp-${idx}`,
    company_name: exp.company_name ?? '',
    position: exp.position ?? '',
    start_date: exp.start_date ? (typeof exp.start_date === 'string' ? exp.start_date.split('T')[0] : '') : '',
    end_date: exp.end_date ? (typeof exp.end_date === 'string' ? exp.end_date.split('T')[0] : '') : '',
    is_current: Boolean(exp.is_current),
    description: exp.description ?? '',
    achievements: exp.achievements ?? '',
    company_sector: exp.company_sector ?? ''
  }))

  const educations = (parsedData.educations || []).map((edu, idx) => ({
    id: `temp-${idx}`,
    diploma: edu.diploma ?? '',
    institution: edu.institution ?? '',
    country: edu.country ?? '',
    start_year: edu.start_year ?? '',
    graduation_year: edu.graduation_year ?? new Date().getFullYear(),
    level: edu.level ?? 'Non spécifié'
  }))

  const skills = (parsedData.skills || []).map((skill, idx) => ({
    id: `temp-${idx}`,
    name: skill.name ?? '',
    skill_type: skill.skill_type ?? 'TECHNICAL',
    level: skill.level ?? null
  }))

  const certifications = (parsedData.certifications || []).map((cert, idx) => ({
    id: `temp-${idx}`,
    title: cert.title ?? '',
    issuer: cert.issuer ?? '',
    year: cert.year ?? new Date().getFullYear(),
    expiration_date: cert.expiration_date ?? '',
    verification_url: cert.verification_url ?? '',
    certification_id: cert.certification_id ?? ''
  }))

  return { profile, experiences, educations, skills, certifications }
}

/**
 * Date ou string -> ISO string pour l'API (datetime).
 * @param {string|Date|null} value
 * @returns {string|null}
 */
function toIsoDate(value) {
  if (value == null || value === '') return null
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string') {
    if (value.includes('T')) return value
    return `${value}T00:00:00.000Z`
  }
  return null
}

/**
 * Expérience (état onboarding ou formulaire dashboard) -> payload API ExperienceCreate.
 */
export function experienceToApiPayload(exp) {
  const start = exp.start_date ? toIsoDate(exp.start_date) : new Date().toISOString()
  return {
    company_name: exp.company_name || 'Entreprise',
    company_logo_url: exp.company_logo_url ?? null,
    company_sector: exp.company_sector || null,
    position: exp.position || 'Poste',
    contract_type: exp.contract_type ?? null,
    start_date: start,
    end_date: exp.is_current ? null : toIsoDate(exp.end_date),
    is_current: Boolean(exp.is_current),
    description: exp.description || null,
    achievements: exp.achievements || null,
    has_document: Boolean(exp.has_document),
    document_id: exp.document_id ?? null
  }
}

/**
 * Formation (état onboarding ou formulaire dashboard) -> payload API EducationCreate.
 */
export function educationToApiPayload(edu) {
  const graduationYear = edu.graduation_year != null
    ? (typeof edu.graduation_year === 'number' ? edu.graduation_year : parseInt(edu.graduation_year, 10))
    : new Date().getFullYear()
  return {
    diploma: edu.diploma || 'Formation',
    institution: edu.institution || 'Établissement',
    country: edu.country || null,
    start_year: edu.start_year != null && edu.start_year !== '' ? parseInt(edu.start_year, 10) : null,
    graduation_year: Number.isInteger(graduationYear) ? graduationYear : new Date().getFullYear(),
    level: edu.level || 'Non spécifié'
  }
}

/**
 * Compétence (état onboarding ou formulaire dashboard) -> payload API SkillCreate.
 */
export function skillToApiPayload(skill) {
  return {
    name: skill.name || '',
    skill_type: skill.skill_type || 'TECHNICAL',
    level: skill.level || null,
    years_of_practice: skill.skill_type === 'SOFT' ? null : (skill.years_of_practice != null ? parseInt(skill.years_of_practice, 10) : null)
  }
}

/**
 * Certification (état onboarding ou formulaire dashboard) -> payload API CertificationCreate.
 */
export function certificationToApiPayload(cert) {
  const year = cert.year != null ? (typeof cert.year === 'number' ? cert.year : parseInt(cert.year, 10)) : new Date().getFullYear()
  return {
    title: cert.title || '',
    issuer: cert.issuer || 'Non spécifié',
    year: Number.isInteger(year) ? year : new Date().getFullYear(),
    expiration_date: cert.expiration_date ? toIsoDate(cert.expiration_date) : null,
    verification_url: cert.verification_url || null,
    certification_id: cert.certification_id || null
  }
}

/**
 * Préférences emploi -> payload API JobPreferenceCreate.
 * desired_location est obligatoire côté backend : on le renseigne depuis preferred_locations si absent.
 */
export function jobPreferencesToApiPayload(prefs) {
  const desired = prefs.desired_location ?? prefs.preferred_locations ?? null
  const positions = Array.isArray(prefs.desired_positions) ? prefs.desired_positions.filter(p => p && String(p).trim()).map(p => String(p).trim()) : []
  const contractTypes = Array.isArray(prefs.contract_types) ? prefs.contract_types : []
  // contract_type (legacy) : utiliser la valeur explicite ou le premier type coché (aligné validation backend)
  const contractType = prefs.contract_type ?? (contractTypes.length > 0 ? contractTypes[0] : null)
  return {
    desired_positions: positions,
    contract_type: contractType,
    contract_types: contractTypes,
    target_sectors: Array.isArray(prefs.target_sectors) ? prefs.target_sectors : [],
    desired_location: desired || null,
    preferred_locations: prefs.preferred_locations ?? null,
    mobility: prefs.mobility ?? null,
    remote_preference: prefs.remote_preference ?? null,
    willing_to_relocate: Boolean(prefs.willing_to_relocate),
    availability: prefs.availability ?? null,
    salary_min: prefs.salary_min != null ? parseFloat(prefs.salary_min) : null,
    salary_max: prefs.salary_max != null ? parseFloat(prefs.salary_max) : null,
    salary_expectations: prefs.salary_expectations != null ? parseFloat(prefs.salary_expectations) : null
  }
}
