/**
 * Utilitaires pour mapper les données d'onboarding vers l'API backend
 */

/**
 * Transforme les données de l'étape 0 (consentements) vers le format backend
 */
export function mapStep0ToBackend(step0Data) {
  return {
    accept_cgu: step0Data.acceptCGU || step0Data.acceptCgu || false,
    accept_rgpd: step0Data.acceptRGPD || step0Data.acceptRgpd || false,
    accept_verification: step0Data.acceptVerification || false,
  }
}

/**
 * Transforme les données de l'étape 1 (profil général) vers le format backend
 */
export function mapStep1ToBackend(step1Data) {
  const mapped = {}
  
  // Ne pas envoyer email car ProfileUpdate ne l'accepte pas (il est géré par le service auth)
  // if (step1Data.email) mapped.email = step1Data.email
  
  if (step1Data.firstName) mapped.first_name = step1Data.firstName
  if (step1Data.lastName) mapped.last_name = step1Data.lastName
  if (step1Data.phone) mapped.phone = step1Data.phone
  
  // Convertir la date de naissance en format ISO datetime si présente
  // Le format date (YYYY-MM-DD) sera converti en datetime par le backend
  if (step1Data.dateOfBirth) {
    // Si c'est déjà au format ISO datetime, l'utiliser tel quel
    // Sinon, convertir de YYYY-MM-DD à ISO datetime
    if (step1Data.dateOfBirth.includes('T')) {
      mapped.date_of_birth = step1Data.dateOfBirth
    } else {
      // Ajouter l'heure minuit UTC pour créer un datetime valide
      mapped.date_of_birth = `${step1Data.dateOfBirth}T00:00:00`
    }
  }
  
  if (step1Data.nationality) mapped.nationality = step1Data.nationality
  if (step1Data.address) mapped.address = step1Data.address
  if (step1Data.city) mapped.city = step1Data.city
  if (step1Data.country) mapped.country = step1Data.country
  if (step1Data.profileTitle) mapped.profile_title = step1Data.profileTitle
  if (step1Data.professionalSummary) mapped.professional_summary = step1Data.professionalSummary
  if (step1Data.sector) mapped.sector = step1Data.sector
  if (step1Data.mainJob) mapped.main_job = step1Data.mainJob
  if (step1Data.totalExperience !== undefined && step1Data.totalExperience !== null) {
    mapped.total_experience = step1Data.totalExperience
  }
  // Ne pas envoyer null pour photo_url si non défini
  if (step1Data.photoUrl !== undefined && step1Data.photoUrl !== null && step1Data.photoUrl !== '') {
    mapped.photo_url = step1Data.photoUrl
  }
  
  return mapped
}

/**
 * Transforme les données de l'étape 2 (expériences) vers le format backend
 */
export function mapStep2ToBackend(step2Data) {
  const experiences = step2Data.experiences || []
  return experiences
    .filter(exp => {
      // Filtrer les expériences invalides (sans champs obligatoires)
      return exp.companyName && exp.position && exp.startDate
    })
    .map(exp => {
      const mapped = {
        company_name: exp.companyName,
        position: exp.position,
        is_current: exp.isCurrent || false,
        has_document: exp.hasDocument || false,
      }
      
      // Convertir start_date au format datetime ISO (obligatoire)
      // Le backend attend un datetime au format ISO 8601
      if (exp.startDate.includes('T')) {
        // Déjà au format ISO, vérifier qu'il a le timezone
        if (!exp.startDate.includes('Z') && !exp.startDate.match(/[+-]\d{2}:\d{2}$/)) {
          // Ajouter le timezone UTC si absent
          mapped.start_date = exp.startDate.endsWith('Z') ? exp.startDate : `${exp.startDate}Z`
        } else {
          mapped.start_date = exp.startDate
        }
      } else {
        // Convertir de YYYY-MM-DD à ISO datetime avec timezone UTC
        mapped.start_date = `${exp.startDate}T00:00:00Z`
      }
      
      // Convertir end_date au format datetime ISO (optionnel)
      if (exp.endDate && !exp.isCurrent) {
        if (exp.endDate.includes('T')) {
          // Déjà au format ISO, vérifier qu'il a le timezone
          if (!exp.endDate.includes('Z') && !exp.endDate.match(/[+-]\d{2}:\d{2}$/)) {
            mapped.end_date = exp.endDate.endsWith('Z') ? exp.endDate : `${exp.endDate}Z`
          } else {
            mapped.end_date = exp.endDate
          }
        } else {
          // Convertir de YYYY-MM-DD à ISO datetime avec timezone UTC
          mapped.end_date = `${exp.endDate}T00:00:00Z`
        }
      }
      
      // Champs optionnels - ne pas envoyer null ou undefined
      if (exp.companyLogoUrl) mapped.company_logo_url = exp.companyLogoUrl
      if (exp.companySector) mapped.company_sector = exp.companySector
      if (exp.contractType) mapped.contract_type = exp.contractType
      if (exp.description !== undefined && exp.description !== null && exp.description !== '') {
        mapped.description = exp.description
      }
      if (exp.achievements !== undefined && exp.achievements !== null && exp.achievements !== '') {
        mapped.achievements = exp.achievements
      }
      if (exp.documentId !== undefined && exp.documentId !== null) {
        mapped.document_id = exp.documentId
      }
      
      return mapped
    })
}

