import { motion } from 'framer-motion'

/**
 * Illustration pour la page inscription candidat - style capture (laptop, CV, lampe).
 */
export default function RegisterCandidatIllustration() {
  return (
    <div className="relative w-full max-w-[400px] mx-auto min-h-[320px] flex items-center justify-center">
      {/* Lampe bureau - teal */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="absolute right-[15%] top-[20%]"
      >
        <div className="relative">
          <div
            className="w-12 h-16 rounded-t-lg flex items-center justify-center"
            style={{
              background: 'linear-gradient(180deg, #2dd4bf 0%, #14b8a6 100%)',
              boxShadow: '0 4px 12px rgba(20, 184, 166, 0.3)',
            }}
          />
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-2 bg-amber-100 rounded-full" />
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-2 h-4 bg-amber-200 rounded" />
        </div>
      </motion.div>

      {/* Laptop */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-[75%] max-w-[220px]"
      >
        <div className="bg-white rounded-lg border-2 border-gray-200 shadow-xl overflow-hidden">
          {/* Écran */}
          <div className="aspect-[4/3] bg-[#1a1a1a] p-2 relative">
            <div className="h-full bg-white rounded overflow-hidden">
              {/* CV qui sort de l'écran */}
              <div className="p-2 space-y-1">
                <div className="flex gap-2 items-center">
                  <div className="w-8 h-8 rounded-full bg-gray-300 shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="h-2 bg-gray-200 rounded w-3/4" />
                    <div className="h-1.5 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-1 bg-gray-100 rounded w-full" />
                <div className="h-1 bg-gray-100 rounded w-5/6" />
                <div className="h-1 bg-gray-100 rounded w-4/5" />
              </div>
            </div>
          </div>
          {/* Base */}
          <div className="h-3 bg-gray-100 rounded-b border-t border-gray-200 flex justify-center">
            <div className="w-12 h-1 bg-gray-300 rounded" />
          </div>
        </div>
      </motion.div>

      {/* Prisme hexagonal orange */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="absolute left-[10%] bottom-[25%] w-10 h-12 bg-[#e76f51] rounded-lg opacity-90"
        style={{
          transform: 'perspective(100px) rotateY(-15deg) rotateX(5deg)',
          boxShadow: '0 4px 12px rgba(231, 111, 81, 0.4)',
        }}
      />

      {/* Stylo */}
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="absolute right-[25%] bottom-[20%] w-8 h-2 bg-gray-300 rounded-full"
        style={{ transform: 'rotate(-25deg)' }}
      />
    </div>
  )
}
