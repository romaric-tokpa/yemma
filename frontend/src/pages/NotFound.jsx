import { useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Home, ArrowLeft, Search, User, Building } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function NotFound() {
  const navigate = useNavigate()

  useEffect(() => {
    // Rediriger automatiquement après 5 secondes
    const timer = setTimeout(() => {
      navigate('/')
    }, 5000)

    return () => clearTimeout(timer)
  }, [navigate])

  const primaryColor = '#226D68'
  const secondaryColor = '#e76f51'

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-dots">
      <div className="max-w-2xl w-full text-center">
        {/* Illustration 404 */}
        <div className="mb-8">
          <div className="text-9xl font-bold mb-4" style={{ color: primaryColor, opacity: 0.2 }}>
            404
          </div>
          <div className="w-32 h-32 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20` }}>
            <Search className="w-16 h-16" style={{ color: primaryColor }} />
          </div>
        </div>

        {/* Message principal */}
        <Card className="mb-8 shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
              Page introuvable
            </CardTitle>
            <CardDescription className="text-base">
              La page que vous recherchez n'existe pas ou a été déplacée.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-6">
              Vous serez redirigé automatiquement vers la page d'accueil dans quelques secondes.
            </p>
            
            {/* Actions rapides */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => navigate('/')}
                className="text-white"
                style={{ backgroundColor: primaryColor }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1a5a55' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = primaryColor }}
              >
                <Home className="w-4 h-4 mr-2" />
                Retour à l'accueil
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                style={{ borderColor: primaryColor, color: primaryColor }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#E8F4F3' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Page précédente
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Liens utiles */}
        <Card className="shadow-md border-0">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Liens utiles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link
                to="/login"
                className="flex flex-col items-center p-4 rounded-lg border-2 border-transparent hover:border-gray-300 transition-all"
                style={{ '--hover-color': primaryColor }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = primaryColor }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'transparent' }}
              >
                <User className="w-6 h-6 mb-2" style={{ color: primaryColor }} />
                <span className="text-sm font-medium text-gray-700">Connexion</span>
              </Link>
              <Link
                to="/register/choice"
                className="flex flex-col items-center p-4 rounded-lg border-2 border-transparent hover:border-gray-300 transition-all"
                style={{ '--hover-color': primaryColor }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = primaryColor }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'transparent' }}
              >
                <Building className="w-6 h-6 mb-2" style={{ color: secondaryColor }} />
                <span className="text-sm font-medium text-gray-700">Inscription</span>
              </Link>
              <Link
                to="/"
                className="flex flex-col items-center p-4 rounded-lg border-2 border-transparent hover:border-gray-300 transition-all"
                style={{ '--hover-color': primaryColor }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = primaryColor }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'transparent' }}
              >
                <Home className="w-6 h-6 mb-2" style={{ color: primaryColor }} />
                <span className="text-sm font-medium text-gray-700">Accueil</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