/**
 * Transforme les données de l'étape 3 (formations) vers le format backend
 */
export function mapStep3ToBackend(step3Data) {
  const educations = step3Data.educations || []
  return educations.map(edu => ({
    diploma: edu.diploma || '',
    institution: edu.institution || '',
    country: edu.country,
    start_year: edu.startYear,
    graduation_year: edu.graduationYear || 0,
    level: edu.level || '',
  }))
}

/**
 * Transforme les données de l'étape 4 (certifications) vers le format backend
 */
export function mapStep4ToBackend(step4Data) {
  const certifications = step4Data.certifications || []
  return certifications.map(cert => {
    const mapped = {
      title: cert.title || '',
      issuer: cert.issuer || '',
      year: cert.year || 0,
    }
    
    // Convertir expiration_date au format datetime ISO si présent
    if (cert.expirationDate) {
      if (cert.expirationDate.includes('T')) {
        mapped.expiration_date = cert.expirationDate
      } else {
        // Convertir de YYYY-MM-DD à ISO datetime
        mapped.expiration_date = `${cert.expirationDate}T00:00:00`
      }
    }
    
    // Champs optionnels - ne pas envoyer null ou undefined
    if (cert.verificationUrl) mapped.verification_url = cert.verificationUrl
    if (cert.certificationId) mapped.certification_id = cert.certificationId
    
    return mapped
  })
}

/**
 * Transforme les données de l'étape 5 (compétences) vers le format backend
 */
export function mapStep5ToBackend(step5Data) {
  const skills = []
  
  // Compétences techniques
  const technicalSkills = step5Data.technicalSkills || []
  for (const skill of technicalSkills) {
    skills.push({
      skill_type: 'TECHNICAL',
      name: skill.name || '',
      level: skill.level || 'BEGINNER',
      years_of_practice: skill.yearsOfPractice || 0,
    })
  }
  
  // Compétences comportementales (soft skills)
  const softSkills = step5Data.softSkills || []
  for (const skillName of softSkills) {
    skills.push({
      skill_type: 'SOFT',
      name: skillName,
      level: null, // Les soft skills n'ont pas de niveau
      years_of_practice: null,
    })
  }
  
  // Outils & logiciels
  const tools = step5Data.tools || []
  for (const tool of tools) {
    skills.push({
      skill_type: 'TOOL',
      name: tool.name || '',
      level: tool.level || null,
      years_of_practice: null,
    })
  }
  
  return skills
}

/**
 * Transforme les données de l'étape 7 (préférences) vers le format backend
 */
export function mapStep7ToBackend(step7Data) {
  return {
    desired_positions: (step7Data.desiredPositions || []).slice(0, 5), // Max 5
    contract_type: step7Data.contractType,
    target_sectors: step7Data.targetSectors || [],
    desired_location: step7Data.desiredLocation,
    mobility: step7Data.mobility,
    availability: step7Data.availability,
    salary_min: step7Data.salaryMin || null,
    salary_max: step7Data.salaryMax || null,
    // Garder salary_expectations pour compatibilité (moyenne de la fourchette)
    salary_expectations: (step7Data.salaryMin && step7Data.salaryMax) 
      ? (step7Data.salaryMin + step7Data.salaryMax) / 2 
      : (step7Data.salaryMin || step7Data.salaryMax || null),
  }
}

