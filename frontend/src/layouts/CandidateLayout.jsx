import { Outlet } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

/**
 * Layout pour les pages candidat (espace candidat).
 * Navbar, contenu principal, footer. Charte visuelle et accessibilité.
 */
export default function CandidateLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 overflow-x-hidden">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-3 focus:py-2 focus:bg-[#226D68] focus:text-white focus:rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a5a55]"
      >
        Aller au contenu principal
      </a>
      <Navbar />
      <main id="main-content" className="flex-1 w-full min-w-0" role="main">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
