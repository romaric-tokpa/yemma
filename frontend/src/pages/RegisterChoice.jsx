import { Link } from 'react-router-dom'
import { User, Building, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function RegisterChoice() {
  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 md:p-6" style={{ background: `linear-gradient(135deg, #0B3C5D 0%, #0B3C5Df2 50%, #226D68 100%)` }}>
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8 sm:mb-10 md:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4 font-heading px-4">
            Bienvenue sur Yemma Solutions
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-white/90 max-w-2xl mx-auto px-4">
            Choisissez votre profil pour commencer
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6 px-4 sm:px-0">
          {/* Candidat */}
          <Link to="/register/candidat" className="block h-full">
            <Card className="bg-white border-2 border-transparent transition-all duration-300 hover:shadow-xl h-full transform hover:-translate-y-1" onMouseEnter={(e) => e.currentTarget.style.borderColor = '#226D68'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}>
              <CardHeader className="text-center p-4 sm:p-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4" style={{ backgroundColor: '#226D6819' }}>
                  <User className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: '#226D68' }} />
                </div>
                <CardTitle className="text-xl sm:text-2xl font-bold text-blue-deep font-heading">
                  Je suis candidat
                </CardTitle>
                <CardDescription className="text-sm sm:text-base mt-2">
                  Créez votre profil validé et visible par les recruteurs
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <Button className="w-full text-white h-11 sm:h-12 text-sm sm:text-base font-semibold transition-all duration-200 shadow-md hover:shadow-lg" style={{ backgroundColor: '#226D68' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1a5a55' }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#226D68' }}>
                  Créer mon profil
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          {/* Recruteur */}
          <Link to="/register/company" className="block h-full">
            <Card className="bg-white border-2 border-transparent hover:border-blue-deep transition-all duration-300 hover:shadow-xl h-full transform hover:-translate-y-1">
              <CardHeader className="text-center p-4 sm:p-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-deep/10 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Building className="w-6 h-6 sm:w-8 sm:h-8 text-blue-deep" />
                </div>
                <CardTitle className="text-xl sm:text-2xl font-bold text-blue-deep font-heading">
                  Je suis recruteur
                </CardTitle>
                <CardDescription className="text-sm sm:text-base mt-2">
                  Accédez à la CVthèque de profils validés
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <Button className="w-full bg-blue-deep hover:bg-blue-deep/90 text-white h-11 sm:h-12 text-sm sm:text-base font-semibold transition-all duration-200 shadow-md hover:shadow-lg">
                  Créer mon compte entreprise
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="text-center mt-6 sm:mt-8 px-4">
          <p className="text-white/80 text-xs sm:text-sm">
            Vous avez déjà un compte ?{' '}
            <Link to="/login" className="text-white font-semibold hover:underline transition-colors">
              Connectez-vous
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
