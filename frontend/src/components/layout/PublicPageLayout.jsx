import { motion } from 'framer-motion'
import PublicNavbar from '@/components/layout/PublicNavbar'
import PublicFooter from '@/components/layout/PublicFooter'

/**
 * Layout compact pour les pages publiques secondaires (Contact, Légal)
 * Navbar et footer uniformes avec la landing
 */
export default function PublicPageLayout({ children, title, subtitle, badge, heroImage }) {
  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col overflow-x-hidden w-full max-w-[100vw] min-w-0">
      <PublicNavbar variant="light" />

      {/* Hero compact avec animations */}
      {(title || subtitle || badge) && (
        <section className="pt-16 md:pt-20 pb-8 md:pb-12 bg-[#F4F6F8] overflow-hidden">
          <div className="max-w-6xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 lg:gap-12">
              <div className="flex-1 text-center lg:text-left">
                {badge && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E8F4F3] text-[#226D68] text-xs font-semibold mb-4"
                  >
                    {badge}
                  </motion.div>
                )}
                {title && (
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#2C2C2C] mb-3 font-heading"
                  >
                    {title}
                  </motion.h1>
                )}
                {subtitle && (
                  <motion.p
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-base text-[#6b7280] max-w-xl mx-auto lg:mx-0"
                  >
                    {subtitle}
                  </motion.p>
                )}
              </div>
              {heroImage && (
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="hidden lg:block flex-shrink-0"
                >
                  {heroImage}
                </motion.div>
              )}
            </div>
          </div>
        </section>
      )}

      <main className="flex-1 w-full min-w-0">
        {children}
      </main>

      <PublicFooter />
    </div>
  )
}
