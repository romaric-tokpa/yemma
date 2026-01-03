import { z } from 'zod'

export const interviewReportSchema = z.object({
  overallScore: z.number().min(0).max(5, "La note doit être entre 0 et 5"),
  technicalSkills: z.number().min(0).max(5).optional(),
  softSkills: z.number().min(0).max(5).optional(),
  communication: z.number().min(0).max(5).optional(),
  motivation: z.number().min(0).max(5).optional(),
  softSkillsTags: z.array(z.string()).optional().default([]),
  summary: z.string().min(50, "Le résumé doit contenir au moins 50 caractères"),
  rejectionReason: z.string().optional(),
}).refine((data) => {
  // Si on rejette, le motif est requis
  // Cette validation sera gérée côté composant
  return true
}, {
  message: "Le motif de rejet est requis",
  path: ["rejectionReason"],
})

