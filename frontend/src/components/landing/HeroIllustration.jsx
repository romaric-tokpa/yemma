import { motion } from 'framer-motion'

/**
 * Illustration hero : ordinateur portable, document CV flottant, lampe de bureau.
 */
export default function HeroIllustration() {
  return (
    <div className="relative w-full max-w-[280px] xs:max-w-[320px] sm:max-w-[380px] lg:max-w-[440px] mx-auto min-h-[240px] xs:min-h-[280px] sm:min-h-[320px] lg:min-h-[380px]">
      {/* Laptop - incliné légèrement */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="absolute bottom-0 left-1/2 w-[85%] max-w-[200px] xs:max-w-[220px] sm:max-w-[260px]"
        style={{
          transform: 'translateX(-50%) translateY(0) rotate(-5deg)',
          transformOrigin: 'center bottom',
        }}
      >
        <div className="relative bg-white rounded-t-xl rounded-b-sm shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-gray-200 overflow-hidden">
          {/* Écran */}
          <div className="aspect-[4/3] bg-gray-50 flex items-center justify-center p-3">
            <div className="w-full h-full bg-white rounded border border-gray-100 flex items-center justify-center">
              <div className="text-center text-gray-300 text-[10px]">
                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-gray-200" />
                <div className="space-y-1.5">
                  <div className="h-1.5 bg-gray-200 rounded w-4/5 mx-auto" />
                  <div className="h-1.5 bg-gray-200 rounded w-3/5 mx-auto" />
                  <div className="h-1 bg-gray-100 rounded w-full mx-auto" />
                  <div className="h-1 bg-gray-100 rounded w-full mx-auto" />
                </div>
              </div>
            </div>
          </div>
          {/* Base / clavier */}
          <div className="h-2 bg-gray-200 rounded-b-sm" />
        </div>
      </motion.div>

      {/* Document CV flottant - au-dessus à gauche */}
      <motion.div
        initial={{ opacity: 0, x: -24, y: 8 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
        className="absolute top-[12%] left-[2%] w-[42%] max-w-[130px] bg-white rounded-lg shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-gray-100 p-2.5"
        style={{ transform: 'rotate(-8deg)' }}
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#226D68]/25 shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="h-1.5 bg-gray-200 rounded w-full" />
              <div className="h-1.5 bg-gray-200 rounded w-4/5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="h-1 bg-gray-100 rounded w-full" />
            <div className="h-1 bg-gray-100 rounded w-full" />
            <div className="h-1 bg-gray-100 rounded w-3/4" />
          </div>
        </div>
      </motion.div>

      {/* Lampe de bureau - droite */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.45 }}
        className="absolute bottom-[22%] right-[0%] lg:right-[2%]"
      >
        <div className="relative">
          {/* Abat-jour bleu-vert */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #226D68 0%, #2d8a84 100%)',
              boxShadow: '0 0 24px 10px rgba(34, 109, 104, 0.2)',
            }}
          />
          {/* Pied articulé */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 w-1 h-4 bg-amber-100 rounded" style={{ backgroundColor: '#d4a574' }} />
        </div>
      </motion.div>

      {/* Cube orange décoratif - arrière-plan gauche */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.55 }}
        className="absolute bottom-[32%] left-[0%] w-10 h-10 bg-[#e76f51] rounded-lg opacity-90"
        style={{ transform: 'rotate(15deg)', boxShadow: '0 4px 14px rgba(231, 111, 81, 0.3)' }}
      />

      {/* Cercle décoratif discret */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.65 }}
        className="absolute top-[5%] right-[15%] w-5 h-5 rounded-full border-2 border-[#226D68]/25"
      />
    </div>
  )
}
