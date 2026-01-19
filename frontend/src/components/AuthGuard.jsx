import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApiService } from '@/services/api'

/**
 * Composant pour protéger les routes nécessitant une authentification
 * @param {React.ReactNode} children - Les composants à afficher si authentifié
 * @param {string[]} allowedRoles - Les rôles autorisés (optionnel)
 * @param {boolean} requireAuth - Si true, redirige vers login si non authentifié
 */
export default function AuthGuard({ children, allowedRoles = [], requireAuth = true }) {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRoles, setUserRoles] = useState([])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        
        if (!token && requireAuth) {
          navigate('/login')
          return
        }

        if (token) {
          try {
            const user = await authApiService.getCurrentUser()
            const roles = user.roles || []
            
            setUserRoles(roles)
            setIsAuthenticated(true)

            // Vérifier les rôles si spécifiés
            if (allowedRoles.length > 0) {
              const hasAllowedRole = roles.some(role => allowedRoles.includes(role))
              if (!hasAllowedRole) {
                // Rediriger selon le rôle de l'utilisateur
                if (roles.includes('ROLE_CANDIDAT')) {
                  navigate('/candidate/dashboard')
                } else if (roles.includes('ROLE_RECRUITER')) {
                  // Les recruteurs ont accès uniquement à la recherche
                  navigate('/company/search')
                } else if (roles.includes('ROLE_COMPANY_ADMIN')) {
                  navigate('/company/dashboard')
                } else if (roles.includes('ROLE_ADMIN') || roles.includes('ROLE_SUPER_ADMIN')) {
                  navigate('/admin/review/1')
                } else {
                  navigate('/')
                }
                return
              }
            }
          } catch (error) {
            // Token invalide ou expiré
            console.error('Erreur d\'authentification:', error)
            if (requireAuth) {
              authApiService.logout()
              navigate('/login')
              return
            }
          }
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'authentification:', error)
        if (requireAuth) {
          navigate('/login')
          return
        }
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [navigate, allowedRoles, requireAuth])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Vérification de l'authentification...</p>
        </div>
      </div>
    )
  }

  if (requireAuth && !isAuthenticated) {
    return null // Le useEffect redirigera vers /login
  }

  return <>{children}</>
}
