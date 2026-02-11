import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { candidateApi, documentApi } from '@/services/api'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { COUNTRIES_FR } from '@/data/countries'
import { SECTORS_FR } from '@/data/sectors'
import {
  ArrowLeft, Loader2, Save, User, MapPin, Briefcase, Plus, Trash2, Edit,
  GraduationCap, Award, Code, FileText, Upload, Eye, Download,
} from 'lucide-react'
import {
  ExperienceForm,
  EducationForm,
  CertificationForm,
  SkillForm,
  PreferencesForm,
} from '@/pages/CandidateDashboard'

const profileSchema = z.object({
  firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  nationality: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  profileTitle: z.string().optional(),
  professionalSummary: z.string().optional(),
  sector: z.string().optional(),
  mainJob: z.string().optional(),
  totalExperience: z.number().min(0).optional(),
})

const defaultAvatar = (first, last) => {
  const i = `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase() || 'U'
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(i)}&size=96&background=e8f5f4&color=226D68&bold=true`
}

export default function EditProfile() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState(null)
  const [photoUrl, setPhotoUrl] = useState(null)
  const [photoError, setPhotoError] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [toast, setToast] = useState(null)
  const [section, setSection] = useState('profil')
  const [experiences, setExperiences] = useState([])
  const [educations, setEducations] = useState([])
  const [certifications, setCertifications] = useState([])
  const [skills, setSkills] = useState([])
  const [jobPreferences, setJobPreferences] = useState(null)
  const [documents, setDocuments] = useState([])
  const [showExperienceDialog, setShowExperienceDialog] = useState(false)
  const [editingExperience, setEditingExperience] = useState(null)
  const [showEducationDialog, setShowEducationDialog] = useState(false)
  const [editingEducation, setEditingEducation] = useState(null)
  const [showCertificationDialog, setShowCertificationDialog] = useState(false)
  const [editingCertification, setEditingCertification] = useState(null)
  const [showSkillDialog, setShowSkillDialog] = useState(false)
  const [editingSkill, setEditingSkill] = useState(null)
  const [showPreferencesDialog, setShowPreferencesDialog] = useState(false)
  const [showDocumentDialog, setShowDocumentDialog] = useState(false)
  const [selectedDocumentFile, setSelectedDocumentFile] = useState(null)
  const [selectedDocumentType, setSelectedDocumentType] = useState('CV')
  const [uploadingDocument, setUploadingDocument] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState(null)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [previewDocument, setPreviewDocument] = useState(null)

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000)
      return () => clearTimeout(t)
    }
  }, [toast])

  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      dateOfBirth: '',
      nationality: '',
      address: '',
      city: '',
      country: '',
      profileTitle: '',
      professionalSummary: '',
      sector: '',
      mainJob: '',
      totalExperience: 0,
    },
  })

  const { register, handleSubmit, formState: { errors }, setValue, control } = form

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const profileData = await candidateApi.getMyProfile()
      setProfile(profileData)
      setPhotoUrl(profileData.photo_url)
      setExperiences(Array.isArray(profileData.experiences) ? profileData.experiences : [])
      setEducations(Array.isArray(profileData.educations) ? profileData.educations : [])
      setCertifications(Array.isArray(profileData.certifications) ? profileData.certifications : [])
      setSkills(Array.isArray(profileData.skills) ? profileData.skills : [])
      setJobPreferences(profileData.job_preferences ?? null)
      setValue('firstName', profileData.first_name || '')
      setValue('lastName', profileData.last_name || '')
      setValue('phone', profileData.phone || '')
      setValue('dateOfBirth', profileData.date_of_birth ? profileData.date_of_birth.split('T')[0] : '')
      setValue('nationality', profileData.nationality || '')
      setValue('address', profileData.address || '')
      setValue('city', profileData.city || '')
      setValue('country', profileData.country || '')
      setValue('profileTitle', profileData.profile_title || '')
      setValue('professionalSummary', profileData.professional_summary || '')
      setValue('sector', profileData.sector || '')
      setValue('mainJob', profileData.main_job || '')
      setValue('totalExperience', profileData.total_experience ?? 0)
      if (profileData.id) {
        try {
          const docs = await documentApi.getCandidateDocuments(profileData.id)
          setDocuments(docs || [])
        } catch {
          setDocuments([])
        }
      }
    } catch {
      setToast({ message: 'Erreur lors du chargement du profil.', type: 'error' })
      navigate('/candidate/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !profile?.id) return
    if (!file.type.startsWith('image/')) {
      setToast({ message: 'Sélectionnez une image (JPG, PNG).', type: 'error' })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setToast({ message: 'La photo de profil ne doit pas dépasser 5 Mo.', type: 'error' })
      return
    }
    try {
      setIsUploadingPhoto(true)
      const uploadResult = await documentApi.uploadProfilePhoto(file, profile.id)
      let serveUrl = uploadResult.serve_url
      if (serveUrl?.startsWith('/')) serveUrl = documentApi.getDocumentServeUrl(uploadResult.id)
      else if (uploadResult.id) serveUrl = documentApi.getDocumentServeUrl(uploadResult.id)
      await candidateApi.updateProfile(profile.id, { photo_url: serveUrl })
      setPhotoUrl(serveUrl)
      setPhotoError(false)
      setToast({ message: 'Photo mise à jour.', type: 'success' })
    } catch {
      setToast({ message: 'Erreur lors de l’upload.', type: 'error' })
    } finally {
      setIsUploadingPhoto(false)
      e.target.value = ''
    }
  }

  const onSubmit = async (data) => {
    if (!profile?.id) return
    try {
      setSaving(true)
      await candidateApi.updateProfile(profile.id, {
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone || null,
        date_of_birth: data.dateOfBirth ? `${data.dateOfBirth}T00:00:00` : null,
        nationality: data.nationality || null,
        address: data.address || null,
        city: data.city || null,
        country: data.country || null,
        profile_title: data.profileTitle || null,
        professional_summary: data.professionalSummary || null,
        sector: data.sector || null,
        main_job: data.mainJob || null,
        total_experience: data.totalExperience ?? null,
      })
      setToast({ message: 'Profil enregistré.', type: 'success' })
      navigate('/candidate/dashboard')
    } catch (err) {
      setToast({ message: err.response?.data?.detail || 'Erreur lors de l’enregistrement.', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteExperience = (id) => {
    const exp = experiences.find(e => e.id === id)
    setConfirmDialog({
      title: 'Supprimer cette expérience ?',
      message: exp?.company_name ? `« ${exp.company_name} » sera supprimée.` : 'Cette expérience sera supprimée.',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmDialog(null)
        try {
          await candidateApi.deleteExperience(profile.id, id)
          setExperiences(experiences.filter(e => e.id !== id))
          setToast({ message: 'Expérience supprimée.', type: 'success' })
        } catch {
          setToast({ message: 'Erreur lors de la suppression.', type: 'error' })
        }
      },
    })
  }
  const handleDeleteEducation = (id) => {
    const edu = educations.find(e => e.id === id)
    setConfirmDialog({
      title: 'Supprimer cette formation ?',
      message: edu?.institution ? `« ${edu.institution} » sera supprimée.` : 'Cette formation sera supprimée.',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmDialog(null)
        try {
          await candidateApi.deleteEducation(profile.id, id)
          setEducations(educations.filter(e => e.id !== id))
          setToast({ message: 'Formation supprimée.', type: 'success' })
        } catch {
          setToast({ message: 'Erreur lors de la suppression.', type: 'error' })
        }
      },
    })
  }
  const handleDeleteCertification = (id) => {
    setConfirmDialog({
      title: 'Supprimer cette certification ?',
      message: 'Cette certification sera supprimée définitivement.',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmDialog(null)
        try {
          await candidateApi.deleteCertification(profile.id, id)
          setCertifications(certifications.filter(c => c.id !== id))
          setToast({ message: 'Certification supprimée.', type: 'success' })
        } catch {
          setToast({ message: 'Erreur lors de la suppression.', type: 'error' })
        }
      },
    })
  }
  const handleDeleteSkill = (id) => {
    setConfirmDialog({
      title: 'Supprimer cette compétence ?',
      message: 'Cette compétence sera retirée de votre profil.',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmDialog(null)
        try {
          await candidateApi.deleteSkill(profile.id, id)
          setSkills(skills.filter(s => s.id !== id))
          setToast({ message: 'Compétence supprimée.', type: 'success' })
        } catch {
          setToast({ message: 'Erreur lors de la suppression.', type: 'error' })
        }
      },
    })
  }
  const handleDocumentUpload = async () => {
    if (!selectedDocumentFile || !profile?.id) {
      setToast({ message: 'Veuillez sélectionner un fichier.', type: 'error' })
      return
    }
    if (selectedDocumentFile.size > 10 * 1024 * 1024) {
      setToast({ message: 'Le fichier ne doit pas dépasser 10 Mo.', type: 'error' })
      return
    }
    try {
      setUploadingDocument(true)
      await documentApi.uploadDocument(selectedDocumentFile, profile.id, selectedDocumentType)
      setToast({ message: 'Document ajouté.', type: 'success' })
      setShowDocumentDialog(false)
      setSelectedDocumentFile(null)
      setSelectedDocumentType('CV')
      const docs = await documentApi.getCandidateDocuments(profile.id)
      setDocuments(docs || [])
    } catch {
      setToast({ message: 'Erreur lors de l’upload.', type: 'error' })
    } finally {
      setUploadingDocument(false)
    }
  }
  const filteredDocuments = documents.filter((doc) => {
    if (doc.document_type === 'PROFILE_PHOTO' || doc.document_type === 'COMPANY_LOGO') return false
    if (doc.document_type === 'OTHER' && doc.mime_type?.startsWith('image/')) return false
    return true
  })
  const DOC_TYPE_LABELS = { CV: 'CV', ATTESTATION: 'Attestation', CERTIFICATE: 'Certificat', RECOMMENDATION_LETTER: 'Lettre de reco.', DIPLOMA: 'Diplôme', OTHER: 'Autre' }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-light flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  const displayPhoto = photoUrl && !photoError ? photoUrl : defaultAvatar(profile?.first_name, profile?.last_name)

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gray-light safe-x safe-y">
      <div className="max-w-2xl mx-auto px-4 py-5 xs:px-5 sm:px-6 sm:py-6 pb-8 md:pb-10 safe-bottom">
        {/* En-tête compact */}
        <div className="flex items-center gap-3 mb-5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate('/candidate/dashboard')}
            className="shrink-0 text-gray-anthracite hover:bg-muted -ml-1 min-h-[2.75rem] sm:min-h-0 px-3 touch-target-min"
            aria-label="Retour au dashboard"
          >
            <ArrowLeft className="w-4 h-4 sm:mr-1" />
            <span className="hidden sm:inline">Retour</span>
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-bold text-gray-anthracite truncate">Modifier mon profil</h1>
            <p className="text-xs text-muted-foreground">Informations personnelles et professionnelles</p>
          </div>
        </div>

        {/* Onglets sections */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 -mx-1 px-1 scroll-tabs overscroll-x-contain" role="tablist" aria-label="Sections du profil">
          {[
            { id: 'profil', label: 'Profil', icon: User },
            { id: 'experiences', label: 'Expériences', icon: Briefcase, count: experiences.length },
            { id: 'educations', label: 'Formations', icon: GraduationCap, count: educations.length },
            { id: 'certifications', label: 'Certifications', icon: Award, count: certifications.length },
            { id: 'skills', label: 'Compétences', icon: Code, count: skills.length },
            { id: 'preferences', label: 'Préférences', icon: MapPin },
            { id: 'documents', label: 'Documents', icon: FileText, count: filteredDocuments.length },
          ].map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={section === id}
              onClick={() => setSection(id)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-2.5 sm:py-2 rounded-lg text-xs font-medium transition-colors min-h-[44px] sm:min-h-0 snap-start touch-target-min ${
                section === id
                  ? 'bg-primary text-white'
                  : 'bg-card border border-border text-gray-anthracite hover:bg-muted'
              }`}
              style={section === id ? { backgroundColor: '#226D68' } : {}}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
              {count != null && count > 0 && <Badge variant={section === id ? 'secondary' : 'outline'} className="ml-0.5 h-4 px-1 text-[10px]">{count}</Badge>}
            </button>
          ))}
        </div>

        {section === 'profil' && (
        <Card className="rounded-[12px] shadow-md border border-border border-l-4 border-l-primary bg-card overflow-hidden">
          <CardHeader className="py-3 px-4 sm:px-5 bg-muted/30 border-b border-border">
            <CardTitle className="text-sm font-semibold text-gray-anthracite flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Informations personnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 xs:p-5 sm:p-5">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Photo */}
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <img
                    src={displayPhoto}
                    alt="Photo de profil"
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-primary/20"
                    onError={() => setPhotoError(true)}
                  />
                  {isUploadingPhoto && (
                    <span className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-white animate-spin" aria-hidden />
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Label htmlFor="photo-edit" className="text-xs font-medium text-muted-foreground block mb-1">
                    Photo de profil
                  </Label>
                  <label htmlFor="photo-edit">
                    <span className="inline-flex items-center justify-center rounded-md border border-input bg-background h-9 px-3 text-xs font-medium cursor-pointer hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50">
                      {isUploadingPhoto ? 'Chargement...' : 'Changer la photo'}
                    </span>
                  </label>
                  <input
                    id="photo-edit"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={isUploadingPhoto}
                    onChange={handlePhotoUpload}
                  />
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG · max 5 Mo</p>
                </div>
              </div>

              {/* Identité */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-anthracite uppercase tracking-wide flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-primary" />
                  Identité
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName" className="text-xs">Prénom <span className="text-red-500">*</span></Label>
                    <Input id="firstName" {...register('firstName')} className="h-9 text-sm" placeholder="Prénom" />
                    {errors.firstName && <p className="text-xs text-red-600">{errors.firstName.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName" className="text-xs">Nom <span className="text-red-500">*</span></Label>
                    <Input id="lastName" {...register('lastName')} className="h-9 text-sm" placeholder="Nom" />
                    {errors.lastName && <p className="text-xs text-red-600">{errors.lastName.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="dateOfBirth" className="text-xs">Date de naissance <span className="text-red-500">*</span></Label>
                    <Input id="dateOfBirth" type="date" {...register('dateOfBirth')} className="h-9 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="nationality" className="text-xs">Nationalité <span className="text-red-500">*</span></Label>
                    <Controller
                      name="nationality"
                      control={control}
                      render={({ field }) => (
                        <SearchableSelect
                          id="nationality"
                          options={COUNTRIES_FR}
                          value={field.value || ''}
                          onChange={field.onChange}
                          placeholder="Choisir une nationalité"
                          className="h-9 text-sm"
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs">Téléphone <span className="text-red-500">*</span></Label>
                  <Input id="phone" {...register('phone')} className="h-9 text-sm" placeholder="+33 6 00 00 00 00" />
                </div>
              </div>

              {/* Adresse (ville, pays) */}
              <div className="space-y-3 pt-1 border-t border-border">
                <p className="text-xs font-semibold text-gray-anthracite uppercase tracking-wide flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  Adresse
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="city" className="text-xs">Ville <span className="text-red-500">*</span></Label>
                    <Input id="city" {...register('city')} className="h-9 text-sm" placeholder="Ville" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="country" className="text-xs">Pays <span className="text-red-500">*</span></Label>
                    <Controller
                      name="country"
                      control={control}
                      render={({ field }) => (
                        <SearchableSelect
                          id="country"
                          options={COUNTRIES_FR}
                          value={field.value || ''}
                          onChange={field.onChange}
                          placeholder="Choisir un pays"
                          className="h-9 text-sm"
                        />
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Profil professionnel */}
              <div className="space-y-3 pt-1 border-t border-border">
                <p className="text-xs font-semibold text-gray-anthracite uppercase tracking-wide flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-primary" />
                  Profil professionnel
                </p>
                <div className="space-y-1.5">
                  <Label htmlFor="profileTitle" className="text-xs">Titre du profil <span className="text-red-500">*</span></Label>
                  <Input
                    id="profileTitle"
                    {...register('profileTitle')}
                    className="h-9 text-sm"
                    placeholder="Ex. Ingénieur Génie Civil"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="sector" className="text-xs">Secteur d'activité <span className="text-red-500">*</span></Label>
                    <Controller
                      name="sector"
                      control={control}
                      render={({ field }) => (
                        <SearchableSelect
                          id="sector"
                          options={SECTORS_FR}
                          value={field.value || ''}
                          onChange={field.onChange}
                          placeholder="Choisir un secteur"
                          className="h-9 text-sm"
                        />
                      )}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="mainJob" className="text-xs">Poste principal <span className="text-red-500">*</span></Label>
                    <Input id="mainJob" {...register('mainJob')} className="h-9 text-sm" placeholder="Ex. Chef de chantier" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="totalExperience" className="text-xs">Années d'expérience <span className="text-red-500">*</span></Label>
                  <Input
                    id="totalExperience"
                    type="number"
                    min={0}
                    {...register('totalExperience', { valueAsNumber: true })}
                    className="h-9 text-sm w-24"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="professionalSummary" className="text-xs">Résumé professionnel <span className="text-red-500">*</span></Label>
                  <Textarea
                    id="professionalSummary"
                    {...register('professionalSummary')}
                    rows={4}
                    className="resize-none text-sm min-h-[80px]"
                    placeholder="Décrivez votre parcours et vos compétences en quelques lignes..."
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/candidate/dashboard')}
                  className="border-border text-gray-anthracite hover:bg-muted"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" aria-hidden />
                      Enregistrer
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        )}

        {section === 'experiences' && (
          <Card className="rounded-[12px] shadow-md border border-border border-l-4 border-l-primary bg-card overflow-hidden">
            <CardHeader className="py-3 px-4 sm:px-5 bg-muted/30 border-b border-border flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-sm font-semibold text-gray-anthracite flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                Expériences professionnelles
              </CardTitle>
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-white h-8 text-xs" onClick={() => { setEditingExperience(null); setShowExperienceDialog(true) }}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Ajouter
              </Button>
            </CardHeader>
            <CardContent className="p-4">
              {experiences.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Aucune expérience. Cliquez sur « Ajouter » pour en créer une.</p>
              ) : (
                <ul className="space-y-2">
                  {experiences.map((exp) => (
                    <li key={exp.id} className="flex items-center justify-between gap-2 py-2 px-3 rounded-lg border border-border bg-card">
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-gray-anthracite truncate">{exp.position} {exp.company_name && `· ${exp.company_name}`}</p>
                        <p className="text-xs text-muted-foreground">{exp.start_date && new Date(exp.start_date).toLocaleDateString('fr-FR')} {exp.end_date ? `– ${new Date(exp.end_date).toLocaleDateString('fr-FR')}` : '– Aujourd\'hui'}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { setEditingExperience(exp); setShowExperienceDialog(true) }}><Edit className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700" onClick={() => handleDeleteExperience(exp.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}

        {section === 'educations' && (
          <Card className="rounded-[12px] shadow-md border border-border border-l-4 border-l-primary bg-card overflow-hidden">
            <CardHeader className="py-3 px-4 sm:px-5 bg-muted/30 border-b border-border flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-sm font-semibold text-gray-anthracite flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                Formations
              </CardTitle>
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-white h-8 text-xs" onClick={() => { setEditingEducation(null); setShowEducationDialog(true) }}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Ajouter
              </Button>
            </CardHeader>
            <CardContent className="p-4">
              {educations.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Aucune formation. Cliquez sur « Ajouter » pour en créer une.</p>
              ) : (
                <ul className="space-y-2">
                  {educations.map((edu) => (
                    <li key={edu.id} className="flex items-center justify-between gap-2 py-2 px-3 rounded-lg border border-border bg-card">
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-gray-anthracite truncate">{edu.diploma} {edu.institution && `· ${edu.institution}`}</p>
                        <p className="text-xs text-muted-foreground">{edu.graduation_year} {edu.country && `· ${edu.country}`}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { setEditingEducation(edu); setShowEducationDialog(true) }}><Edit className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700" onClick={() => handleDeleteEducation(edu.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}

        {section === 'certifications' && (
          <Card className="rounded-[12px] shadow-md border border-border border-l-4 border-l-primary bg-card overflow-hidden">
            <CardHeader className="py-3 px-4 sm:px-5 bg-muted/30 border-b border-border flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-sm font-semibold text-gray-anthracite flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                Certifications
              </CardTitle>
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-white h-8 text-xs" onClick={() => { setEditingCertification(null); setShowCertificationDialog(true) }}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Ajouter
              </Button>
            </CardHeader>
            <CardContent className="p-4">
              {certifications.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Aucune certification. Cliquez sur « Ajouter » pour en créer une.</p>
              ) : (
                <ul className="space-y-2">
                  {certifications.map((cert) => (
                    <li key={cert.id} className="flex items-center justify-between gap-2 py-2 px-3 rounded-lg border border-border bg-card">
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-gray-anthracite truncate">{cert.title} {cert.issuer && `· ${cert.issuer}`}</p>
                        <p className="text-xs text-muted-foreground">{cert.year}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { setEditingCertification(cert); setShowCertificationDialog(true) }}><Edit className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700" onClick={() => handleDeleteCertification(cert.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}

        {section === 'skills' && (
          <Card className="rounded-[12px] shadow-md border border-border border-l-4 border-l-primary bg-card overflow-hidden">
            <CardHeader className="py-3 px-4 sm:px-5 bg-muted/30 border-b border-border flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-sm font-semibold text-gray-anthracite flex items-center gap-2">
                <Code className="h-4 w-4 text-primary" />
                Compétences
              </CardTitle>
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-white h-8 text-xs" onClick={() => { setEditingSkill(null); setShowSkillDialog(true) }}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Ajouter
              </Button>
            </CardHeader>
            <CardContent className="p-4">
              {skills.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Aucune compétence. Cliquez sur « Ajouter » pour en créer une.</p>
              ) : (
                <ul className="space-y-2">
                  {skills.map((skill) => (
                    <li key={skill.id} className="flex items-center justify-between gap-2 py-2 px-3 rounded-lg border border-border bg-card">
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-gray-anthracite">{skill.name}</p>
                        <p className="text-xs text-muted-foreground">{skill.skill_type} {skill.level && `· ${skill.level}`}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { setEditingSkill(skill); setShowSkillDialog(true) }}><Edit className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700" onClick={() => handleDeleteSkill(skill.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}

        {section === 'preferences' && (
          <Card className="rounded-[12px] shadow-md border border-border border-l-4 border-l-primary bg-card overflow-hidden">
            <CardHeader className="py-3 px-4 sm:px-5 bg-muted/30 border-b border-border flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-sm font-semibold text-gray-anthracite flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Préférences de recherche
              </CardTitle>
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-white h-8 text-xs" onClick={() => setShowPreferencesDialog(true)}>
                <Edit className="h-3.5 w-3.5 mr-1" />
                Modifier
              </Button>
            </CardHeader>
            <CardContent className="p-4">
              {jobPreferences ? (
                <div className="text-sm text-muted-foreground space-y-1">
                  {jobPreferences.contract_type && <p>Contrat : {jobPreferences.contract_type}</p>}
                  {jobPreferences.desired_location && <p>Lieu : {jobPreferences.desired_location}</p>}
                  {jobPreferences.availability && <p>Disponibilité : {jobPreferences.availability}</p>}
                  {(jobPreferences.salary_min != null || jobPreferences.salary_max != null) && (
                    <p>Salaire : {[jobPreferences.salary_min, jobPreferences.salary_max].filter(Boolean).join(' – ')} CFA/mois</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Aucune préférence enregistrée. Cliquez sur « Modifier » pour les définir.</p>
              )}
            </CardContent>
          </Card>
        )}

        {section === 'documents' && (
          <Card className="rounded-[12px] shadow-md border border-border border-l-4 border-l-primary bg-card overflow-hidden">
            <CardHeader className="py-3 px-4 sm:px-5 bg-muted/30 border-b border-border flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-sm font-semibold text-gray-anthracite flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Documents
              </CardTitle>
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-white h-8 text-xs" onClick={() => { setSelectedDocumentFile(null); setSelectedDocumentType('CV'); setShowDocumentDialog(true) }}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Ajouter
              </Button>
            </CardHeader>
            <CardContent className="p-4">
              {filteredDocuments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Aucun document. Cliquez sur « Ajouter » pour en téléverser.</p>
              ) : (
                <ul className="space-y-2">
                  {filteredDocuments.map((doc) => (
                    <li key={doc.id} className="flex items-center justify-between gap-2 py-2 px-3 rounded-lg border border-border bg-card">
                      <div className="min-w-0 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <div>
                          <p className="font-medium text-sm text-gray-anthracite truncate">{doc.original_filename}</p>
                          <p className="text-xs text-muted-foreground">{DOC_TYPE_LABELS[doc.document_type] || doc.document_type}</p>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { setPreviewDocument({ ...doc, url: documentApi.getDocumentServeUrl(doc.id) }); setShowPreviewDialog(true); }}><Eye className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { const a = document.createElement('a'); a.href = documentApi.getDocumentServeUrl(doc.id); a.download = doc.original_filename; a.target = '_blank'; document.body.appendChild(a); a.click(); document.body.removeChild(a); }}><Download className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700" onClick={() => setConfirmDialog({ title: 'Supprimer ce document ?', message: `« ${doc.original_filename} » sera supprimé.`, variant: 'danger', onConfirm: async () => { setConfirmDialog(null); try { await documentApi.deleteDocument(doc.id); setDocuments(documents.filter(d => d.id !== doc.id)); setToast({ message: 'Document supprimé.', type: 'success' }); } catch { setToast({ message: 'Erreur.', type: 'error' }); } } })}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modales formulaire : charte unifiée (primary, gray-anthracite, rounded-12) */}
      <Dialog open={showExperienceDialog} onOpenChange={setShowExperienceDialog}>
        <DialogContent className="max-w-2xl max-h-[88vh] flex flex-col gap-0 p-0 rounded-[12px] border border-border border-l-4 border-l-primary shadow-xl bg-card overflow-hidden">
          <DialogHeader className="bg-muted/40 border-b border-border py-4 pl-5 pr-12 text-left space-y-1.5 shrink-0">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0" aria-hidden>
                <Briefcase className="h-5 w-5" />
              </span>
              <div>
                <DialogTitle className="text-base font-semibold text-gray-anthracite leading-tight">
                  {editingExperience ? 'Modifier l’expérience' : 'Nouvelle expérience professionnelle'}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                  Poste, entreprise, dates et description.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 min-h-0 px-5 py-4">
            <ExperienceForm profileId={profile?.id} experience={editingExperience} onSuccess={async () => { setShowExperienceDialog(false); setEditingExperience(null); await loadProfile(); setToast({ message: 'Expérience enregistrée.', type: 'success' }); }} onCancel={() => { setShowExperienceDialog(false); setEditingExperience(null); }} onError={(msg) => setToast({ message: msg, type: 'error' })} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showEducationDialog} onOpenChange={setShowEducationDialog}>
        <DialogContent className="max-w-2xl max-h-[88vh] flex flex-col gap-0 p-0 rounded-[12px] border border-border border-l-4 border-l-primary shadow-xl bg-card overflow-hidden">
          <DialogHeader className="bg-muted/40 border-b border-border py-4 pl-5 pr-12 text-left space-y-1.5 shrink-0">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0" aria-hidden>
                <GraduationCap className="h-5 w-5" />
              </span>
              <div>
                <DialogTitle className="text-base font-semibold text-gray-anthracite leading-tight">
                  {editingEducation ? 'Modifier la formation' : 'Nouvelle formation'}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                  Diplôme, établissement et années.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 min-h-0 px-5 py-4">
            <EducationForm profileId={profile?.id} education={editingEducation} onSuccess={async () => { setShowEducationDialog(false); setEditingEducation(null); await loadProfile(); setToast({ message: 'Formation enregistrée.', type: 'success' }); }} onCancel={() => { setShowEducationDialog(false); setEditingEducation(null); }} onError={(msg) => setToast({ message: msg, type: 'error' })} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCertificationDialog} onOpenChange={setShowCertificationDialog}>
        <DialogContent className="max-w-2xl max-h-[88vh] flex flex-col gap-0 p-0 rounded-[12px] border border-border border-l-4 border-l-primary shadow-xl bg-card overflow-hidden">
          <DialogHeader className="bg-muted/40 border-b border-border py-4 pl-5 pr-12 text-left space-y-1.5 shrink-0">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0" aria-hidden>
                <Award className="h-5 w-5" />
              </span>
              <div>
                <DialogTitle className="text-base font-semibold text-gray-anthracite leading-tight">
                  {editingCertification ? 'Modifier la certification' : 'Nouvelle certification'}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                  Titre, organisme et date de validité.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 min-h-0 px-5 py-4">
            <CertificationForm profileId={profile?.id} certification={editingCertification} onSuccess={async () => { setShowCertificationDialog(false); setEditingCertification(null); await loadProfile(); setToast({ message: 'Certification enregistrée.', type: 'success' }); }} onCancel={() => { setShowCertificationDialog(false); setEditingCertification(null); }} onError={(msg) => setToast({ message: msg, type: 'error' })} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSkillDialog} onOpenChange={setShowSkillDialog}>
        <DialogContent className="max-w-2xl max-h-[88vh] flex flex-col gap-0 p-0 rounded-[12px] border border-border border-l-4 border-l-primary shadow-xl bg-card overflow-hidden">
          <DialogHeader className="bg-muted/40 border-b border-border py-4 px-5 text-left space-y-1.5 shrink-0">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary" aria-hidden>
                <Code className="h-5 w-5" />
              </span>
              <div>
                <DialogTitle className="text-base font-semibold text-gray-anthracite leading-tight">
                  {editingSkill ? 'Modifier la compétence' : 'Nouvelle compétence'}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                  Nom, type et niveau.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 min-h-0 px-5 py-4">
            <SkillForm profileId={profile?.id} skill={editingSkill} onSuccess={async () => { setShowSkillDialog(false); setEditingSkill(null); await loadProfile(); setToast({ message: 'Compétence enregistrée.', type: 'success' }); }} onCancel={() => { setShowSkillDialog(false); setEditingSkill(null); }} onError={(msg) => setToast({ message: msg, type: 'error' })} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPreferencesDialog} onOpenChange={setShowPreferencesDialog}>
        <DialogContent className="max-w-2xl max-h-[88vh] flex flex-col gap-0 p-0 rounded-[12px] border border-border border-l-4 border-l-primary shadow-xl bg-card overflow-hidden">
          <DialogHeader className="bg-muted/40 border-b border-border py-4 pl-5 pr-12 text-left space-y-1.5 shrink-0">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0" aria-hidden>
                <MapPin className="h-5 w-5" />
              </span>
              <div>
                <DialogTitle className="text-base font-semibold text-gray-anthracite leading-tight">
                  Préférences de recherche d’emploi
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                  Contrat, lieu, disponibilité et rémunération.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 min-h-0 px-5 py-4">
            <PreferencesForm profileId={profile?.id} currentPreferences={jobPreferences} onSuccess={async () => { setShowPreferencesDialog(false); await loadProfile(); setToast({ message: 'Préférences enregistrées.', type: 'success' }); }} onCancel={() => setShowPreferencesDialog(false)} onError={(msg) => setToast({ message: msg, type: 'error' })} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Modale document : zone de dépôt + type */}
      <Dialog open={showDocumentDialog} onOpenChange={setShowDocumentDialog}>
        <DialogContent className="max-w-md flex flex-col gap-0 p-0 rounded-[12px] border border-border border-l-4 border-l-primary shadow-xl bg-card overflow-hidden">
          <DialogHeader className="bg-muted/40 border-b border-border py-4 pl-5 pr-12 text-left space-y-1.5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0" aria-hidden>
                <FileText className="h-5 w-5" />
              </span>
              <div>
                <DialogTitle className="text-base font-semibold text-gray-anthracite leading-tight">
                  Ajouter un document
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                  PDF, JPG ou PNG · 10 Mo max
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="p-5 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-anthracite">Type de document</Label>
              <select
                value={selectedDocumentType}
                onChange={(e) => setSelectedDocumentType(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <option value="CV">Curriculum Vitae</option>
                <option value="ATTESTATION">Attestation</option>
                <option value="CERTIFICATE">Certificat</option>
                <option value="RECOMMENDATION_LETTER">Lettre de recommandation</option>
                <option value="DIPLOMA">Diplôme</option>
                <option value="OTHER">Autre</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-anthracite">Fichier</Label>
              <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 hover:bg-muted/50 transition-colors py-8 px-4 cursor-pointer focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) {
                      if (f.size > 10 * 1024 * 1024) { setToast({ message: 'Fichier trop volumineux (max 10 Mo).', type: 'error' }); e.target.value = ''; return }
                      setSelectedDocumentFile(f)
                    }
                  }}
                />
                {selectedDocumentFile ? (
                  <span className="text-sm font-medium text-gray-anthracite">{selectedDocumentFile.name}</span>
                ) : (
                  <>
                    <Upload className="h-10 w-10 text-muted-foreground mb-2" aria-hidden />
                    <span className="text-sm text-muted-foreground text-center">Cliquez ou glissez un fichier</span>
                  </>
                )}
              </label>
            </div>
          </div>
          <DialogFooter className="border-t border-border px-5 py-4 bg-muted/20 shrink-0 gap-2">
            <Button variant="outline" onClick={() => { setShowDocumentDialog(false); setSelectedDocumentFile(null); setSelectedDocumentType('CV'); }} disabled={uploadingDocument}>
              Annuler
            </Button>
            <Button onClick={handleDocumentUpload} disabled={!selectedDocumentFile || uploadingDocument} className="bg-primary hover:bg-primary/90 text-white">
              {uploadingDocument ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden /> En cours...</> : <><Upload className="h-4 w-4 mr-2" aria-hidden /> Ajouter le document</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modale confirmation suppression */}
      <Dialog open={!!confirmDialog} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <DialogContent className="max-w-sm p-0 rounded-[12px] border border-border shadow-xl bg-card overflow-hidden">
          <DialogHeader className="p-5 pb-2 text-left">
            <div className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600" aria-hidden>
                <Trash2 className="h-5 w-5" />
              </span>
              <div>
                <DialogTitle className="text-base font-semibold text-gray-anthracite leading-tight">
                  {confirmDialog?.title}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-1">
                  {confirmDialog?.message}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="p-5 pt-2 flex flex-row justify-end gap-2 border-t border-border">
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>Annuler</Button>
            <Button variant="destructive" onClick={() => confirmDialog?.onConfirm?.()}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Prévisualisation document */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col gap-0 p-0 rounded-[12px] border border-border shadow-xl bg-card overflow-hidden">
          <DialogHeader className="bg-muted/40 border-b border-border py-3 px-5 flex flex-row items-center gap-2 shrink-0">
            <FileText className="h-5 w-5 text-primary shrink-0" />
            <DialogTitle className="text-base font-semibold text-gray-anthracite truncate">
              {previewDocument?.original_filename || 'Document'}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-auto flex-1 min-h-0 p-4">
            {previewDocument?.url && <iframe title="Aperçu du document" src={previewDocument.url} className="w-full min-h-[60vh] border border-border rounded-lg" />}
          </div>
          <DialogFooter className="border-t border-border px-5 py-3 bg-muted/20 shrink-0 gap-2">
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>Fermer</Button>
            <Button className="bg-primary hover:bg-primary/90 text-white" onClick={() => { if (previewDocument?.url) { const a = document.createElement('a'); a.href = previewDocument.url; a.download = previewDocument.original_filename; a.target = '_blank'; document.body.appendChild(a); a.click(); document.body.removeChild(a); } }}>
              <Download className="h-4 w-4 mr-2" aria-hidden /> Télécharger
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toast */}
      {toast && (
        <div
          role="alert"
          className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 rounded-[12px] shadow-lg border text-sm font-medium text-white ${
            toast.type === 'success' ? 'bg-primary border-primary/80' : 'bg-red-600 border-red-700'
          }`}
          style={toast.type === 'success' ? { backgroundColor: '#226D68' } : {}}
        >
          {toast.message}
        </div>
      )}
    </div>
  )
}
