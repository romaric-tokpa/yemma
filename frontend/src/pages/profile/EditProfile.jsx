import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { candidateApi, documentApi } from '@/services/api'
import { ArrowLeft, Upload, Loader2, Save } from 'lucide-react'

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

export default function EditProfile() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState(null)
  const [photoUrl, setPhotoUrl] = useState(null)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)

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

  const { register, handleSubmit, formState: { errors }, setValue, watch } = form

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const profileData = await candidateApi.getMyProfile()
      setProfile(profileData)
      setPhotoUrl(profileData.photo_url)

      // Pré-remplir le formulaire
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
      setValue('totalExperience', profileData.total_experience || 0)
    } catch (error) {
      console.error('Error loading profile:', error)
      alert('Erreur lors du chargement du profil')
      navigate('/candidate/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file || !profile?.id) return

    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image (JPG, PNG)')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('La photo ne doit pas dépasser 5MB')
      return
    }

    try {
      setIsUploadingPhoto(true)
      // Utiliser l'endpoint dédié pour les photos de profil
      const uploadResult = await documentApi.uploadProfilePhoto(file, profile.id)

      // L'endpoint retourne l'ID du document, on doit construire l'URL complète
      // Si serve_url est déjà une URL complète, l'utiliser, sinon construire l'URL
      let serveUrl = uploadResult.serve_url
      
      // Si c'est une URL relative, construire l'URL complète
      if (serveUrl && serveUrl.startsWith('/')) {
        serveUrl = documentApi.getDocumentServeUrl(uploadResult.id)
      } else if (uploadResult.id) {
        // Si serve_url n'est pas fourni mais qu'on a l'ID, construire l'URL
        serveUrl = documentApi.getDocumentServeUrl(uploadResult.id)
      }

      await candidateApi.updateProfile(profile.id, { photo_url: serveUrl })
      setPhotoUrl(serveUrl)
    } catch (error) {
      console.error('Error uploading photo:', error)
      alert('Erreur lors du téléchargement de la photo')
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  const onSubmit = async (data) => {
    if (!profile?.id) return

    try {
      setSaving(true)

      const updateData = {
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
        total_experience: data.totalExperience || null,
      }

      await candidateApi.updateProfile(profile.id, updateData)
      navigate('/candidate/dashboard')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Erreur lors de la mise à jour: ' + (error.response?.data?.detail || error.message))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-light to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#226D68]" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-light to-white">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/candidate/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-3xl font-bold font-heading text-gray-anthracite">Modifier mon profil</h1>
          <p className="text-muted-foreground mt-2">Mettez à jour vos informations personnelles</p>
        </div>

        <Card className="rounded-[16px] shadow-lg border-0 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-[#226D68]/5 to-blue-deep/5 border-b">
            <CardTitle className="text-2xl font-bold text-gray-anthracite font-heading">Informations personnelles</CardTitle>
            <CardDescription>Modifiez vos informations de base</CardDescription>
          </CardHeader>
          
          <CardContent className="p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Photo de profil */}
              <div className="space-y-4">
                <Label>Photo de profil</Label>
                <div className="flex items-center gap-6">
                  {photoUrl && (
                    <img
                      src={photoUrl}
                      alt="Photo de profil"
                      className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                      onError={(e) => {
                        e.target.style.display = 'none'
                      }}
                    />
                  )}
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      disabled={isUploadingPhoto}
                      className="max-w-xs"
                    />
                    {isUploadingPhoto && (
                      <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Téléchargement en cours...
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Formats acceptés: JPG, PNG. Taille maximale: 5 Mo
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom *</Label>
                  <Input
                    id="firstName"
                    {...register('firstName')}
                    className="h-11"
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-600">{errors.firstName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom *</Label>
                  <Input
                    id="lastName"
                    {...register('lastName')}
                    className="h-11"
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-600">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  {...register('phone')}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date de naissance</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  {...register('dateOfBirth')}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nationality">Nationalité</Label>
                <Input
                  id="nationality"
                  {...register('nationality')}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  {...register('address')}
                  className="h-11"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Ville</Label>
                  <Input
                    id="city"
                    {...register('city')}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Pays</Label>
                  <Input
                    id="country"
                    {...register('country')}
                    className="h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profileTitle">Titre du profil</Label>
                <Input
                  id="profileTitle"
                  placeholder="Ex: Ingénieur Génie Civil"
                  {...register('profileTitle')}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="professionalSummary">Résumé professionnel</Label>
                <Textarea
                  id="professionalSummary"
                  placeholder="Décrivez votre parcours professionnel..."
                  {...register('professionalSummary')}
                  rows={6}
                  className="resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sector">Secteur</Label>
                  <Input
                    id="sector"
                    {...register('sector')}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mainJob">Poste principal</Label>
                  <Input
                    id="mainJob"
                    {...register('mainJob')}
                    className="h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalExperience">Années d'expérience</Label>
                <Input
                  id="totalExperience"
                  type="number"
                  min="0"
                  {...register('totalExperience', { valueAsNumber: true })}
                  className="h-11"
                />
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/candidate/dashboard')}
                  className="border-blue-deep text-blue-deep hover:bg-blue-deep/10"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-[#226D68] hover:bg-[#1a5a55] text-white"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Enregistrer
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
