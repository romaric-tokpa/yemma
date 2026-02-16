import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Briefcase, MapPin, DollarSign, FileText, Search, Filter,
  Loader2, Clock, ArrowRight, Building2, X,
} from 'lucide-react'
import { candidateApi } from '@/services/api'
import { ROUTES } from '@/constants/routes'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { SEO } from '@/components/seo/SEO'
import PublicNavbar from '@/components/layout/PublicNavbar'
import PublicFooter from '@/components/layout/PublicFooter'
import { Toast } from '@/components/common/Toast'

const CONTRACT_TYPES = ['CDI', 'CDD', 'Freelance', 'Stage', 'Alternance', 'Intérim']

export default function CandidateJobsPage() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterTitle, setFilterTitle] = useState('')
  const [filterLocation, setFilterLocation] = useState('')
  const [filterContract, setFilterContract] = useState('')
  const [filterSector, setFilterSector] = useState('')
  const [debouncedTitle, setDebouncedTitle] = useState('')
  const [debouncedLocation, setDebouncedLocation] = useState('')
  const [debouncedSector, setDebouncedSector] = useState('')
  const [toast, setToast] = useState(null)

  const hasActiveFilters = filterTitle || filterLocation || filterContract || filterSector

  const clearFilters = () => {
    setFilterTitle('')
    setFilterLocation('')
    setFilterContract('')
    setFilterSector('')
    setDebouncedTitle('')
    setDebouncedLocation('')
    setDebouncedSector('')
  }

  // Debounce des champs texte (400ms) pour limiter les appels API
  useEffect(() => {
    const t = setTimeout(() => setDebouncedTitle(filterTitle), 400)
    return () => clearTimeout(t)
  }, [filterTitle])
  useEffect(() => {
    const t = setTimeout(() => setDebouncedLocation(filterLocation), 400)
    return () => clearTimeout(t)
  }, [filterLocation])
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSector(filterSector), 400)
    return () => clearTimeout(t)
  }, [filterSector])

  const loadJobs = useCallback(async () => {
    try {
      setLoading(true)
      const data = await candidateApi.listJobs({
        title: debouncedTitle || undefined,
        location: debouncedLocation || undefined,
        contract_type: filterContract || undefined,
        company: debouncedSector || undefined,
      })
      setJobs(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Erreur chargement offres:', err)
      setJobs([])
      setToast({ message: 'Impossible de charger les offres.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [debouncedTitle, debouncedLocation, filterContract, debouncedSector])

  useEffect(() => {
    loadJobs()
  }, [loadJobs])

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="Offres d'emploi | Yemma Solutions"
        description="Découvrez des offres d'emploi qualifiées. CDI, CDD, stage, alternance. Postulez en un clic. Complétez votre profil pour être visible aux recruteurs de la CVthèque."
        keywords="offres emploi, recrutement, CDI, CDD, stage, alternance, candidature, CVthèque"
        canonical="/offres"
      />
      <PublicNavbar variant="dark" />

      {/* Hero - aligné sur /candidat */}
      <section className="relative pt-16 xs:pt-20 md:pt-24 pb-12 xs:pb-16 md:pb-24 overflow-hidden bg-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 100, damping: 20 }}
              className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-[1.15] mb-4 sm:mb-6 font-heading"
            >
              Offres d&apos;emploi
              <br />
              <span className="text-[#e76f51]">qualifiées pour vous</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 90, damping: 18, delay: 0.1 }}
              className="text-base sm:text-lg text-white/85 leading-relaxed mb-8"
            >
              Découvrez des offres d&apos;emploi sélectionnées par nos experts. CDI, CDD, stage, alternance… postulez en un clic. Complétez votre profil pour débloquer vos candidatures et être visible aux recruteurs de la CVthèque.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 90, damping: 18, delay: 0.2 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                size="lg"
                onClick={() => navigate(ROUTES.REGISTER_CANDIDAT)}
                className="h-11 px-6 text-base font-semibold bg-[#e76f51] hover:bg-[#d45a3f] text-white rounded-lg"
              >
                Je m&apos;inscris
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Grille des offres */}
      <main
        className="flex-1 py-10 md:py-14"
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)',
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.08) 1px, transparent 0), linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)',
          backgroundSize: '24px 24px, 100% 100%',
        }}
      >
        <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
          {/* Filtres - refonte design */}
          <div className="mb-8">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-5 w-5 text-[#226D68]" />
                <h2 className="font-semibold text-[#2C2C2C]">Filtrer les offres</h2>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="ml-auto flex items-center gap-1.5 text-sm text-[#6b7280] hover:text-[#226D68] transition-colors"
                  >
                    <X className="h-4 w-4" />
                    Réinitialiser
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#6b7280] mb-1.5">Intitulé de poste</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7280]" />
                    <Input
                      placeholder="Ex: Développeur, RH..."
                      value={filterTitle}
                      onChange={(e) => setFilterTitle(e.target.value)}
                      className="pl-9 h-10 rounded-lg border-gray-200 focus:border-[#226D68] focus:ring-[#226D68]/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6b7280] mb-1.5">Localisation</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7280]" />
                    <Input
                      placeholder="Ex: Abidjan, Paris..."
                      value={filterLocation}
                      onChange={(e) => setFilterLocation(e.target.value)}
                      className="pl-9 h-10 rounded-lg border-gray-200 focus:border-[#226D68] focus:ring-[#226D68]/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6b7280] mb-1.5">Type de contrat</label>
                  <select
                    value={filterContract}
                    onChange={(e) => setFilterContract(e.target.value)}
                    className="h-10 w-full px-3 rounded-lg border border-gray-200 bg-white text-sm focus:border-[#226D68] focus:ring-2 focus:ring-[#226D68]/20 focus:outline-none"
                  >
                    <option value="">Tous les contrats</option>
                    {CONTRACT_TYPES.map((ct) => (
                      <option key={ct} value={ct}>{ct}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6b7280] mb-1.5">Secteur / Entreprise</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7280]" />
                    <Input
                      placeholder="Ex: Tech, Finance..."
                      value={filterSector}
                      onChange={(e) => setFilterSector(e.target.value)}
                      className="pl-9 h-10 rounded-lg border-gray-200 focus:border-[#226D68] focus:ring-[#226D68]/20"
                    />
                  </div>
                </div>
              </div>
              {hasActiveFilters && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
                  {filterTitle && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E8F4F3] text-[#226D68] text-xs font-medium">
                      Poste: {filterTitle}
                      <button type="button" onClick={() => setFilterTitle('')} className="hover:opacity-70">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {filterLocation && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E8F4F3] text-[#226D68] text-xs font-medium">
                      Lieu: {filterLocation}
                      <button type="button" onClick={() => setFilterLocation('')} className="hover:opacity-70">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {filterContract && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E8F4F3] text-[#226D68] text-xs font-medium">
                      {filterContract}
                      <button type="button" onClick={() => setFilterContract('')} className="hover:opacity-70">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {filterSector && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E8F4F3] text-[#226D68] text-xs font-medium">
                      Secteur: {filterSector}
                      <button type="button" onClick={() => setFilterSector('')} className="hover:opacity-70">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Résultats */}
          {!loading && (
            <p className="text-sm text-[#6b7280] mb-4">
              {jobs.length === 0
                ? 'Aucune offre'
                : `${jobs.length} offre${jobs.length > 1 ? 's' : ''} trouvée${jobs.length > 1 ? 's' : ''}`}
              {hasActiveFilters && ' pour vos critères'}
            </p>
          )}

          {/* Liste des offres */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[#226D68]" />
            </div>
          ) : jobs.length === 0 ? (
            <Card className="border-gray-200">
              <CardContent className="py-12 text-center">
                <Briefcase className="h-12 w-12 text-[#6b7280] mx-auto mb-4" />
                <p className="text-[#6b7280]">Aucune offre publiée pour le moment.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {jobs.map((job) => (
                <Link key={job.id} to={ROUTES.JOB_OFFER_DETAIL(job.id)}>
                  <Card className="border border-gray-200 bg-white rounded-xl hover:border-[#226D68]/40 hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col h-full">
                    {/* En-tête : logo ou nom entreprise */}
                    <div className="p-5 pb-0">
                      {job.company_logo_url ? (
                        <img
                          src={job.company_logo_url}
                          alt={job.company_name || ''}
                          className="h-10 w-auto max-w-[120px] object-contain object-left"
                        />
                      ) : (
                        <p className="text-sm font-medium text-[#6b7280] uppercase tracking-wide">
                          {job.company_name || 'Yemma'}
                        </p>
                      )}
                    </div>
                    {/* Titre du poste */}
                    <div className="px-5 pt-4">
                      <h3 className="font-bold text-[#2C2C2C] text-base leading-tight">
                        {job.title}
                      </h3>
                    </div>
                    {/* Séparateur */}
                    <hr className="mt-4 mx-5 border-gray-100" />
                    {/* Infos : localisation, durée, rémunération */}
                    <div className="px-5 py-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[#6b7280]">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-[#226D68] shrink-0" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-[#226D68] shrink-0" />
                        {job.contract_type}
                      </span>
                      {job.salary_range && (
                        <span className="flex items-center gap-1.5">
                          <DollarSign className="h-4 w-4 text-[#226D68] shrink-0" />
                          {job.salary_range}
                        </span>
                      )}
                    </div>
                    {/* Bouton Postuler - lien vers la page détail */}
                    <div className="px-5 pb-5 mt-auto">
                      <span className="inline-flex items-center justify-center gap-2 w-full h-9 rounded-md bg-[#226D68] hover:bg-[#1a5a55] text-white text-sm font-medium transition-colors">
                        <FileText className="h-4 w-4" />
                        Postuler
                      </span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {/* CTA final */}
          <div className="mt-12 md:mt-16 text-center">
            <Button
              size="lg"
              onClick={() => navigate(ROUTES.REGISTER_CANDIDAT)}
              className="h-12 px-8 text-base font-semibold bg-[#e76f51] hover:bg-[#d45a3f] text-white rounded-lg"
            >
              Je m&apos;inscris
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>

      <PublicFooter />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
