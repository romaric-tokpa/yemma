import { z } from 'zod'

// Schéma pour l'étape 0 - Conditions & Consentement
export const step0Schema = z.object({
  acceptCGU: z.boolean().refine((val) => val === true, {
    message: "Vous devez accepter les Conditions Générales d'Utilisation",
  }),
  acceptRGPD: z.boolean().refine((val) => val === true, {
    message: "Vous devez accepter le traitement des données personnelles",
  }),
  acceptVerification: z.boolean().refine((val) => val === true, {
    message: "Vous devez autoriser la vérification des informations",
  }),
})

// Schéma pour l'étape 1 - Profil Général
export const step1Schema = z.object({
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  dateOfBirth: z.string().min(1, "La date de naissance est requise"),
  nationality: z.string().min(1, "La nationalité est requise"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(10, "Le numéro de téléphone est invalide"),
  address: z.string().min(5, "L'adresse est requise"),
  country: z.string().min(2, "Le pays est requis"),
  profileTitle: z.string().min(5, "Le titre du profil doit contenir au moins 5 caractères"),
  professionalSummary: z.string().min(300, "Le résumé professionnel doit contenir au moins 300 caractères"),
  sector: z.string().min(1, "Le secteur d'activité est requis"),
  mainJob: z.string().min(2, "Le métier principal est requis"),
  totalExperience: z.number().min(0, "L'expérience totale doit être positive"),
})

// Schéma pour l'étape 2 - Expériences Professionnelles
export const experienceSchema = z.object({
  companyName: z.string().min(2, "Le nom de l'entreprise est requis"),
  position: z.string().min(2, "Le poste est requis"),
  startDate: z.string().min(1, "La date de début est requise"),
  endDate: z.string().optional(),
  isCurrent: z.boolean().default(false),
  description: z.string().min(10, "La description doit contenir au moins 10 caractères"),
  achievements: z.string().optional(),
  hasDocument: z.boolean().default(false),
})

export const step2Schema = z.object({
  experiences: z.array(experienceSchema).min(1, "Au moins une expérience est requise"),
})

// Schéma pour l'étape 3 - Formations & Diplômes
export const educationSchema = z.object({
  diploma: z.string().min(2, "Le diplôme est requis"),
  institution: z.string().min(2, "L'établissement est requis"),
  country: z.string().optional(),
  startYear: z.number().optional(),
  graduationYear: z.number().min(1900, "L'année d'obtention est invalide"),
  level: z.string().min(1, "Le niveau est requis"),
})

export const step3Schema = z.object({
  educations: z.array(educationSchema).min(1, "Au moins une formation est requise"),
})

// Schéma pour l'étape 4 - Certifications
export const certificationSchema = z.object({
  title: z.string().min(2, "Le titre de la certification est requis"),
  issuer: z.string().min(2, "L'organisme délivreur est requis"),
  year: z.number().min(1900, "L'année est invalide"),
  expirationDate: z.string().optional(),
  verificationUrl: z.string().url().optional().or(z.literal("")),
  certificationId: z.string().optional(),
})

export const step4Schema = z.object({
  certifications: z.array(certificationSchema).optional().default([]),
})

// Schéma pour l'étape 5 - Compétences
export const skillSchema = z.object({
  name: z.string().min(2, "Le nom de la compétence est requis"),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]),
  yearsOfPractice: z.number().min(0).optional(),
})

export const step5Schema = z.object({
  technicalSkills: z.array(skillSchema).min(1, "Au moins une compétence technique est requise"),
  softSkills: z.array(z.string()).optional().default([]),
  tools: z.array(z.object({
    name: z.string(),
    level: z.string(),
  })).optional().default([]),
})

// Schéma pour l'étape 6 - Documents
// Le CV peut être soit un File (nouveau fichier), soit undefined/null si déjà sauvegardé
// La validation se fait dans le composant Step6 qui vérifie uploadedCVId
export const step6Schema = z.object({
  cv: z.union([
    z.instanceof(File).refine((file) => file.size <= 10 * 1024 * 1024, {
      message: "Le CV ne doit pas dépasser 10MB",
    }),
    z.undefined(),
    z.null(),
  ]).optional(),
  additionalDocuments: z.union([
    z.array(z.instanceof(File)),
    z.undefined(),
    z.null(),
  ]).optional().default([]),
  // IDs des documents déjà sauvegardés (utilisés pour la validation)
  cv_document_id: z.number().optional(),
  additional_document_ids: z.array(z.number()).optional(),
})

// Schéma pour l'étape 7 - Recherche d'emploi
export const step7Schema = z.object({
  desiredPositions: z.array(z.string()).min(1, "Au moins un poste recherché est requis").max(5, "Maximum 5 postes"),
  contractType: z.string().min(1, "Le type de contrat est requis"),
  targetSectors: z.array(z.string()).optional().default([]),
  desiredLocation: z.string().min(2, "La localisation souhaitée est requise"),
  mobility: z.string().optional(),
  availability: z.string().min(1, "La disponibilité est requise"),
  salaryMin: z.number().min(0, "Le salaire minimum doit être positif"),
  salaryMax: z.number().min(0, "Le salaire maximum doit être positif"),
}).refine((data) => {
  // Vérifier que le maximum est supérieur ou égal au minimum
  if (data.salaryMin && data.salaryMax) {
    return data.salaryMax >= data.salaryMin
  }
  return true
}, {
  message: "Le salaire maximum doit être supérieur ou égal au salaire minimum",
  path: ["salaryMax"],
})

// Schéma complet
export const onboardingSchema = z.object({
  step0: step0Schema,
  step1: step1Schema,
  step2: step2Schema,
  step3: step3Schema,
  step4: step4Schema,
  step5: step5Schema,
  step6: step6Schema,
  step7: step7Schema,
})

