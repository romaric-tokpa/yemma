import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Briefcase, Loader2, MapPin, Pencil, Plus, Upload, ImageIcon, Mail, FileText, ArrowLeft,
} from 'lucide-react'
import { candidateApi, documentApi } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import AdminLayout from '@/components/admin/AdminLayout'
import { Toast } from '@/components/common/Toast'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { SECTORS_FR } from '@/data/sectors'

const CONTRACT_TYPES = ['CDI', 'CDD', 'Freelance', 'Stage', 'Alternance', 'Intérim']

const APPLICATION_TYPES = {
  internal: 'Interne (via Yemma - acquisition profil)',
  external_url: 'Redirection vers site externe',
  email: 'Envoi par email',
}

const defaultForm = {
  title: '',
  description: '',
  location: '',
  contract_type: 'CDI',
  sector: '',
  salary_range: '',
  requirements: '',
  expires_at: '',
  company_name: '',
  company_logo_url: '',
  application_type: 'internal',
  external_application_url: '',
  application_email: '',
}

export default function AdminJobFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [form, setForm] = useState(defaultForm)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [toast, setToast] = useState(null)
  const [jobStatus, setJobStatus] = useState(null)

  useEffect(() => {
    if (isEdit) {
      const loadJob = async () => {
        try {
          setLoading(true)
          const job = await candidateApi.adminGetJob(parseInt(id, 10))
          setJobStatus(job?.status)
          const appType = job.external_application_url ? 'external_url' : job.application_email ? 'email' : 'internal'
          setForm({
            title: job.title || '',
            description: job.description || '',
            location: job.location || '',
            contract_type: job.contract_type || 'CDI',
            sector: job.sector || '',
            salary_range: job.salary_range || '',
            requirements: job.requirements || '',
            expires_at: job.expires_at ? job.expires_at.slice(0, 10) : '',
            company_name: job.company_name || '',
            company_logo_url: job.company_logo_url || '',
            application_type: appType,
            external_application_url: job.external_application_url || '',
            application_email: job.application_email || '',
          })
        } catch {
          setToast({ message: 'Offre introuvable.', type: 'error' })
          navigate('/admin/jobs')
        } finally {
          setLoading(false)
        }
      }
      loadJob()
    }
  }, [id, isEdit, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.description.trim() || !form.location.trim() || !form.contract_type) {
      setToast({ message: 'Titre, description, localisation et type de contrat sont requis.', type: 'error' })
      return
    }
    if (form.application_type === 'external_url' && !form.external_application_url?.trim()) {
      setToast({ message: 'Indiquez l\'URL de candidature pour la redirection externe.', type: 'error' })
      return
    }
    if (form.application_type === 'email' && !form.application_email?.trim()) {
      setToast({ message: 'Indiquez l\'email de réception des candidatures.', type: 'error' })
      return
    }
    try {
      setSaving(true)
      const payload = {
        title: form.title.trim(),
        description: form.description,
        location: form.location.trim(),
        contract_type: form.contract_type,
        sector: form.sector?.trim() || null,
        salary_range: form.salary_range.trim() || null,
        requirements: form.requirements.trim() || null,
        expires_at: form.expires_at ? `${form.expires_at}T23:59:59` : null,
        company_name: form.company_name.trim() || null,
        company_logo_url: form.company_logo_url.trim() || null,
        external_application_url: form.application_type === 'external_url' ? form.external_application_url.trim() || null : null,
        application_email: form.application_type === 'email' ? form.application_email.trim() || null : null,
      }
      if (isEdit) {
        await candidateApi.adminUpdateJob(parseInt(id, 10), payload)
        setToast({ message: 'Offre mise à jour.', type: 'success' })
        navigate('/admin/jobs')
      } else {
        await candidateApi.adminCreateJob(payload)
        setToast({ message: 'Offre créée.', type: 'success' })
        navigate('/admin/jobs')
      }
    } catch (err) {
      const detail = err.response?.data?.detail
      setToast({ message: (typeof detail === 'string' ? detail : 'Erreur lors de l\'enregistrement.') || 'Erreur', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-[#226D68]" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div id="admin-main" className="max-w-2xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
        <Link
          to="/admin/jobs"
          className="inline-flex items-center gap-2 text-sm text-[#6b7280] hover:text-[#226D68] mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux offres
        </Link>
        {(jobStatus === 'ARCHIVED' || jobStatus === 'CLOSED') && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200">
            <p className="text-sm text-amber-800">
              Cette offre est {jobStatus === 'ARCHIVED' ? 'archivée (expirée)' : 'fermée'}. Vous pouvez modifier son contenu ici. Pour la republier, utilisez le bouton <strong>Reconduire</strong> dans la liste des offres.
            </p>
          </div>
        )}

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-[#F8FAFC]/60">
            <h1 className="text-xl font-bold text-[#2C2C2C]">
              {isEdit ? 'Modifier l\'offre' : 'Nouvelle offre'}
            </h1>
            <p className="text-sm text-[#6b7280] mt-0.5">
              La description supporte le formatage HTML (gras, listes, liens).
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Section Infos principales */}
            <div className="space-y-4">
              <h4 className="font-semibold text-[#2C2C2C] flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#226D68]" />
                Informations principales
              </h4>
              <div>
                <Label htmlFor="title">Titre du poste *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Ex: Gestionnaire RH - 800k FCFA/mois"
                  className="mt-1.5"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description *</Label>
                <div className="mt-1.5">
                  <RichTextEditor
                    value={form.description}
                    onChange={(v) => setForm((f) => ({ ...f, description: v }))}
                    placeholder="Décrivez le poste, les missions, l'environnement..."
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="requirements">Prérequis</Label>
                <Textarea
                  id="requirements"
                  value={form.requirements}
                  onChange={(e) => setForm((f) => ({ ...f, requirements: e.target.value }))}
                  placeholder="Diplôme, expérience, compétences..."
                  rows={3}
                  className="mt-1.5"
                />
              </div>
            </div>

            {/* Section Localisation & Contrat */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h4 className="font-semibold text-[#2C2C2C] flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#226D68]" />
                Localisation & contrat
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Localisation *</Label>
                  <Input
                    id="location"
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    placeholder="Ex: Abidjan, Dakar"
                    className="mt-1.5"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contract_type">Type de contrat *</Label>
                  <select
                    id="contract_type"
                    value={form.contract_type}
                    onChange={(e) => setForm((f) => ({ ...f, contract_type: e.target.value }))}
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 mt-1.5 text-sm focus:border-[#226D68] focus:ring-2 focus:ring-[#226D68]/20"
                  >
                    {CONTRACT_TYPES.map((ct) => (
                      <option key={ct} value={ct}>{ct}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="sector">Secteur d'activité</Label>
                  <div className="mt-1.5">
                    <SearchableSelect
                      id="sector"
                      options={SECTORS_FR}
                      value={form.sector}
                      onChange={(value) => setForm((f) => ({ ...f, sector: value }))}
                      placeholder="Rechercher ou sélectionner un secteur..."
                      className="rounded-lg border-gray-200 text-sm focus:border-[#226D68] focus:ring-2 focus:ring-[#226D68]/20"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="salary_range">Fourchette salariale</Label>
                  <Input
                    id="salary_range"
                    value={form.salary_range}
                    onChange={(e) => setForm((f) => ({ ...f, salary_range: e.target.value }))}
                    placeholder="Ex: 600k - 800k FCFA/mois"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="expires_at">Date d'expiration</Label>
                  <Input
                    id="expires_at"
                    type="date"
                    value={form.expires_at}
                    onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))}
                    className="mt-1.5"
                  />
                </div>
              </div>
            </div>

            {/* Section Entreprise */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h4 className="font-semibold text-[#2C2C2C] flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-[#226D68]" />
                Entreprise (optionnel)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company_name">Nom de l'entreprise</Label>
                  <Input
                    id="company_name"
                    value={form.company_name}
                    onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
                    placeholder="Ex: Acme Corp"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Logo de l'entreprise</Label>
                  <div className="flex items-center gap-3 mt-1.5">
                    <input
                      id="company-logo-upload"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={uploadingLogo}
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        if (!file.type.startsWith('image/')) {
                          setToast({ message: 'Veuillez sélectionner une image (JPG, PNG, WebP).', type: 'error' })
                          return
                        }
                        if (file.size > 2 * 1024 * 1024) {
                          setToast({ message: 'Le logo ne doit pas dépasser 2 Mo.', type: 'error' })
                          return
                        }
                        try {
                          setUploadingLogo(true)
                          const res = await documentApi.uploadJobOfferLogo(file)
                          setForm((f) => ({ ...f, company_logo_url: res.url }))
                        } catch (err) {
                          setToast({ message: err.response?.data?.detail || 'Erreur lors de l\'upload.', type: 'error' })
                        } finally {
                          setUploadingLogo(false)
                          e.target.value = ''
                        }
                      }}
                    />
                    {form.company_logo_url ? (
                      <div className="flex items-center gap-2">
                        <img src={form.company_logo_url} alt="Logo" className="h-12 w-12 rounded object-contain border bg-white" />
                        <div className="flex flex-col gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={uploadingLogo}
                            onClick={() => document.getElementById('company-logo-upload')?.click()}
                          >
                            {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                            Changer
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            disabled={uploadingLogo}
                            onClick={() => setForm((f) => ({ ...f, company_logo_url: '' }))}
                          >
                            Supprimer
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <label
                        htmlFor="company-logo-upload"
                        className={`flex items-center justify-center gap-2 w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition-colors hover:bg-[#E8F4F3]/30 hover:border-[#226D68]/40 ${uploadingLogo ? 'opacity-60 pointer-events-none' : 'border-gray-200'}`}
                      >
                        {uploadingLogo ? (
                          <Loader2 className="h-6 w-6 animate-spin text-[#226D68]" />
                        ) : (
                          <>
                            <ImageIcon className="h-6 w-6 text-[#6b7280]" />
                            <span className="text-sm text-[#6b7280]">Choisir une image (JPG, PNG, WebP, max 2 Mo)</span>
                          </>
                        )}
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Mode de candidature */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h4 className="font-semibold text-[#2C2C2C] flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#226D68]" />
                Mode de candidature
              </h4>
              <div className="space-y-3">
                {Object.entries(APPLICATION_TYPES).map(([value, label]) => (
                  <label
                    key={value}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      form.application_type === value ? 'border-[#226D68] bg-[#E8F4F3]/50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="application_type"
                      value={value}
                      checked={form.application_type === value}
                      onChange={(e) => setForm((f) => ({ ...f, application_type: e.target.value }))}
                      className="rounded-full border-[#226D68] text-[#226D68] focus:ring-[#226D68]"
                    />
                    <span className="text-sm font-medium text-[#2C2C2C]">{label}</span>
                  </label>
                ))}
              </div>
              {form.application_type === 'external_url' && (
                <div className="mt-3">
                  <Label htmlFor="external_application_url">URL de candidature *</Label>
                  <Input
                    id="external_application_url"
                    value={form.external_application_url}
                    onChange={(e) => setForm((f) => ({ ...f, external_application_url: e.target.value }))}
                    placeholder="https://entreprise.com/candidature"
                    className="mt-1.5"
                  />
                </div>
              )}
              {form.application_type === 'email' && (
                <div className="mt-3">
                  <Label htmlFor="application_email">Email de réception *</Label>
                  <Input
                    id="application_email"
                    type="email"
                    value={form.application_email}
                    onChange={(e) => setForm((f) => ({ ...f, application_email: e.target.value }))}
                    placeholder="recrutement@entreprise.com"
                    className="mt-1.5"
                  />
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <Link to="/admin/jobs">
                <Button type="button" variant="outline">
                  Annuler
                </Button>
              </Link>
              <Button type="submit" className="bg-[#226D68] hover:bg-[#1a5a55] text-white" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : isEdit ? <Pencil className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                {isEdit ? 'Enregistrer les modifications' : 'Créer l\'offre'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  )
}
