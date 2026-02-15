import { Outlet } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

/**
 * Layout pour les pages entreprise/recruteur
 * Inclut la navbar et le footer
 */
export default function CompanyLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 overflow-x-hidden w-full max-w-[100vw]">
      <Navbar />
      <main className="flex-1 w-full min-w-0">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