/**
 * Transforme les données backend vers le format frontend
 */
export function transformBackendToFrontend(profileData) {
  const formData = {}
  
  // Step 0 - Consentements
  formData.step0 = {
    acceptCGU: profileData.accept_cgu || false,
    acceptRGPD: profileData.accept_rgpd || false,
    acceptVerification: profileData.accept_verification || false,
  }
  
  // Step 1 - Profil général
  formData.step1 = {
    firstName: profileData.first_name || '',
    lastName: profileData.last_name || '',
    email: profileData.email || '',
    phone: profileData.phone || '',
    dateOfBirth: profileData.date_of_birth ? new Date(profileData.date_of_birth).toISOString().split('T')[0] : '',
    nationality: profileData.nationality || '',
    address: profileData.address || '',
    city: profileData.city || '',
    country: profileData.country || '',
    profileTitle: profileData.profile_title || '',
    professionalSummary: profileData.professional_summary || '',
    sector: profileData.sector || '',
    mainJob: profileData.main_job || '',
    totalExperience: profileData.total_experience || 0,
    photoUrl: profileData.photo_url || null,
  }
  
  // Step 2 - Expériences
  formData.step2 = {
    experiences: (profileData.experiences || []).map(exp => ({
      id: exp.id,
      companyName: exp.company_name || '',
      companyLogoUrl: exp.company_logo_url || null,
      companySector: exp.company_sector || '',
      position: exp.position || '',
      contractType: exp.contract_type || '',
      startDate: exp.start_date ? new Date(exp.start_date).toISOString().split('T')[0] : '',
      endDate: exp.end_date ? new Date(exp.end_date).toISOString().split('T')[0] : '',
      isCurrent: exp.is_current || false,
      description: exp.description || '',
      achievements: exp.achievements || '',
      hasDocument: exp.has_document || false,
      documentId: exp.document_id || null,
    })),
  }
  
  // Step 3 - Formations
  formData.step3 = {
    educations: (profileData.educations || []).map(edu => ({
      id: edu.id,
      diploma: edu.diploma || '',
      institution: edu.institution || '',
      country: edu.country || '',
      startYear: edu.start_year || null,
      graduationYear: edu.graduation_year || new Date().getFullYear(),
      level: edu.level || '',
    })),
  }
  
  // Step 4 - Certifications
  formData.step4 = {
    certifications: (profileData.certifications || []).map(cert => ({
      id: cert.id,
      title: cert.title || '',
      issuer: cert.issuer || '',
      year: cert.year || new Date().getFullYear(),
      expirationDate: cert.expiration_date ? new Date(cert.expiration_date).toISOString().split('T')[0] : '',
      verificationUrl: cert.verification_url || '',
      certificationId: cert.certification_id || '',
    })),
  }
  
  // Step 5 - Compétences
  const allSkills = profileData.skills || []
  const technicalSkills = allSkills.filter(s => s.skill_type === 'TECHNICAL').map(skill => ({
    id: skill.id,
    name: skill.name || '',
    level: skill.level || 'BEGINNER',
    yearsOfPractice: skill.years_of_practice || 0,
  }))
  const softSkills = allSkills.filter(s => s.skill_type === 'SOFT').map(skill => skill.name)
  const tools = allSkills.filter(s => s.skill_type === 'TOOL').map(skill => ({
    name: skill.name || '',
    level: skill.level || '',
  }))
  
  formData.step5 = {
    technicalSkills,
    softSkills,
    tools,
  }
  
  // Step 7 - Préférences
  if (profileData.job_preferences) {
    formData.step7 = {
      desiredPositions: profileData.job_preferences.desired_positions || [],
      contractType: profileData.job_preferences.contract_type || '',
      targetSectors: profileData.job_preferences.target_sectors || [],
      desiredLocation: profileData.job_preferences.desired_location || '',
      mobility: profileData.job_preferences.mobility || '',
      availability: profileData.job_preferences.availability || '',
      salaryMin: profileData.job_preferences.salary_min || null,
      salaryMax: profileData.job_preferences.salary_max || null,
    }
    // Si salaryMin/salaryMax n'existent pas mais salary_expectations existe, utiliser comme moyenne (compatibilité)
    if (!profileData.job_preferences.salary_min && !profileData.job_preferences.salary_max && profileData.job_preferences.salary_expectations) {
      formData.step7.salaryMin = profileData.job_preferences.salary_expectations
      formData.step7.salaryMax = profileData.job_preferences.salary_expectations
    }
  } else {
    formData.step7 = {
      desiredPositions: [],
      contractType: '',
      targetSectors: [],
      desiredLocation: '',
      mobility: '',
      availability: '',
      salaryMin: null,
      salaryMax: null,
    }
  }
  
  // Métadonnées
  formData.lastStep = profileData.last_step_completed || 0
  formData.profileId = profileData.id
  formData.completionPercentage = profileData.completion_percentage || 0
  
  return formData
}

