import { motion } from 'framer-motion'

/**
 * Illustration CTA candidat : profil validé / visible aux recruteurs.
 * Style superposé similaire à CTACardsIllustration mais orienté candidat.
 */
export default function CandidateCTAIllustration() {
  return (
    <div className="relative w-full max-w-[220px] xs:max-w-[260px] sm:max-w-[280px] lg:max-w-[320px] mx-auto min-h-[160px] xs:min-h-[180px] sm:min-h-[200px] lg:min-h-[240px] flex items-center justify-center">
      {/* Carte profil 1 - dessous, gris clair */}
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.35, delay: 0.08 }}
        className="absolute bottom-10 left-[18%] w-[65%] bg-gray-100 rounded-lg shadow-lg border border-gray-200 p-2.5 -rotate-[14deg]"
      >
        <div className="flex gap-2">
          <div className="w-7 h-7 rounded-full bg-gray-300 shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-2 bg-gray-300 rounded w-3/4" />
            <div className="h-1.5 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      </motion.div>

      {/* Carte profil 2 - milieu */}
      <motion.div
        initial={{ opacity: 0, x: 12 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.35, delay: 0.12 }}
        className="absolute bottom-12 left-[22%] w-[68%] bg-white rounded-lg shadow-xl border border-gray-200 p-2.5 -rotate-[6deg]"
      >
        <div className="flex gap-2">
          <div className="w-6 h-6 rounded-full bg-[#E8F4F3] shrink-0 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-[#226D68]/60" />
          </div>
          <div className="flex-1 space-y-1.5">
            <div className="h-2 bg-gray-200 rounded w-4/5" />
            <div className="h-1.5 bg-gray-100 rounded w-2/3" />
          </div>
        </div>
      </motion.div>

      {/* Carte profil 3 - dessus, profil candidat mis en avant */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.35, delay: 0.16 }}
        className="absolute bottom-14 left-[20%] w-[70%] bg-white rounded-lg shadow-[0_12px_40px_-8px_rgba(0,0,0,0.2)] border border-gray-100 p-3 rotate-[2deg]"
      >
        <div className="flex gap-3">
          <div className="w-9 h-9 rounded-full bg-[#226D68]/20 shrink-0 flex items-center justify-center">
            <div className="w-5 h-5 rounded-full bg-[#226D68]" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="h-2.5 bg-[#2C2C2C] rounded w-4/5" />
            <div className="h-2 bg-gray-200 rounded w-3/5" />
            <div className="flex gap-1 mt-1.5">
              <span className="px-2 py-0.5 bg-[#e76f51]/20 rounded text-[10px] font-semibold text-[#e76f51]">
                Validé
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
