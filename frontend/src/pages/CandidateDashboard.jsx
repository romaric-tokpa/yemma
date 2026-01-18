import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  User, Edit, FileText, CheckCircle2, Clock, XCircle, 
  Briefcase, GraduationCap, Award, Code, MapPin, Star,
  Plus, Trash2, Eye, Mail, Phone, Calendar, LogOut,
  Home, Settings, Menu, X, TrendingUp, Users, FileCheck
} from 'lucide-react'
import { candidateApi, authApiService } from '../services/api'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Separator } from '../components/ui/separator'
import { ThemeToggle } from '../components/ui/theme-toggle'

// Générer un avatar par défaut basé sur les initiales
const generateAvatarUrl = (firstName, lastName) => {
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U'
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=200&background=random&color=fff&bold=true`
}

// Générer un avatar par défaut pour les logos d'entreprises
const generateCompanyLogoUrl = (companyName) => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName || 'Company')}&size=100&background=random&color=fff&bold=true`
}

export default function CandidateDashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [experiences, setExperiences] = useState([])
  const [educations, setEducations] = useState([])
  const [certifications, setCertifications] = useState([])
  const [skills, setSkills] = useState([])
  const [jobPreferences, setJobPreferences] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadProfile()
    // Définir l'onglet actif selon l'URL ou le hash
    const hash = location.hash.replace('#', '')
    if (hash) {
      setActiveTab(hash)
    }
  }, [location])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const profileData = await candidateApi.getMyProfile()
      setProfile(profileData)
      
      if (profileData.id) {
        try {
          const [exps, edus, certs, skls, prefs] = await Promise.all([
            candidateApi.getExperiences(profileData.id).catch(() => []),
            candidateApi.getEducations(profileData.id).catch(() => []),
            candidateApi.getCertifications(profileData.id).catch(() => []),
            candidateApi.getSkills(profileData.id).catch(() => []),
            candidateApi.getJobPreferences(profileData.id).catch(() => null),
          ])
          
          setExperiences(exps || [])
          setEducations(edus || [])
          setCertifications(certs || [])
          setSkills(skls || [])
          setJobPreferences(prefs)
        } catch (error) {
          console.error('Error loading relations:', error)
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      if (error.response?.status === 404) {
        navigate('/onboarding')
        return
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      authApiService.logout()
      navigate('/login')
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      DRAFT: { label: 'Brouillon', className: 'bg-gray-100 text-gray-800 border-gray-200' },
      SUBMITTED: { label: 'Soumis', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      IN_REVIEW: { label: 'En cours de validation', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      VALIDATED: { label: 'Validé', className: 'bg-green-100 text-green-800 border-green-200' },
      REJECTED: { label: 'Refusé', className: 'bg-red-100 text-red-800 border-red-200' },
      ARCHIVED: { label: 'Archivé', className: 'bg-gray-100 text-gray-800 border-gray-200' },
    }
    
    const config = statusConfig[status] || statusConfig.DRAFT
    
    return (
      <Badge className={`${config.className} border`}>
        {config.label}
      </Badge>
    )
  }

  const handleDeleteExperience = async (experienceId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette expérience ?')) return
    try {
      await candidateApi.deleteExperience(profile.id, experienceId)
      setExperiences(experiences.filter(exp => exp.id !== experienceId))
    } catch (error) {
      console.error('Error deleting experience:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const handleDeleteEducation = async (educationId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette formation ?')) return
    try {
      await candidateApi.deleteEducation(profile.id, educationId)
      setEducations(educations.filter(edu => edu.id !== educationId))
    } catch (error) {
      console.error('Error deleting education:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const handleDeleteCertification = async (certificationId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette certification ?')) return
    try {
      await candidateApi.deleteCertification(profile.id, certificationId)
      setCertifications(certifications.filter(cert => cert.id !== certificationId))
    } catch (error) {
      console.error('Error deleting certification:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const handleDeleteSkill = async (skillId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette compétence ?')) return
    try {
      await candidateApi.deleteSkill(profile.id, skillId)
      setSkills(skills.filter(skill => skill.id !== skillId))
    } catch (error) {
      console.error('Error deleting skill:', error)
      alert('Erreur lors de la suppression')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement de votre profil...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Profil non trouvé</p>
          <Button onClick={() => navigate('/onboarding')}>
            Créer mon profil
          </Button>
        </div>
      </div>
    )
  }

  const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Candidat'
  const completionPercentage = profile.completion_percentage || 0
  const defaultAvatar = generateAvatarUrl(profile.first_name, profile.last_name)
  const displayPhoto = profile.photo_url || defaultAvatar

  const sidebarItems = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: Home },
    { id: 'experiences', label: 'Expériences', icon: Briefcase, badge: experiences.length },
    { id: 'educations', label: 'Formations', icon: GraduationCap, badge: educations.length },
    { id: 'certifications', label: 'Certifications', icon: Award, badge: certifications.length },
    { id: 'skills', label: 'Compétences', icon: Code, badge: skills.length },
    { id: 'preferences', label: 'Préférences', icon: MapPin },
  ]

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`
        ${sidebarOpen ? 'w-64' : 'w-16'} 
        bg-card border-r 
        fixed left-0 top-0 h-screen z-30
        transition-all duration-300 ease-in-out
        flex flex-col
      `}>
        {/* Logo/Header Sidebar */}
        <div className="h-16 border-b flex items-center justify-between px-4">
          {sidebarOpen ? (
            <>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-lg">Yemma</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="h-8 w-8 p-0 mx-auto"
            >
              <Menu className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id)
                  navigate({ hash: `#${item.id}` })
                }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                  transition-colors duration-200
                  ${activeTab === item.id 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }
                `}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && (
                  <>
                    <span className="flex-1 text-left font-medium">{item.label}</span>
                    {item.badge !== undefined && (
                      <Badge variant="secondary" className="ml-auto">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </button>
            )
          })}
        </nav>

        {/* User section */}
        <div className="border-t p-4">
          {sidebarOpen ? (
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors">
              <img
                src={displayPhoto}
                alt={fullName}
                className="w-10 h-10 rounded-full object-cover border-2 border-primary/20"
                onError={(e) => {
                  if (e.target.src !== defaultAvatar) {
                    e.target.src = defaultAvatar
                  }
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{fullName}</p>
                <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <img
                src={displayPhoto}
                alt={fullName}
                className="w-10 h-10 rounded-full object-cover border-2 border-primary/20"
                onError={(e) => {
                  if (e.target.src !== defaultAvatar) {
                    e.target.src = defaultAvatar
                  }
                }}
              />
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-16'} transition-all duration-300`}>
        {/* Top Header */}
        <header className="h-16 border-b bg-card sticky top-0 z-20 shadow-sm">
          <div className="h-full px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold">Mon Espace Candidat</h1>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Statut et actions rapides */}
              <div className="hidden md:flex items-center gap-4">
                {getStatusBadge(profile.status)}
                {profile.status === 'DRAFT' && (
                  <Button 
                    size="sm" 
                    onClick={async () => {
                      try {
                        await candidateApi.submitProfile(profile.id)
                        alert('Profil soumis avec succès !')
                        loadProfile()
                      } catch (error) {
                        alert('Erreur lors de la soumission: ' + (error.response?.data?.detail || error.message))
                      }
                    }}
                  >
                    <FileCheck className="w-4 h-4 mr-2" />
                    Soumettre
                  </Button>
                )}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/onboarding')}
              >
                <Edit className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Modifier</span>
              </Button>
              
              {/* Theme Toggle */}
              <ThemeToggle />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Déconnexion</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-6 max-w-7xl mx-auto">
          {/* Statistiques en haut */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="border-l-4 border-l-blue-500 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Complétion</p>
                    <p className="text-2xl font-bold">{Math.round(completionPercentage)}%</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <Progress value={completionPercentage} className="mt-3 h-2" />
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Expériences</p>
                    <p className="text-2xl font-bold">{experiences.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Compétences</p>
                    <p className="text-2xl font-bold">{skills.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Code className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Note Admin</p>
                    <p className="text-2xl font-bold">
                      {profile.admin_score ? `${profile.admin_score.toFixed(1)}/5` : 'N/A'}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Star className="w-6 h-6 text-orange-600 fill-current" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contenu selon l'onglet actif */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Profil card */}
              <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl mb-2">{fullName}</CardTitle>
                      {profile.profile_title && (
                        <CardDescription className="text-base">{profile.profile_title}</CardDescription>
                      )}
                    </div>
                    <img
                      src={displayPhoto}
                      alt={fullName}
                      className="w-20 h-20 rounded-full object-cover border-4 border-background shadow-lg"
                      onError={(e) => {
                        if (e.target.src !== defaultAvatar) {
                          e.target.src = defaultAvatar
                        }
                      }}
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg mb-4">Informations personnelles</h3>
                      {profile.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{profile.email}</span>
                        </div>
                      )}
                      {profile.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{profile.phone}</span>
                        </div>
                      )}
                      {(profile.city || profile.country) && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">
                            {[profile.city, profile.country].filter(Boolean).join(', ')}
                          </span>
                        </div>
                      )}
                      {profile.total_experience !== undefined && (
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">
                            {profile.total_experience} an{profile.total_experience > 1 ? 's' : ''} d'expérience
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg mb-4">Statistiques</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Expériences</p>
                          <p className="text-2xl font-bold">{experiences.length}</p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Formations</p>
                          <p className="text-2xl font-bold">{educations.length}</p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Certifications</p>
                          <p className="text-2xl font-bold">{certifications.length}</p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Compétences</p>
                          <p className="text-2xl font-bold">{skills.length}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {profile.professional_summary && (
                    <div className="mt-6 pt-6 border-t">
                      <h3 className="font-semibold text-lg mb-3">Résumé professionnel</h3>
                      <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        {profile.professional_summary}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'experiences' && (
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Expériences professionnelles
                  </CardTitle>
                  <Button onClick={() => navigate('/onboarding')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {experiences.length > 0 ? (
                  <div className="space-y-4">
                    {experiences.map((exp) => {
                      const defaultCompanyLogo = generateCompanyLogoUrl(exp.company_name)
                      const displayCompanyLogo = exp.company_logo_url || defaultCompanyLogo
                      
                      return (
                        <div key={exp.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex gap-4 items-start">
                            <img
                              src={displayCompanyLogo}
                              alt={exp.company_name}
                              className="w-16 h-16 rounded-lg object-cover border-2 border-muted flex-shrink-0"
                              onError={(e) => {
                                if (e.target.src !== defaultCompanyLogo) {
                                  e.target.src = defaultCompanyLogo
                                }
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h4 className="font-semibold text-lg">{exp.position}</h4>
                                  <p className="text-muted-foreground">{exp.company_name}</p>
                                  {exp.company_sector && (
                                    <p className="text-sm text-muted-foreground">{exp.company_sector}</p>
                                  )}
                                  <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(exp.start_date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                                    {exp.end_date 
                                      ? ` - ${new Date(exp.end_date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`
                                      : exp.is_current ? ' - Actuellement' : ''}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteExperience(exp.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                              {exp.description && (
                                <div className="mt-2">
                                  <div 
                                    className="text-sm rich-text-content"
                                    dangerouslySetInnerHTML={{ __html: exp.description }}
                                  />
                                </div>
                              )}
                              {exp.achievements && (
                                <div className="mt-2">
                                  <p className="text-xs font-medium text-muted-foreground mb-1">Réalisations:</p>
                                  <div 
                                    className="text-sm rich-text-content"
                                    dangerouslySetInnerHTML={{ __html: exp.achievements }}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Briefcase className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">Aucune expérience enregistrée</p>
                    <Button className="mt-4" onClick={() => navigate('/onboarding')}>
                      Ajouter une expérience
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Les autres onglets (educations, certifications, skills, preferences) restent similaires */}
          {activeTab === 'educations' && (
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Formations & Diplômes
                  </CardTitle>
                  <Button onClick={() => navigate('/onboarding')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {educations.length > 0 ? (
                  <div className="space-y-4">
                    {educations.map((edu) => (
                      <div key={edu.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg">{edu.diploma}</h4>
                            <p className="text-muted-foreground">{edu.institution}</p>
                            {edu.country && (
                              <p className="text-sm text-muted-foreground">{edu.country}</p>
                            )}
                            <p className="text-sm text-muted-foreground mt-2">
                              {edu.start_year && `${edu.start_year} - `}{edu.graduation_year}
                              {edu.level && ` • ${edu.level}`}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteEducation(edu.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <GraduationCap className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">Aucune formation enregistrée</p>
                    <Button className="mt-4" onClick={() => navigate('/onboarding')}>
                      Ajouter une formation
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'certifications' && (
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Certifications
                  </CardTitle>
                  <Button onClick={() => navigate('/onboarding')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {certifications.length > 0 ? (
                  <div className="space-y-4">
                    {certifications.map((cert) => (
                      <div key={cert.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg">{cert.title}</h4>
                            <p className="text-muted-foreground">{cert.issuer}</p>
                            <p className="text-sm text-muted-foreground mt-2">
                              {cert.year}
                              {cert.expiration_date && ` • Expire le ${new Date(cert.expiration_date).toLocaleDateString('fr-FR')}`}
                            </p>
                            {cert.verification_url && (
                              <a href={cert.verification_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline mt-2 inline-block">
                                Lien de vérification
                              </a>
                            )}
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteCertification(cert.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Award className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">Aucune certification enregistrée</p>
                    <Button className="mt-4" onClick={() => navigate('/onboarding')}>
                      Ajouter une certification
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'skills' && (
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Compétences
                  </CardTitle>
                  <Button onClick={() => navigate('/onboarding')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {skills.length > 0 ? (
                  <div className="space-y-6">
                    {['TECHNICAL', 'SOFT', 'TOOL'].map((type) => {
                      const typeSkills = skills.filter(s => s.skill_type === type)
                      if (typeSkills.length === 0) return null
                      return (
                        <div key={type}>
                          <h4 className="font-semibold mb-3">
                            {type === 'TECHNICAL' ? 'Compétences techniques' : type === 'SOFT' ? 'Soft Skills' : 'Outils & Logiciels'}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {typeSkills.map((skill) => (
                              <div key={skill.id} className="flex items-center gap-2 bg-muted rounded-full px-4 py-2">
                                <span className="font-medium">{skill.name}</span>
                                {skill.level && <Badge variant="secondary">{skill.level}</Badge>}
                                {skill.years_of_practice && (
                                  <span className="text-sm text-muted-foreground">
                                    ({skill.years_of_practice} an{skill.years_of_practice > 1 ? 's' : ''})
                                  </span>
                                )}
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-2" onClick={() => handleDeleteSkill(skill.id)}>
                                  <Trash2 className="h-3 w-3 text-red-500" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Code className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">Aucune compétence enregistrée</p>
                    <Button className="mt-4" onClick={() => navigate('/onboarding')}>
                      Ajouter une compétence
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'preferences' && (
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50 border-b">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Préférences d'emploi
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {jobPreferences ? (
                  <div className="space-y-4">
                    {jobPreferences.desired_positions?.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Postes recherchés</p>
                        <div className="flex flex-wrap gap-2">
                          {jobPreferences.desired_positions.map((pos, idx) => (
                            <Badge key={idx} variant="secondary">{pos}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {jobPreferences.contract_type && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Type de contrat</p>
                        <p className="font-medium">{jobPreferences.contract_type}</p>
                      </div>
                    )}
                    {jobPreferences.target_sectors?.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Secteurs ciblés</p>
                        <div className="flex flex-wrap gap-2">
                          {jobPreferences.target_sectors.map((sector, idx) => (
                            <Badge key={idx} variant="secondary">{sector}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {jobPreferences.desired_location && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Localisation souhaitée</p>
                        <p className="font-medium">{jobPreferences.desired_location}</p>
                      </div>
                    )}
                    {jobPreferences.mobility && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Mobilité</p>
                        <p className="font-medium">{jobPreferences.mobility}</p>
                      </div>
                    )}
                    {jobPreferences.availability && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Disponibilité</p>
                        <p className="font-medium">{jobPreferences.availability}</p>
                      </div>
                    )}
                    {(jobPreferences.salary_min || jobPreferences.salary_max) && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Prétentions salariales</p>
                        <p className="font-medium">
                          {jobPreferences.salary_min && jobPreferences.salary_max
                            ? `${jobPreferences.salary_min.toLocaleString('fr-FR')} - ${jobPreferences.salary_max.toLocaleString('fr-FR')} CFA/mois`
                            : jobPreferences.salary_min
                            ? `${jobPreferences.salary_min.toLocaleString('fr-FR')} CFA/mois`
                            : `${jobPreferences.salary_max.toLocaleString('fr-FR')} CFA/mois`}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <MapPin className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">Aucune préférence enregistrée</p>
                    <Button className="mt-4" onClick={() => navigate('/onboarding')}>
                      Définir mes préférences
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  )
}