/**
 * Sauvegarde complète d'un profil depuis les données d'onboarding
 */
export async function saveOnboardingProfile(profileId, onboardingData, candidateApi) {
  // Déterminer la dernière étape complétée (8 = récapitulatif, la dernière étape)
  const lastStepCompleted = Math.max(onboardingData.lastStep || 0, 8)
  
  // Mettre à jour le profil principal (steps 0 et 1)
  const profileUpdate = {
    ...mapStep0ToBackend(onboardingData.step0 || {}),
    ...mapStep1ToBackend(onboardingData.step1 || {}),
    last_step_completed: lastStepCompleted,
  }
  
  await candidateApi.updateProfile(profileId, profileUpdate)
  
  // Créer/mettre à jour les expériences (step 2)
  const experiences = mapStep2ToBackend(onboardingData.step2 || {})
  // Supprimer les anciennes expériences et créer les nouvelles
  try {
    const existingExperiences = await candidateApi.getExperiences(profileId)
    for (const exp of existingExperiences) {
      await candidateApi.deleteExperience(profileId, exp.id)
    }
  } catch (error) {
    // Ignorer si aucune expérience n'existe
  }
  for (const exp of experiences) {
    await candidateApi.createExperience(profileId, exp)
  }
  
  // Créer/mettre à jour les formations (step 3)
  const educations = mapStep3ToBackend(onboardingData.step3 || {})
  try {
    const existingEducations = await candidateApi.getEducations(profileId)
    for (const edu of existingEducations) {
      await candidateApi.deleteEducation(profileId, edu.id)
    }
  } catch (error) {
    // Ignorer si aucune formation n'existe
  }
  for (const edu of educations) {
    await candidateApi.createEducation(profileId, edu)
  }
  
  // Créer/mettre à jour les certifications (step 4)
  const certifications = mapStep4ToBackend(onboardingData.step4 || {})
  try {
    const existingCertifications = await candidateApi.getCertifications(profileId)
    for (const cert of existingCertifications) {
      await candidateApi.deleteCertification(profileId, cert.id)
    }
  } catch (error) {
    // Ignorer si aucune certification n'existe
  }
  for (const cert of certifications) {
    await candidateApi.createCertification(profileId, cert)
  }
  
  // Créer/mettre à jour les compétences (step 5)
  const skills = mapStep5ToBackend(onboardingData.step5 || { technicalSkills: [], softSkills: [], tools: [] })
  try {
    const existingSkills = await candidateApi.getSkills(profileId)
    for (const skill of existingSkills) {
      await candidateApi.deleteSkill(profileId, skill.id)
    }
  } catch (error) {
    // Ignorer si aucune compétence n'existe
  }
  for (const skill of skills) {
    await candidateApi.createSkill(profileId, skill)
  }
  
  // Mettre à jour les préférences (step 7)
  const preferences = mapStep7ToBackend(onboardingData.step7 || {})
  await candidateApi.updateJobPreferences(profileId, preferences)
  
  // Mettre à jour le profil à nouveau pour déclencher le recalcul du completion_percentage
  // avec toutes les relations (expériences, formations, compétences, préférences)
  // Passer un objet vide pour ne modifier aucun champ, mais déclencher le recalcul
  await candidateApi.updateProfile(profileId, {})
}

