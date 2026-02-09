import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Controller } from 'react-hook-form'
import { 
  User, Briefcase, GraduationCap, Award, Code, FileText, MapPin, 
  Edit, CheckCircle2, AlertCircle, ExternalLink
} from 'lucide-react'

const formatDate = (dateString) => {
  if (!dateString) return 'Non spécifié'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return dateString
  }
}

const formatYear = (year) => {
  if (!year) return 'Non spécifié'
  return year.toString()
}

const getSkillLevelLabel = (level) => {
  const labels = {
    'BEGINNER': 'Débutant',
    'INTERMEDIATE': 'Intermédiaire',
    'ADVANCED': 'Avancé',
    'EXPERT': 'Expert'
  }
  return labels[level] || level
}

// Générer un avatar par défaut basé sur les initiales
const generateAvatarUrl = (firstName, lastName) => {
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U'
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=200&background=random&color=fff&bold=true`
}

// Générer un avatar logo d'entreprise par défaut
const generateCompanyAvatar = (companyName) => {
  const initials = companyName
    ? companyName.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
    : 'CO'
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=100&background=random&color=fff&bold=true&format=svg`
}

export default function Step8({ form, formData, onSubmit, onPrevious, isFirstStep, onEditStep, profileId }) {
  const { control, formState: { errors } } = form || {}
  const [cguOpen, setCguOpen] = useState(false)
  const step1 = formData.step1 || {}
  const step2 = formData.step2 || {}
  const step3 = formData.step3 || {}
  const step4 = formData.step4 || {}
  const step5 = formData.step5 || {}
  const step6 = formData.step6 || {}
  const step7 = formData.step7 || {}

  const experiences = step2.experiences || []
  const educations = step3.educations || []
  const certifications = step4.certifications || []
  const technicalSkills = step5.technicalSkills || []
  const softSkills = step5.softSkills || []
  const tools = step5.tools || []

  // Vérifier l'existence du CV via le service Document
  const [hasCv, setHasCv] = useState(false)
  const [hasAdditionalDocs, setHasAdditionalDocs] = useState(false)
  const [additionalDocsCount, setAdditionalDocsCount] = useState(0)
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true)
  
  // État pour la photo de profil récupérée depuis le backend
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(step1.photoUrl || null)

  useEffect(() => {
    const loadProfileData = async () => {
      if (!profileId) {
        setIsLoadingDocuments(false)
        return
      }

      try {
        // Récupérer le profil depuis le backend pour avoir les données à jour
        const { candidateApi, documentApi } = await import('@/services/api')
        const profile = await candidateApi.getMyProfile()
        
        // Récupérer tous les documents en une seule fois pour éviter les appels multiples
        let documents = []
        try {
          documents = await documentApi.getCandidateDocuments(profileId)
        } catch (docError) {
          console.error('Erreur lors de la récupération des documents:', docError)
        }
        
        // Récupérer la photo de profil
        if (profile.photo_url) {
          setProfilePhotoUrl(profile.photo_url)
        } else {
          // Si pas de photo_url, essayer de trouver le document de type PROFILE_PHOTO (ou OTHER pour rétrocompatibilité)
          try {
            const photoDoc = documents
              .filter(doc => doc.document_type === 'PROFILE_PHOTO' || doc.document_type === 'OTHER')
              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]

            if (photoDoc) {
              const viewResponse = await documentApi.getDocumentViewUrl(photoDoc.id)
              setProfilePhotoUrl(viewResponse.view_url)
            }
          } catch (docError) {
            console.error('Erreur lors de la récupération de la photo:', docError)
          }
        }

        // Vérifier les documents (utiliser les documents déjà chargés)

        // Vérifier si un CV existe (type CV)
        const cvDocuments = documents.filter(doc => doc.document_type === 'CV')
        setHasCv(cvDocuments.length > 0)

        // Vérifier les documents complémentaires (tout sauf CV, PROFILE_PHOTO, COMPANY_LOGO et OTHER)
        const additionalDocs = documents.filter(doc =>
          doc.document_type !== 'CV' &&
          doc.document_type !== 'PROFILE_PHOTO' &&
          doc.document_type !== 'COMPANY_LOGO' &&
          doc.document_type !== 'OTHER'
        )
        setHasAdditionalDocs(additionalDocs.length > 0)
        setAdditionalDocsCount(additionalDocs.length)
      } catch (error) {
        console.error('Erreur lors de la vérification des documents:', error)
        // En cas d'erreur, vérifier aussi dans formData.step6 comme fallback
        // Fonction helper pour vérifier si c'est un fichier
        const isFile = (obj) => {
          if (!obj || typeof obj !== 'object') return false
          if (typeof obj.name === 'string' && typeof obj.size === 'number' && typeof obj.type === 'string') {
            try {
              return obj instanceof File || obj instanceof Blob || obj.constructor?.name === 'File'
            } catch {
              return true
            }
          }
          return false
        }
        const cvFromFormData = step6.cv && (isFile(step6.cv) || (Array.isArray(step6.cv) && step6.cv.length > 0))
        setHasCv(cvFromFormData || false)
        const additionalFromFormData = step6.additionalDocuments && Array.isArray(step6.additionalDocuments) && step6.additionalDocuments.length > 0
        setHasAdditionalDocs(additionalFromFormData || false)
        setAdditionalDocsCount(additionalFromFormData ? step6.additionalDocuments.length : 0)
      } finally {
        setIsLoadingDocuments(false)
      }
    }

    loadProfileData()
  }, [profileId, step6])

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-muted p-4 rounded-lg">
        <h3 className="font-semibold text-lg mb-2">Récapitulatif de votre profil</h3>
        <p className="text-sm text-muted-foreground">
          Veuillez vérifier toutes les informations avant de soumettre votre profil pour validation.
        </p>
      </div>

      {/* Section 1: Profil Général */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              <CardTitle>Profil Général</CardTitle>
            </div>
            {onEditStep && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onEditStep(1)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Photo de profil */}
          <div className="flex justify-center mb-4">
            <img
              src={profilePhotoUrl || generateAvatarUrl(step1.firstName, step1.lastName)}
              alt="Photo de profil"
              className="w-32 h-32 rounded-full object-cover border-4 border-primary shadow-lg"
              onError={async (e) => {
                // Si l'URL a échoué et que c'était une URL présignée, essayer de la régénérer
                if (profilePhotoUrl && (profilePhotoUrl.includes('X-Amz-Algorithm') || profilePhotoUrl.includes('localhost:9000') || profilePhotoUrl.includes('minio'))) {
                  try {
                    const { documentApi, candidateApi } = await import('@/services/api')
                    const documents = await documentApi.getCandidateDocuments(profileId)
                    const photoDoc = documents
                      .filter(doc => doc.document_type === 'OTHER')
                      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
                    
                    if (photoDoc) {
                      const viewResponse = await documentApi.getDocumentViewUrl(photoDoc.id)
                      const newUrl = viewResponse.view_url
                      await candidateApi.updateProfile(profileId, { photo_url: newUrl })
                      setProfilePhotoUrl(newUrl)
                      e.target.src = newUrl
                      return
                    }
                  } catch (error) {
                    console.error('Erreur lors de la régénération de la photo:', error)
                  }
                }
                // Si la régénération a échoué ou si ce n'est pas une URL présignée, utiliser l'avatar par défaut
                const defaultAvatar = generateAvatarUrl(step1.firstName, step1.lastName)
                e.target.src = defaultAvatar
              }}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-muted-foreground">Nom complet :</span>
              <p>{step1.firstName} {step1.lastName}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Date de naissance :</span>
              <p>{formatDate(step1.dateOfBirth)}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Nationalité :</span>
              <p>{step1.nationality || 'Non spécifié'}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Email :</span>
              <p>{step1.email}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Téléphone :</span>
              <p>{step1.phone}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Localisation :</span>
              <p>{[step1.city, step1.country].filter(Boolean).join(', ') || '—'}</p>
            </div>
            <div className="col-span-2">
              <span className="font-medium text-muted-foreground">Adresse :</span>
              <p>{step1.address}</p>
            </div>
            <div className="col-span-2">
              <span className="font-medium text-muted-foreground">Titre du profil :</span>
              <p className="font-semibold">{step1.profileTitle}</p>
            </div>
            <div className="col-span-2">
              <span className="font-medium text-muted-foreground">Secteur d'activité :</span>
              <p>{step1.sector}</p>
            </div>
            <div className="col-span-2">
              <span className="font-medium text-muted-foreground">Métier principal :</span>
              <p>{step1.mainJob}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Années d'expérience :</span>
              <p>{step1.totalExperience || 0} ans</p>
            </div>
            <div className="col-span-2">
              <span className="font-medium text-muted-foreground">Résumé professionnel :</span>
              <p className="mt-1 text-sm">{step1.professionalSummary}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Expériences Professionnelles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              <CardTitle>Expériences Professionnelles</CardTitle>
              <Badge variant="secondary">{experiences.length}</Badge>
            </div>
            {onEditStep && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onEditStep(2)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {experiences.length > 0 ? (
      <div className="space-y-4">
              {experiences.map((exp, index) => (
                <div key={index} className="border-l-2 border-primary pl-4 pb-4 last:pb-0">
                  <div className="flex items-start justify-between gap-4">
                    {/* Logo de l'entreprise */}
                    <div className="flex-shrink-0">
                      <img
                        src={exp.companyLogoUrl || generateCompanyAvatar(exp.companyName)}
                        alt={`Logo ${exp.companyName}`}
                        className="w-16 h-16 rounded-lg object-cover border-2 border-muted shadow-sm"
                        onError={(e) => {
                          // Si l'image échoue, utiliser l'avatar par défaut
                          e.target.src = generateCompanyAvatar(exp.companyName)
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{exp.position}</h4>
                      <p className="text-sm text-muted-foreground">{exp.companyName}</p>
                      {exp.companySector && (
                        <p className="text-xs text-muted-foreground">{exp.companySector}</p>
                      )}
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <p>{formatDate(exp.startDate)}</p>
                      <p>{exp.isCurrent ? 'En cours' : formatDate(exp.endDate)}</p>
                      {exp.contractType && (
                        <Badge variant="outline" className="mt-1">
                          {exp.contractType}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {exp.description && (
                    <div 
                      className="mt-2 text-sm prose prose-sm max-w-none [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:ml-4 [&_ol]:ml-4 [&_li]:my-1"
                      dangerouslySetInnerHTML={{ __html: exp.description }}
                    />
                  )}
                  {exp.achievements && (
                    <div className="mt-2">
                      <span className="text-xs font-medium text-muted-foreground">Réalisations :</span>
                      <div 
                        className="text-sm mt-1 prose prose-sm max-w-none [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:ml-4 [&_ol]:ml-4 [&_li]:my-1"
                        dangerouslySetInnerHTML={{ __html: exp.achievements }}
                      />
                    </div>
                  )}
                  {exp.hasDocument && (
                    <Badge variant="secondary" className="mt-2">
                      <FileText className="w-3 h-3 mr-1" />
                      Document justificatif
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aucune expérience renseignée</p>
          )}
        </CardContent>
      </Card>

      {/* Section 3: Formations & Diplômes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              <CardTitle>Formations & Diplômes</CardTitle>
              <Badge variant="secondary">{educations.length}</Badge>
            </div>
            {onEditStep && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onEditStep(3)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {educations.length > 0 ? (
            <div className="space-y-3">
              {educations.map((edu, index) => (
                <div key={index} className="flex items-start justify-between pb-3 border-b last:border-0">
                  <div className="flex-1">
                    <h4 className="font-semibold">{edu.diploma}</h4>
                    <p className="text-sm text-muted-foreground">{edu.institution}</p>
                    {edu.country && (
                      <p className="text-xs text-muted-foreground">{edu.country}</p>
                    )}
                  </div>
                  <div className="text-right text-sm">
                    <Badge variant="outline">{edu.level}</Badge>
                    <p className="text-muted-foreground mt-1">{formatYear(edu.graduationYear)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aucune formation renseignée</p>
          )}
        </CardContent>
      </Card>

      {/* Section 4: Certifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              <CardTitle>Certifications & Attestations</CardTitle>
              <Badge variant="secondary">{certifications.length}</Badge>
            </div>
            {onEditStep && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onEditStep(4)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {certifications.length > 0 ? (
            <div className="space-y-3">
              {certifications.map((cert, index) => (
                <div key={index} className="flex items-start justify-between pb-3 border-b last:border-0">
                  <div className="flex-1">
                    <h4 className="font-semibold">{cert.title}</h4>
                    <p className="text-sm text-muted-foreground">{cert.issuer}</p>
                    {cert.certificationId && (
                      <p className="text-xs text-muted-foreground">ID: {cert.certificationId}</p>
                    )}
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-muted-foreground">{formatYear(cert.year)}</p>
                    {cert.expirationDate && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Expire: {formatDate(cert.expirationDate)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aucune certification renseignée</p>
          )}
        </CardContent>
      </Card>

      {/* Section 5: Compétences */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              <CardTitle>Compétences</CardTitle>
            </div>
            {onEditStep && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onEditStep(5)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {technicalSkills.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Compétences techniques</h4>
              <div className="flex flex-wrap gap-2">
                {technicalSkills.map((skill, index) => (
                  <Badge key={index} variant="default">
                    {skill.name} - {getSkillLevelLabel(skill.level)}
                    {skill.yearsOfPractice > 0 && ` (${skill.yearsOfPractice} ans)`}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {softSkills.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Compétences comportementales</h4>
              <div className="flex flex-wrap gap-2">
                {softSkills.map((skill, index) => (
                  <Badge key={index} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {tools.length > 0 && (
        <div>
              <h4 className="font-medium mb-2">Outils & logiciels</h4>
              <div className="flex flex-wrap gap-2">
                {tools.map((tool, index) => (
                  <Badge key={index} variant="outline">
                    {tool.name} {tool.level && `(${tool.level})`}
                  </Badge>
                ))}
              </div>
        </div>
          )}
          
          {technicalSkills.length === 0 && softSkills.length === 0 && tools.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucune compétence renseignée</p>
          )}
        </CardContent>
      </Card>

      {/* Section 6: Documents */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              <CardTitle>Documents</CardTitle>
            </div>
            {onEditStep && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onEditStep(6)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {isLoadingDocuments ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="text-sm text-muted-foreground">Vérification des documents...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {hasCv ? (
                  <CheckCircle2 className="w-4 h-4 text-[#226D68]" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                )}
                <span className="text-sm">
                  CV: {hasCv ? 'Téléchargé' : 'Non téléchargé'}
                </span>
              </div>
            )}
            {hasAdditionalDocs && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#226D68]" />
                <span className="text-sm">
                  Documents complémentaires: {additionalDocsCount} fichier{additionalDocsCount > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section 7: Préférences de recherche */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              <CardTitle>Recherche d'emploi & Préférences</CardTitle>
            </div>
            {onEditStep && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onEditStep(7)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {step7.desiredPositions && step7.desiredPositions.length > 0 && (
              <div className="col-span-2">
                <span className="font-medium text-muted-foreground">Poste(s) recherché(s) :</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {step7.desiredPositions.map((pos, index) => (
                    <Badge key={index} variant="outline">{pos}</Badge>
                  ))}
                </div>
              </div>
            )}
            <div>
              <span className="font-medium text-muted-foreground">Type de contrat :</span>
              <p>{step7.contractType || 'Non spécifié'}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Localisation souhaitée :</span>
              <p>{step7.desiredLocation || 'Non spécifiée'}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Mobilité géographique :</span>
              <p>{step7.mobility || 'Non spécifiée'}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Disponibilité :</span>
              <p>{step7.availability || 'Non spécifiée'}</p>
            </div>
            {(step7.salaryMin || step7.salaryMax) && (
              <div>
                <span className="font-medium text-muted-foreground">Prétentions salariales :</span>
                <p>
                  {step7.salaryMin && step7.salaryMax 
                    ? `${step7.salaryMin.toLocaleString('fr-FR')} - ${step7.salaryMax.toLocaleString('fr-FR')} CFA/mois`
                    : step7.salaryMin 
                    ? `À partir de ${step7.salaryMin.toLocaleString('fr-FR')} CFA/mois`
                    : `Jusqu'à ${step7.salaryMax.toLocaleString('fr-FR')} CFA/mois`
                  }
                </p>
              </div>
            )}
            {step7.targetSectors && step7.targetSectors.length > 0 && (
              <div className="col-span-2">
                <span className="font-medium text-muted-foreground">Secteur(s) ciblé(s) :</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {step7.targetSectors.map((sector, index) => (
                    <Badge key={index} variant="secondary">{sector}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Message d'information */}
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-yellow-800 mb-1">
            Information importante
          </p>
          <p className="text-sm text-yellow-700">
            Votre profil sera analysé par notre équipe RH avant publication dans la CVthèque. 
            Vous recevrez une notification par email une fois la validation effectuée.
          </p>
        </div>
      </div>

      {/* Consentement (CGU, RGPD, vérification) – affiché à la fin avant soumission */}
      <div className="mt-6 p-4 rounded-lg border bg-gray-50 space-y-4">
        <p className="text-sm font-medium text-gray-800">
          Avant de soumettre, veuillez accepter les conditions suivantes :
        </p>
        {control && (
          <>
            <div className="flex items-start gap-3">
              <Controller
                name="acceptCGU"
                control={control}
                defaultValue={false}
                render={({ field }) => (
                  <Checkbox
                    id="acceptCGU"
                    checked={field.value || false}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                )}
              />
              <div className="space-y-1 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Label htmlFor="acceptCGU" className="text-sm font-medium leading-none cursor-pointer">
                    J&apos;accepte les Conditions Générales d&apos;Utilisation
                  </Label>
                  <Dialog open={cguOpen} onOpenChange={setCguOpen}>
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        className="text-[#226D68] hover:underline inline-flex items-center gap-1 text-sm font-medium"
                      >
                        Consulter les conditions d&apos;utilisation
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
                      <DialogHeader>
                        <DialogTitle>Conditions Générales d&apos;Utilisation</DialogTitle>
                      </DialogHeader>
                      <div className="flex-1 min-h-0 overflow-auto -m-2 p-2">
                        <iframe
                          title="Conditions d'utilisation"
                          src={`${window.location.origin}/legal/terms`}
                          className="w-full h-[70vh] border-0 rounded"
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                {errors?.acceptCGU && (
                  <p className="text-sm text-destructive">{errors.acceptCGU.message}</p>
                )}
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Controller
                name="acceptRGPD"
                control={control}
                defaultValue={false}
                render={({ field }) => (
                  <Checkbox
                    id="acceptRGPD"
                    checked={field.value || false}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                )}
              />
              <div className="space-y-1">
                <Label htmlFor="acceptRGPD" className="text-sm font-medium leading-none cursor-pointer">
                  J&apos;accepte le traitement de mes données personnelles (RGPD)
                </Label>
                {errors?.acceptRGPD && (
                  <p className="text-sm text-destructive">{errors.acceptRGPD.message}</p>
                )}
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Controller
                name="acceptVerification"
                control={control}
                defaultValue={false}
                render={({ field }) => (
                  <Checkbox
                    id="acceptVerification"
                    checked={field.value || false}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                )}
              />
              <div className="space-y-1">
                <Label htmlFor="acceptVerification" className="text-sm font-medium leading-none cursor-pointer">
                  J&apos;autorise la vérification des informations fournies
                </Label>
                {errors?.acceptVerification && (
                  <p className="text-sm text-destructive">{errors.acceptVerification.message}</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center pt-4">
        {!isFirstStep && (
          <Button type="button" variant="outline" onClick={onPrevious}>
            Précédent
          </Button>
        )}
        <Button
          onClick={form?.handleSubmit ? () => form.handleSubmit(onSubmit)() : onSubmit}
          className="ml-auto"
          size="lg"
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Soumettre mon profil pour validation
        </Button>
      </div>
    </div>
  )
}
