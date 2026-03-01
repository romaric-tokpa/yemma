import { motion } from 'framer-motion'
import { FileText, User, Briefcase, Star } from 'lucide-react'

/**
 * Illustration hero : CV d'un profil validé.
 * Représente une fiche candidat avec photo, infos et score de matching.
 */
export default function ProfileCVHeroIllustration() {
  return (
    <div className="relative w-full max-w-[420px] xs:max-w-[480px] sm:max-w-[540px] lg:max-w-[600px] mx-auto min-h-[380px] xs:min-h-[420px] sm:min-h-[460px] lg:min-h-[520px]">
      {/* Carte CV principale */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[90%] max-w-[380px] sm:max-w-[420px] lg:max-w-[460px]"
      >
        <div
          className="relative bg-white rounded-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] border border-gray-200 overflow-hidden"
          style={{ boxShadow: '0 20px 60px -15px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)' }}
        >
          {/* En-tête CV - photo + nom */}
          <div className="p-5 sm:p-6 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#226D68]/20 flex items-center justify-center shrink-0 overflow-hidden">
                <User className="w-9 h-9 sm:w-10 sm:h-10 text-[#226D68]" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="h-5 sm:h-6 bg-[#2C2C2C] rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
              {/* Badge matching */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#226D68]/10 shrink-0">
                <Star className="w-4 h-4 sm:w-5 sm:h-5 text-[#226D68]" fill="currentColor" strokeWidth={0} />
                <span className="text-xs sm:text-sm font-semibold text-[#226D68]">87%</span>
              </div>
            </div>
          </div>

          {/* Corps du CV */}
          <div className="p-5 sm:p-6 space-y-4">
            {/* Compétences */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-[#226D68]" strokeWidth={1.5} />
                <div className="h-3 bg-gray-200 rounded w-24 sm:w-28" />
              </div>
              <div className="flex flex-wrap gap-2">
                {['React', 'Node.js', 'TypeScript'].map((skill) => (
                  <span
                    key={skill}
                    className="px-2.5 py-1 rounded-md text-xs sm:text-sm font-medium bg-[#226D68]/10 text-[#226D68]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Expérience */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-[#226D68]" strokeWidth={1.5} />
                <div className="h-3 bg-gray-200 rounded w-28 sm:w-32" />
              </div>
              <div className="space-y-2">
                <div className="h-2.5 sm:h-3 bg-gray-100 rounded w-full" />
                <div className="h-2.5 sm:h-3 bg-gray-100 rounded w-5/6" />
                <div className="h-2.5 sm:h-3 bg-gray-100 rounded w-4/5" />
              </div>
            </div>
          </div>

          {/* Pied de carte - validé par Yemma */}
          <div className="px-5 sm:px-6 py-3 bg-[#F9FAFB] border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs sm:text-sm text-[#6b7280]">Profil validé</span>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-[#226D68]/30" />
              <span className="text-xs sm:text-sm font-medium text-[#226D68]">Yemma</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Élément décoratif - document secondaire en arrière-plan */}
      <motion.div
        initial={{ opacity: 0, x: -20, y: 8 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
        className="absolute top-[8%] left-[2%] w-[38%] max-w-[130px] sm:max-w-[160px] bg-white rounded-lg shadow-[0_8px_30px_-10px_rgba(0,0,0,0.1)] border border-gray-200 p-3"
        style={{ transform: 'rotate(-12deg)' }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#e76f51]/30 shrink-0" />
          <div className="h-2 bg-gray-200 rounded flex-1" />
        </div>
        <div className="space-y-1.5">
          <div className="h-1.5 bg-gray-100 rounded w-full" />
          <div className="h-1.5 bg-gray-100 rounded w-4/5" />
        </div>
      </motion.div>

      {/* Badge "Validé" flottant */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="absolute top-[18%] right-[5%] px-3 py-2 rounded-lg bg-[#226D68] text-white text-xs sm:text-sm font-semibold shadow-lg"
      >
        Validé ✓
      </motion.div>

      {/* Forme décorative */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.6 }}
        className="absolute bottom-[25%] right-[0%] w-10 h-10 sm:w-12 sm:h-12 bg-[#e76f51] rounded-lg opacity-90"
        style={{ transform: 'rotate(15deg)', boxShadow: '0 4px 12px rgba(231, 111, 81, 0.35)' }}
      />
    </div>
  )
}
