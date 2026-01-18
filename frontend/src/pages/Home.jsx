import { Link } from 'react-router-dom'
import { User, Building, Shield, Search, FileText, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useEffect, useState } from 'react'
import { authApiService } from '@/services/api'

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRoles, setUserRoles] = useState([])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        if (token) {
          const user = await authApiService.getCurrentUser()
          setUserRoles(user.roles || [])
          setIsAuthenticated(true)
        }
      } catch (error) {
        // Non authentifié
        setIsAuthenticated(false)
      }
    }
    checkAuth()
  }, [])

  const handleLogout = () => {
    authApiService.logout()
    setIsAuthenticated(false)
    setUserRoles([])
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold">Yemma Solutions</h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {isAuthenticated ? (
              <>
                {userRoles.includes('ROLE_CANDIDAT') && (
                  <Link to="/candidate/dashboard">
                    <Button variant="ghost">Mon Dashboard</Button>
                  </Link>
                )}
                {(userRoles.includes('ROLE_COMPANY_ADMIN') || userRoles.includes('ROLE_RECRUITER')) && (
                  <Link to="/company/management">
                    <Button variant="ghost">Mon Entreprise</Button>
                  </Link>
                )}
                {(userRoles.includes('ROLE_ADMIN') || userRoles.includes('ROLE_SUPER_ADMIN')) && (
                  <Link to="/admin/review/1">
                    <Button variant="ghost">Admin</Button>
                  </Link>
                )}
                <Button variant="outline" onClick={handleLogout}>
                  Déconnexion
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost">Connexion</Button>
                </Link>
                <Link to="/register/candidat">
                  <Button>Inscription</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-4xl font-bold mb-4">Plateforme de Recrutement Certifiée</h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Accédez à une CVthèque de profils préqualifiés par notre équipe RH. 
          Connectez des candidats validés avec des entreprises de confiance.
        </p>
        {!isAuthenticated && (
          <div className="flex gap-4 justify-center">
            <Link to="/register/candidat">
              <Button size="lg">
                Créer mon profil candidat
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/register/company">
              <Button size="lg" variant="outline">
                Inscription entreprise
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Candidat Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <User className="w-6 h-6 text-primary" />
                <CardTitle>Candidat</CardTitle>
              </div>
              <CardDescription>
                Créez votre profil professionnel validé par notre équipe RH
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>✓ Profil professionnel structuré</li>
                <li>✓ Validation humaine préalable</li>
                <li>✓ Visibilité auprès des recruteurs</li>
                <li>✓ Onboarding guidé étape par étape</li>
              </ul>
              <div className="pt-4">
                {isAuthenticated && userRoles.includes('ROLE_CANDIDAT') ? (
                  <Link to="/candidate/dashboard" className="block">
                    <Button className="w-full">Mon Dashboard</Button>
                  </Link>
                ) : (
                  <Link to="/register/candidat" className="block">
                    <Button variant="outline" className="w-full">
                      S'inscrire comme candidat
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Entreprise/Recruteur Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Building className="w-6 h-6 text-primary" />
                <CardTitle>Entreprise / Recruteur</CardTitle>
              </div>
              <CardDescription>
                Accédez à une CVthèque de profils validés et certifiés
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>✓ CVthèque de profils validés</li>
                <li>✓ Compte rendu d'entretien RH</li>
                <li>✓ Gestion d'équipe recruteurs</li>
                <li>✓ Recherche avancée par compétences</li>
              </ul>
              <div className="pt-4">
                {isAuthenticated && (userRoles.includes('ROLE_COMPANY_ADMIN') || userRoles.includes('ROLE_RECRUITER')) ? (
                  <Link to="/company/management" className="block">
                    <Button className="w-full">Mon Entreprise</Button>
                  </Link>
                ) : (
                  <Link to="/register/company" className="block">
                    <Button variant="outline" className="w-full">
                      Inscription entreprise
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Admin Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-6 h-6 text-primary" />
                <CardTitle>Administrateur</CardTitle>
              </div>
              <CardDescription>
                Validez les profils et gérez la plateforme
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>✓ Validation des profils candidats</li>
                <li>✓ Entretiens et évaluations</li>
                <li>✓ Gestion de la plateforme</li>
                <li>✓ Dashboard de contrôle</li>
              </ul>
              <div className="pt-4">
                {isAuthenticated && (userRoles.includes('ROLE_ADMIN') || userRoles.includes('ROLE_SUPER_ADMIN')) ? (
                  <Link to="/admin/review/1" className="block">
                    <Button className="w-full">Administration</Button>
                  </Link>
                ) : (
                  <Link to="/login" className="block">
                    <Button variant="outline" className="w-full" disabled>
                      Accès réservé
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* API Documentation Section */}
      <section className="container mx-auto px-4 py-12 border-t">
        <h3 className="text-2xl font-bold mb-4">Documentation API</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a 
            href="http://localhost:8001/docs" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Auth Service
          </a>
          <a 
            href="http://localhost:8002/docs" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Candidate Service
          </a>
          <a 
            href="http://localhost:8003/docs" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Document Service
          </a>
          <a 
            href="http://localhost:8004/docs" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Search Service
          </a>
        </div>
      </section>
    </div>
  )
}
