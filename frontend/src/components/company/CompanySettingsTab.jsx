import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Building2,
  User,
  Mail,
  Phone,
  Briefcase,
  ImageIcon,
  Upload,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react'
import { companyApi, documentApi, authApiService } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const companySchema = z.object({
  name: z.string().min(2, 'Nom entreprise min. 2 caractères'),
  legal_id: z.string().min(9, 'RCCM min. 9 caractères'),
  adresse: z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.string().min(10, 'Adresse min. 10 caractères').optional()
  ),
  contact_first_name: z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.string().min(2, 'Prénom min. 2 caractères').optional()
  ),
  contact_last_name: z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.string().min(2, 'Nom min. 2 caractères').optional()
  ),
  contact_email: z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.string().email('Email invalide').optional()
  ),
  contact_phone: z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.string().optional()
  ),
  contact_function: z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.string().min(2, 'Fonction min. 2 caractères').optional()
  ),
})

export function CompanySettingsTab({ company, onUpdate }) {
  const [logoUrl, setLogoUrl] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  const form = useForm({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: '',
      legal_id: '',
      adresse: '',
      contact_first_name: '',
      contact_last_name: '',
      contact_email: '',
      contact_phone: '',
      contact_function: '',
    },
  })

  const { register, handleSubmit, formState: { errors }, setValue, getValues } = form

  useEffect(() => {
    if (company) {
      setValue('name', company.name || '')
      setValue('legal_id', company.legal_id || '')
      setValue('adresse', company.adresse || '')
      setValue('contact_first_name', company.contact_first_name || '')
      setValue('contact_last_name', company.contact_last_name || '')
      setValue('contact_email', company.contact_email || '')
      setValue('contact_phone', company.contact_phone || '')
      setValue('contact_function', company.contact_function || '')
      setLogoUrl(company.logo_url)
    }
  }, [company, setValue])

  const processLogoFile = useCallback(async (file) => {
    if (!file?.type?.startsWith('image/')) {
      setError('Fichier image requis (JPG, PNG)')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Taille max. 5 Mo')
      return
    }
    if (!company?.id) {
      setError('Enregistrez d\'abord les informations de base')
      return
    }
    try {
      setUploading(true)
      setError(null)
      const uploadResponse = await documentApi.uploadCompanyLogo(file, company.id)
      if (uploadResponse.url) {
        setLogoUrl(uploadResponse.url)
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
        if (onUpdate) onUpdate()
      }
    } catch (err) {
      setError('Erreur upload: ' + (err.response?.data?.detail || err.message))
    } finally {
      setUploading(false)
    }
  }, [company?.id, onUpdate])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer?.files?.[0]
    if (file) processLogoFile(file)
  }, [processLogoFile])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const onSubmit = async (data) => {
    try {
      setError(null)
      setSuccess(false)
      const payload = {
        name: data.name,
        legal_id: data.legal_id,
        adresse: data.adresse || null,
        logo_url: logoUrl || null,
        contact_first_name: data.contact_first_name || null,
        contact_last_name: data.contact_last_name || null,
        contact_email: data.contact_email || null,
        contact_phone: data.contact_phone || null,
        contact_function: data.contact_function || null,
      }
      await companyApi.updateCompany(company.id, payload)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      if (onUpdate) onUpdate()
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Erreur lors de la sauvegarde')
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(false)
    if (newPassword.length < 8) {
      setPasswordError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas.')
      return
    }
    try {
      setChangingPassword(true)
      await authApiService.changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordSuccess(true)
      setTimeout(() => setPasswordSuccess(false), 3000)
    } catch (err) {
      const detail = err.response?.data?.detail || err.message
      setPasswordError(typeof detail === 'string' ? detail : 'Erreur lors du changement de mot de passe.')
    } finally {
      setChangingPassword(false)
    }
  }

  const generateAvatarUrl = (name) => {
    const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'CO'
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=200&background=226D68&color=fff&bold=true`
  }

  if (!company) {
    return (
      <div className="py-12 text-center text-[#6b7280]">
        Aucune entreprise chargée.
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#2C2C2C] font-heading tracking-tight">
          Paramètres de l&apos;entreprise
        </h1>
        <p className="mt-2 text-[#6b7280] max-w-2xl">
          Modifiez les informations de votre entreprise et gérez la sécurité de votre compte.
        </p>
      </div>

      {/* Messages globaux */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-[#E8F4F3] border border-[#226D68]/20 text-[#226D68] text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>Informations de l&apos;entreprise enregistrées.</span>
        </div>
      )}

      {/* Section 1 : Informations de l'entreprise */}
      <Card className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <CardHeader className="px-6 sm:px-8 pt-8 pb-6 bg-gradient-to-b from-[#F8FAFC] to-white border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-[#E8F4F3]">
              <Building2 className="h-6 w-6 text-[#226D68]" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-[#2C2C2C]">Informations de l&apos;entreprise</CardTitle>
              <CardDescription className="text-sm text-[#6b7280] mt-0.5">Nom, RCCM, adresse et contact référent</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-[#2C2C2C] mb-4 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#226D68]" />
                Informations légales
              </h4>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-[#2C2C2C]">Nom de l&apos;entreprise *</Label>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="Ex: Acme SAS"
                    className="h-11 border-gray-200 focus:border-[#226D68] focus:ring-[#226D68]/20"
                  />
                  {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="legal_id" className="text-sm font-medium text-[#2C2C2C]">RCCM / SIRET *</Label>
                  <Input
                    id="legal_id"
                    {...register('legal_id')}
                    placeholder="CI-ABJ-2024-A-12345"
                    className="h-11 border-gray-200 focus:border-[#226D68] focus:ring-[#226D68]/20"
                  />
                  {errors.legal_id && <p className="text-xs text-red-600">{errors.legal_id.message}</p>}
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Label htmlFor="adresse" className="text-sm font-medium text-[#2C2C2C]">Adresse</Label>
                <Input
                  id="adresse"
                  {...register('adresse')}
                  placeholder="Ex: Plateau, 01 BP 123 Abidjan 01"
                  className="h-11 border-gray-200 focus:border-[#226D68] focus:ring-[#226D68]/20"
                />
                {errors.adresse && <p className="text-xs text-red-600">{errors.adresse.message}</p>}
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100">
              <h4 className="text-sm font-semibold text-[#2C2C2C] mb-4 flex items-center gap-2">
                <User className="h-4 w-4 text-[#226D68]" />
                Contact référent
              </h4>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_first_name" className="text-sm text-[#6b7280]">Prénom</Label>
                  <Input
                    id="contact_first_name"
                    {...register('contact_first_name')}
                    placeholder="Jean"
                    className="h-11 border-gray-200 focus:border-[#226D68]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_last_name" className="text-sm text-[#6b7280]">Nom</Label>
                  <Input
                    id="contact_last_name"
                    {...register('contact_last_name')}
                    placeholder="Dupont"
                    className="h-11 border-gray-200 focus:border-[#226D68]"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="contact_email" className="text-sm text-[#6b7280] flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" /> Email
                  </Label>
                  <Input
                    id="contact_email"
                    type="email"
                    {...register('contact_email')}
                    placeholder="jean@entreprise.com"
                    className="h-11 border-gray-200 focus:border-[#226D68]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_phone" className="text-sm text-[#6b7280] flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> Téléphone
                  </Label>
                  <Input
                    id="contact_phone"
                    type="tel"
                    {...register('contact_phone')}
                    placeholder="+225 07 12 34 56 78"
                    className="h-11 border-gray-200 focus:border-[#226D68]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_function" className="text-sm text-[#6b7280] flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" /> Fonction
                  </Label>
                  <Input
                    id="contact_function"
                    {...register('contact_function')}
                    placeholder="DRH, Responsable Recrutement"
                    className="h-11 border-gray-200 focus:border-[#226D68]"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100">
              <h4 className="text-sm font-semibold text-[#2C2C2C] mb-4 flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-[#226D68]" />
                Logo
              </h4>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`
                  flex flex-col sm:flex-row items-center gap-6 p-6 rounded-xl border-2 border-dashed transition-colors
                  ${isDragging ? 'border-[#226D68] bg-[#E8F4F3]/50' : 'border-gray-200 bg-[#F4F6F8]/50 hover:border-[#E8F4F3]'}
                `}
              >
                <img
                  src={logoUrl || generateAvatarUrl(company.name)}
                  alt="Logo"
                  className="w-24 h-24 rounded-xl object-cover border border-gray-100 shadow-sm shrink-0"
                  onError={(e) => { e.target.src = generateAvatarUrl(company.name) }}
                />
                <div className="flex-1 text-center sm:text-left">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      disabled={uploading}
                      onChange={(e) => e.target.files?.[0] && processLogoFile(e.target.files[0])}
                    />
                    <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#226D68] text-white text-sm font-medium hover:bg-[#1a5a55] transition-colors">
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      {uploading ? 'Chargement...' : 'Changer le logo'}
                    </span>
                  </label>
                  <p className="text-xs text-[#6b7280] mt-2">JPG ou PNG, max. 5 Mo. Glissez une image ou cliquez.</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                className="bg-[#226D68] hover:bg-[#1a5a55] text-white"
              >
                Enregistrer les informations
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Section 2 : Mot de passe */}
      <Card className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <CardHeader className="px-6 sm:px-8 pt-8 pb-6 bg-gradient-to-b from-[#F8FAFC] to-white border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-[#E8F4F3]">
              <Lock className="h-6 w-6 text-[#226D68]" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-[#2C2C2C]">Sécurité du compte</CardTitle>
              <CardDescription className="text-sm text-[#6b7280] mt-0.5">Modifiez le mot de passe de votre compte administrateur</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          {passwordError && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm mb-6">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{passwordError}</span>
            </div>
          )}
          {passwordSuccess && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[#E8F4F3] border border-[#226D68]/20 text-[#226D68] text-sm mb-6">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>Mot de passe modifié avec succès.</span>
            </div>
          )}
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="current-password">Mot de passe actuel</Label>
              <p className="text-xs text-[#6b7280]">Inscrit avec Google ou LinkedIn ? Laissez vide pour définir un mot de passe.</p>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="pr-10 h-11 border-gray-200 focus:border-[#226D68]"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-[#226D68]"
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10 h-11 border-gray-200 focus:border-[#226D68]"
                  placeholder="••••••••"
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-[#226D68]"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-[#6b7280]">Minimum 8 caractères</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmer le nouveau mot de passe</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-11 border-gray-200 focus:border-[#226D68]"
                placeholder="••••••••"
              />
            </div>
            <Button
              type="submit"
              disabled={changingPassword}
              className="bg-[#226D68] hover:bg-[#1a5a55] text-white"
            >
              {changingPassword ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {changingPassword ? 'Modification...' : 'Modifier le mot de passe'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
