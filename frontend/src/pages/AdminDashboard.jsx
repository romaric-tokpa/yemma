import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { candidateApi, authApiService } from '@/services/api'
import { 
  Users, FileCheck, Clock, CheckCircle, XCircle, Archive, 
  AlertCircle, Loader2, Eye, User, LogOut
} from 'lucide-react'

// Générer un avatar par défaut basé sur les initiales
const generateAvatarUrl = (firstName, lastName) => {
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U'
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=200&background=random&color=fff&bold=true`
}

const STATUS_COLORS = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SUBMITTED: 'bg-blue-100 text-blue-800',
  IN_REVIEW: 'bg-yellow-100 text-yellow-800',
  VALIDATED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  ARCHIVED: 'bg-gray-100 text-gray-800',
}

const STATUS_LABELS = {
  DRAFT: 'Brouillon',
  SUBMITTED: 'Soumis',
  IN_REVIEW: 'En cours de validation',
  VALIDATED: 'Validé',
  REJECTED: 'Rejeté',
  ARCHIVED: 'Archivé',
}

const STATUS_ICONS = {
  DRAFT: FileCheck,
  SUBMITTED: Clock,
  IN_REVIEW: AlertCircle,
  VALIDATED: CheckCircle,
  REJECTED: XCircle,
  ARCHIVED: Archive,
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedStatus, setSelectedStatus] = useState('SUBMITTED')
  const [stats, setStats] = useState({
    DRAFT: 0,
    SUBMITTED: 0,
    IN_REVIEW: 0,
    VALIDATED: 0,
    REJECTED: 0,
    ARCHIVED: 0,
  })

  // Fonction pour charger les statistiques
  const loadStats = async () => {
    try {
      // Essayer d'utiliser l'endpoint stats si disponible
      const statsData = await candidateApi.getProfileStats()
      if (statsData) {
        setStats(statsData)
        return
      }

      // Sinon, calculer côté client en appelant listProfiles pour chaque statut
      const statuses = ['DRAFT', 'SUBMITTED', 'IN_REVIEW', 'VALIDATED', 'REJECTED', 'ARCHIVED']
      const statsPromises = statuses.map(async (status) => {
        try {
          const response = await candidateApi.listProfiles(status, 1, 1)
          // Si response.items existe, utiliser response.items.length
          // Sinon, si response est un array, utiliser response.length
          // Sinon, essayer de compter les items dans la réponse
          if (response && typeof response === 'object') {
            if (Array.isArray(response)) {
              return { status, count: response.length }
            } else if (response.items && Array.isArray(response.items)) {
              // Si la réponse a une structure paginée
              return { status, count: response.total || response.items.length }
            } else if (response.total !== undefined) {
              return { status, count: response.total }
            }
          }
          return { status, count: 0 }
        } catch (err) {
          console.error(`Erreur lors du chargement des stats pour ${status}:`, err)
          return { status, count: 0 }
        }
      })
      
      const statsResults = await Promise.all(statsPromises)
      const newStats = {}
      statsResults.forEach(({ status, count }) => {
        newStats[status] = count
      })
      setStats(newStats)
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err)
    }
  }

  // Fonction pour charger les profils
  const loadProfiles = async (status = 'SUBMITTED') => {
    try {
      setLoading(true)
      setError(null)
      
      // Récupérer les profils filtrés par statut
      const response = await candidateApi.listProfiles(status, 1, 100)
      
      // Gérer différents formats de réponse
      let profilesData = []
      if (Array.isArray(response)) {
        profilesData = response
      } else if (response && response.items && Array.isArray(response.items)) {
        profilesData = response.items
      } else if (response && response.data && Array.isArray(response.data)) {
        profilesData = response.data
      }
      
      // Trier par date de soumission (les plus récents en premier)
      profilesData.sort((a, b) => {
        const dateA = a.submitted_at ? new Date(a.submitted_at).getTime() : 0
        const dateB = b.submitted_at ? new Date(b.submitted_at).getTime() : 0
        return dateB - dateA // Tri décroissant (plus récent en premier)
      })
      
      setProfiles(profilesData)
      
    } catch (err) {
      console.error('Erreur lors du chargement des profils:', err)
      // Si l'endpoint n'existe pas encore, on affiche un message approprié
      if (err.response?.status === 404 || err.response?.status === 501) {
        setError('L\'endpoint pour lister les profils n\'est pas encore disponible. Veuillez accéder directement aux profils via leur ID.')
        setProfiles([])
      } else {
        setError(err.response?.data?.detail || err.message || 'Erreur lors du chargement des profils')
      }
    } finally {
      setLoading(false)
    }
  }

  // Charger les stats au montage du composant
  useEffect(() => {
    loadStats()
  }, [])

  useEffect(() => {
    loadProfiles(selectedStatus)
  }, [selectedStatus])

  const handleViewProfile = (profileId) => {
    navigate(`/admin/review/${profileId}`)
  }

  const handleLogout = () => {
    if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      authApiService.logout()
      navigate('/login')
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-7xl">
        {/* En-tête */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Tableau de bord Administrateur</h1>
            <p className="text-muted-foreground">
              Gérez la validation des profils candidats
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </Button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {Object.entries(stats).map(([status, count]) => {
            const Icon = STATUS_ICONS[status] || Users
            return (
              <Card key={status}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {STATUS_LABELS[status]}
                    </CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{count}</div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Filtres */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtres</CardTitle>
            <CardDescription>Sélectionnez un statut pour filtrer les profils</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.keys(STATUS_LABELS).map((status) => (
                <Button
                  key={status}
                  variant={selectedStatus === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedStatus(status)}
                >
                  {STATUS_LABELS[status]}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Liste des profils */}
        <Card>
          <CardHeader>
            <CardTitle>Profils {STATUS_LABELS[selectedStatus]}</CardTitle>
            <CardDescription>
              {loading ? 'Chargement...' : `${profiles.length} profil(s) trouvé(s)`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                <p className="text-lg font-semibold mb-2">Erreur</p>
                <p className="text-muted-foreground">{error}</p>
                <Button onClick={() => loadProfiles(selectedStatus)} className="mt-4">
                  Réessayer
                </Button>
              </div>
            ) : profiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <User className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-semibold mb-2">Aucun profil trouvé</p>
                <p className="text-muted-foreground">
                  Aucun profil avec le statut "{STATUS_LABELS[selectedStatus]}" n'est disponible.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Pour tester la validation d'un profil, vous pouvez accéder directement à la page de review
                  en utilisant l'ID d'un profil existant.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {profiles.map((profile) => {
                  // Générer l'avatar par défaut si pas de photo
                  const defaultAvatar = generateAvatarUrl(profile.first_name, profile.last_name)
                  const displayPhoto = profile.photo_url || defaultAvatar
                  
                  return (
                    <Card key={profile.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          {/* Photo de profil */}
                          <div className="flex-shrink-0">
                            <img
                              src={displayPhoto}
                              alt={`${profile.first_name} ${profile.last_name}`}
                              className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
                              onError={(e) => {
                                // Si l'image échoue, utiliser l'avatar par défaut
                                if (e.target.src !== defaultAvatar) {
                                  e.target.src = defaultAvatar
                                }
                              }}
                            />
                          </div>
                          
                          {/* Informations du profil */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold">
                                {profile.first_name} {profile.last_name}
                              </h3>
                              <Badge className={STATUS_COLORS[profile.status]}>
                                {STATUS_LABELS[profile.status]}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {profile.email}
                            </p>
                            {profile.profile_title && (
                              <p className="text-sm mb-2">{profile.profile_title}</p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Complétion: {profile.completion_percentage?.toFixed(1) || 0}%</span>
                              {profile.submitted_at && (
                                <span>
                                  Soumis le: {new Date(profile.submitted_at).toLocaleDateString('fr-FR')}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewProfile(profile.id)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Examiner
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}