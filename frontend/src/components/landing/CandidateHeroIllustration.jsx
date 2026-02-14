import { motion } from 'framer-motion'

/**
 * Illustration hero candidat : écran avec profil/CV, avatars flottants.
 * Style sombre, profil visible aux recruteurs.
 */
export default function CandidateHeroIllustration() {
  return (
    <div className="relative w-full max-w-[320px] xs:max-w-[360px] sm:max-w-[400px] mx-auto min-h-[280px] sm:min-h-[320px]">
      {/* Fond écran / moniteur */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 80, damping: 18 }}
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[90%] max-w-[280px]"
      >
        <div className="relative bg-[#2a2a2a] rounded-t-xl rounded-b-sm border border-gray-600 overflow-hidden shadow-2xl">
          {/* Écran - contenu type CV/profil */}
          <div className="aspect-[4/3] bg-[#1a1a1a] flex flex-col p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-[#226D68] flex items-center justify-center">
                <span className="text-white font-bold text-xs">Y</span>
              </div>
              <div className="h-2 bg-gray-600 rounded w-24" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-600 rounded w-3/4" />
              <div className="h-2 bg-gray-700 rounded w-1/2" />
              <div className="h-2 bg-gray-700 rounded w-full" />
              <div className="h-2 bg-gray-700 rounded w-5/6" />
              <div className="flex gap-2 mt-3">
                <span className="px-2 py-0.5 bg-[#226D68]/30 rounded text-[10px] text-[#226D68]">Compétences</span>
                <span className="px-2 py-0.5 bg-[#226D68]/30 rounded text-[10px] text-[#226D68]">Matching</span>
              </div>
            </div>
          </div>
          {/* Base */}
          <div className="h-3 bg-[#1a1a1a] rounded-b-sm" />
        </div>
      </motion.div>

      {/* Avatar flottant 1 - homme */}
      <motion.div
        initial={{ opacity: 0, x: -24, y: 12 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.15 }}
        className="absolute top-[8%] left-[5%] w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-white shadow-lg"
      >
        <img
          src="/candidate-profile-cvtheque.png"
          alt=""
          className="w-full h-full object-cover"
        />
      </motion.div>

      {/* Avatar flottant 2 - femme */}
      <motion.div
        initial={{ opacity: 0, x: 20, y: -8 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.25 }}
        className="absolute top-[15%] right-[8%] w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-white shadow-lg"
      >
        <img
          src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop"
          alt=""
          className="w-full h-full object-cover"
        />
      </motion.div>

      {/* Avatar flottant 3 - homme barbu */}
      <motion.div
        initial={{ opacity: 0, x: 16, y: 16 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.3 }}
        className="absolute bottom-[35%] right-[2%] w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-white shadow-lg"
      >
        <img
          src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop"
          alt=""
          className="w-full h-full object-cover"
        />
      </motion.div>

      {/* Lampe bureau - accent orange */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 18, delay: 0.35 }}
        className="absolute bottom-[30%] left-[0%]"
      >
        <div
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #e76f51 0%, #d45a3f 100%)',
            boxShadow: '0 0 20px 8px rgba(231, 111, 81, 0.3)',
          }}
        />
      </motion.div>

      {/* Forme hexagonale orange */}
      <motion.div
        initial={{ opacity: 0, rotate: -15, scale: 0.8 }}
        animate={{ opacity: 1, rotate: 15, scale: 1 }}
        transition={{ type: 'spring', stiffness: 100, damping: 16, delay: 0.4 }}
        className="absolute bottom-[18%] right-[15%] w-6 h-6 sm:w-8 sm:h-8 bg-[#e76f51] rounded-lg opacity-90"
        style={{ boxShadow: '0 4px 12px rgba(231, 111, 81, 0.4)' }}
      />
    </div>
  )
}
