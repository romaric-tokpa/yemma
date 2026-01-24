import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { authApiService } from '@/services/api'
import { getDefaultRouteForRole } from '@/constants/routes'

/**
 * Composant pour protéger les routes nécessitant une authentification
 * @param {React.ReactNode} children - Les composants à afficher si authentifié
 * @param {string[]} allowedRoles - Les rôles autorisés (optionnel)
 * @param {boolean} requireAuth - Si true, redirige vers login si non authentifié
 */
export default function AuthGuard({ children, allowedRoles = [], requireAuth = true }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRoles, setUserRoles] = useState([])

  // Mémoriser allowedRoles pour éviter les problèmes de comparaison de référence
  const memoizedAllowedRoles = useMemo(() => {
    return Array.isArray(allowedRoles) ? allowedRoles : []
  }, [JSON.stringify(allowedRoles)])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        
        if (!token && requireAuth) {
          console.log('AuthGuard: No token found, redirecting to login')
          // Sauvegarder l'URL actuelle pour redirection après connexion
          navigate('/login', { state: { from: location.pathname } })
          return
        }

        if (token) {
          try {
            console.log('AuthGuard: Token found, verifying with backend...')
            const user = await authApiService.getCurrentUser()
            const roles = user.roles || []
            
            console.log('AuthGuard: User authenticated successfully:', user.email, 'Roles:', roles)
            setUserRoles(roles)
            setIsAuthenticated(true)

            // Vérifier les rôles si spécifiés
            if (memoizedAllowedRoles.length > 0) {
              const hasAllowedRole = roles.some(role => memoizedAllowedRoles.includes(role))
              if (!hasAllowedRole) {
                // Rediriger vers le dashboard approprié selon le rôle
                const redirectPath = getDefaultRouteForRole(roles)
                console.log(`AuthGuard: User doesn't have required role. Redirecting to: ${redirectPath}`)
                navigate(redirectPath, { replace: true })
                return
              }
            }
          } catch (error) {
            // Token invalide ou expiré
            console.error('AuthGuard: Erreur d\'authentification:', error)
            if (requireAuth) {
              console.log('AuthGuard: Logging out and redirecting to login')
              authApiService.logout()
              navigate('/login', { state: { from: location.pathname } })
              return
            }
          }
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'authentification:', error)
        if (requireAuth) {
          navigate('/login', { state: { from: location.pathname } })
          return
        }
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [navigate, requireAuth, location.pathname])


  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#226D68] mx-auto mb-4"></div>
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
