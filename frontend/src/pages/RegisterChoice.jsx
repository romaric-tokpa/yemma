import { Link } from 'react-router-dom'
import { User, Building, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function RegisterChoice() {
  return (
    <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-[#2C2C2C] mb-1">
            <span className="text-[#226D68]">Yemma</span>
            <span className="text-[#e76f51]">-Solutions</span>
          </h1>
          <p className="text-sm text-[#6b7280]">Choisissez votre profil pour commencer</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Link to="/register/candidat" className="block">
            <Card className="h-full border border-gray-200 shadow-sm rounded-xl overflow-hidden hover:shadow-md hover:border-[#226D68]/40 transition-all">
              <CardHeader className="p-4 pb-2">
                <div className="w-10 h-10 rounded-lg bg-[#E8F4F3] flex items-center justify-center mb-3">
                  <User className="w-5 h-5 text-[#226D68]" />
                </div>
                <CardTitle className="text-base font-bold text-[#2C2C2C]">Je suis candidat</CardTitle>
                <CardDescription className="text-xs text-[#6b7280]">
                  Créez votre profil validé et visible par les recruteurs
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <Button className="w-full h-9 bg-[#226D68] hover:bg-[#1a5a55] text-white text-sm font-semibold">
                  Créer mon profil
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </Link>
          <Link to="/register/company" className="block">
            <Card className="h-full border border-gray-200 shadow-sm rounded-xl overflow-hidden hover:shadow-md hover:border-[#e76f51]/40 transition-all">
              <CardHeader className="p-4 pb-2">
                <div className="w-10 h-10 rounded-lg bg-[#FDF2F0] flex items-center justify-center mb-3">
                  <Building className="w-5 h-5 text-[#e76f51]" />
                </div>
                <CardTitle className="text-base font-bold text-[#2C2C2C]">Je suis recruteur</CardTitle>
                <CardDescription className="text-xs text-[#6b7280]">
                  Accédez à la CVthèque de profils validés
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <Button className="w-full h-9 bg-[#e76f51] hover:bg-[#d45a3f] text-white text-sm font-semibold">
                  Créer mon compte entreprise
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>
        <p className="text-center mt-4 text-xs text-[#6b7280]">
          Vous avez déjà un compte ?{' '}
          <Link to="/login" className="text-[#226D68] font-medium hover:underline">Se connecter</Link>
        </p>
        <p className="text-center mt-2 text-[10px] text-[#6b7280]">
          <Link to="/" className="text-[#226D68] hover:underline">Retour à l&apos;accueil</Link>
        </p>
      </div>
    </div>
  )
}
