import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, Download, FileText, User, Briefcase, MapPin, Star, CheckCircle2, 
  Mail, Phone, Calendar, Globe, Award, GraduationCap, Target, TrendingUp, Sparkles,
  Eye, Code, Users, Wrench, BarChart3, Building2, Clock
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { generateAvatarFromFullName } from '@/utils/photoUtils'

// Données mockées détaillées pour la démo
const MOCK_CANDIDATE_DETAILS = {
  1: {
    candidate_id: 1,
    full_name: 'Sophie Martin',
    first_name: 'Sophie',
    last_name: 'Martin',
    title: 'Développeuse Full-Stack Senior',
    main_job: 'Développeuse Full-Stack',
    email: 'sophie.martin@example.com',
    phone: '+33 6 12 34 56 78',
    location: 'Paris, France',
    city: 'Paris',
    country: 'France',
    years_of_experience: 8,
    total_experience: 8,
    availability: 'Immédiate',
    admin_score: 4.8,
    is_verified: true,
    sector: 'Technologie & Informatique',
    summary: 'Développeuse Full-Stack avec 8 ans d\'expérience en développement web. Expertise en React, Node.js, Python et architecture microservices. Passionnée par les technologies modernes et les bonnes pratiques de développement.',
    professional_summary: 'Développeuse Full-Stack avec 8 ans d\'expérience en développement web. Expertise en React, Node.js, Python et architecture microservices. Passionnée par les technologies modernes et les bonnes pratiques de développement.',
    skills: [
      { name: 'React', level: 'EXPERT', skill_type: 'TECHNICAL' },
      { name: 'Node.js', level: 'ADVANCED', skill_type: 'TECHNICAL' },
      { name: 'Python', level: 'ADVANCED', skill_type: 'TECHNICAL' },
      { name: 'TypeScript', level: 'ADVANCED', skill_type: 'TECHNICAL' },
      { name: 'Docker', level: 'INTERMEDIATE', skill_type: 'TECHNICAL' },
      { name: 'Communication', skill_type: 'SOFT' },
      { name: 'Leadership', skill_type: 'SOFT' }
    ],
    experiences: [
      {
        id: 1,
        company_name: 'TechCorp',
        position: 'Développeuse Full-Stack Senior',
        start_date: '2020-01-01',
        end_date: null,
        is_current: true,
        description: 'Développement d\'applications web modernes avec React et Node.js. Gestion d\'équipe de 5 développeurs.',
        sector: 'Technologie'
      },
      {
        id: 2,
        company_name: 'StartupXYZ',
        position: 'Développeuse Frontend',
        start_date: '2017-06-01',
        end_date: '2019-12-31',
        is_current: false,
        description: 'Développement d\'interfaces utilisateur avec React et Redux.',
        sector: 'Technologie'
      }
    ],
    educations: [
      {
        id: 1,
        diploma: 'Master Informatique',
        institution: 'Université Paris-Saclay',
        graduation_year: 2016,
        level: 'Bac+5'
      }
    ],
    certifications: [
      {
        id: 1,
        name: 'AWS Certified Solutions Architect',
        issuer: 'Amazon Web Services',
        year: 2022
      }
    ],
    admin_report: {
      overall_score: 4.8,
      technical_skills_rating: 5.0,
      soft_skills_rating: 4.5,
      communication_rating: 4.8,
      motivation_rating: 4.9,
      summary: 'Candidat exceptionnel avec une expertise technique solide et d\'excellentes compétences en communication. Très motivé et aligné avec les valeurs de l\'entreprise.',
      strengths: [
        'Expertise technique approfondie',
        'Excellente capacité de leadership',
        'Communication claire et efficace'
      ],
      recommendations: [
        'Idéal pour des postes de lead developer',
        'Peut gérer des projets complexes',
        'Excellent mentor pour les juniors'
      ]
    },
    photo_url: null
  },
  2: {
    candidate_id: 2,
    full_name: 'Jean Dupont',
    first_name: 'Jean',
    last_name: 'Dupont',
    title: 'Ingénieur DevOps',
    main_job: 'Ingénieur DevOps',
    email: 'jean.dupont@example.com',
    phone: '+33 6 23 45 67 89',
    location: 'Lyon, France',
    city: 'Lyon',
    country: 'France',
    years_of_experience: 6,
    total_experience: 6,
    availability: 'Dans 1 mois',
    admin_score: 4.5,
    is_verified: true,
    sector: 'Technologie & Informatique',
    summary: 'Ingénieur DevOps avec 6 ans d\'expérience en automatisation, CI/CD et cloud computing. Expert en Kubernetes, AWS et Terraform.',
    professional_summary: 'Ingénieur DevOps avec 6 ans d\'expérience en automatisation, CI/CD et cloud computing. Expert en Kubernetes, AWS et Terraform. Passionné par l\'infrastructure as code et l\'optimisation des performances.',
    skills: [
      { name: 'Kubernetes', level: 'EXPERT', skill_type: 'TECHNICAL' },
      { name: 'AWS', level: 'ADVANCED', skill_type: 'TECHNICAL' },
      { name: 'Terraform', level: 'ADVANCED', skill_type: 'TECHNICAL' },
      { name: 'Docker', level: 'EXPERT', skill_type: 'TECHNICAL' },
      { name: 'Jenkins', level: 'ADVANCED', skill_type: 'TECHNICAL' },
      { name: 'Rigueur', skill_type: 'SOFT' },
      { name: 'Autonomie', skill_type: 'SOFT' }
    ],
    experiences: [
      {
        id: 1,
        company_name: 'CloudTech',
        position: 'Ingénieur DevOps Senior',
        start_date: '2021-03-01',
        end_date: null,
        is_current: true,
        description: 'Gestion de l\'infrastructure cloud sur AWS. Automatisation des déploiements avec Kubernetes.',
        sector: 'Technologie'
      }
    ],
    educations: [
      {
        id: 1,
        diploma: 'Master Cloud Computing',
        institution: 'École Polytechnique',
        graduation_year: 2018,
        level: 'Bac+5'
      }
    ],
    certifications: [
      {
        id: 1,
        name: 'Kubernetes Administrator',
        issuer: 'CNCF',
        year: 2023
      }
    ],
    admin_report: {
      overall_score: 4.5,
      technical_skills_rating: 4.8,
      soft_skills_rating: 4.2,
      communication_rating: 4.3,
      motivation_rating: 4.7,
      summary: 'Excellent ingénieur DevOps avec une solide expertise technique. Très autonome et rigoureux.',
      strengths: [
        'Expertise cloud approfondie',
        'Excellente maîtrise de Kubernetes',
        'Autonomie et proactivité'
      ],
      recommendations: [
        'Idéal pour des projets cloud complexes',
        'Peut former les équipes sur DevOps',
        'Excellent pour l\'optimisation des coûts'
      ]
    },
    photo_url: null
  },
  3: {
    candidate_id: 3,
    full_name: 'Marie Leclerc',
    first_name: 'Marie',
    last_name: 'Leclerc',
    title: 'Product Manager',
    main_job: 'Product Manager',
    email: 'marie.leclerc@example.com',
    phone: '+33 6 34 56 78 90',
    location: 'Toulouse, France',
    city: 'Toulouse',
    country: 'France',
    years_of_experience: 7,
    total_experience: 7,
    availability: 'Immédiate',
    admin_score: 4.7,
    is_verified: true,
    sector: 'Technologie & Informatique',
    summary: 'Product Manager avec 7 ans d\'expérience dans la gestion de produits digitaux.',
    professional_summary: 'Product Manager avec 7 ans d\'expérience dans la gestion de produits digitaux. Expertise en stratégie produit, analyse de données et gestion d\'équipes cross-fonctionnelles. Passionnée par l\'innovation et l\'expérience utilisateur.',
    skills: [
      { name: 'Product Strategy', level: 'EXPERT', skill_type: 'TECHNICAL' },
      { name: 'Agile', level: 'ADVANCED', skill_type: 'TECHNICAL' },
      { name: 'Data Analysis', level: 'ADVANCED', skill_type: 'TECHNICAL' },
      { name: 'Communication', skill_type: 'SOFT' },
      { name: 'Leadership', skill_type: 'SOFT' }
    ],
    experiences: [
      {
        id: 1,
        company_name: 'DigitalCorp',
        position: 'Product Manager Senior',
        start_date: '2019-01-01',
        end_date: null,
        is_current: true,
        description: 'Gestion de produits digitaux avec focus sur l\'expérience utilisateur et la croissance.',
        sector: 'Technologie'
      }
    ],
    educations: [
      {
        id: 1,
        diploma: 'MBA Management',
        institution: 'HEC Paris',
        graduation_year: 2017,
        level: 'Bac+5'
      }
    ],
    certifications: [],
    admin_report: {
      overall_score: 4.7,
      technical_skills_rating: 4.5,
      soft_skills_rating: 4.9,
      communication_rating: 4.8,
      motivation_rating: 4.6,
      summary: 'Excellente Product Manager avec une vision stratégique claire et d\'excellentes compétences en communication.',
      strengths: [
        'Vision produit exceptionnelle',
        'Excellente communication',
        'Leadership naturel'
      ],
      recommendations: [
        'Idéal pour des produits innovants',
        'Peut gérer des équipes cross-fonctionnelles',
        'Excellent pour la stratégie produit'
      ]
    },
    photo_url: null
  }
}

// Générer des données par défaut si le candidat n'existe pas
const getDefaultCandidate = (id) => ({
  candidate_id: id,
  full_name: `Candidat ${id}`,
  first_name: 'Candidat',
  last_name: `${id}`,
  title: 'Développeur',
  main_job: 'Développeur',
  email: `candidat${id}@example.com`,
  phone: '+33 6 00 00 00 00',
  location: 'Paris, France',
  city: 'Paris',
  country: 'France',
  years_of_experience: 5,
  total_experience: 5,
  availability: 'Immédiate',
  admin_score: 4.0,
  is_verified: true,
  sector: 'Technologie & Informatique',
  summary: 'Profil de candidat avec une solide expérience.',
  professional_summary: 'Profil de candidat avec une solide expérience.',
  skills: [
    { name: 'JavaScript', level: 'ADVANCED', skill_type: 'TECHNICAL' },
    { name: 'React', level: 'ADVANCED', skill_type: 'TECHNICAL' }
  ],
  experiences: [],
  educations: [],
  certifications: [],
  admin_report: null,
  photo_url: null
})

export default function DemoCandidateDetail() {
  const { candidateId } = useParams()
  const navigate = useNavigate()
  const [candidate, setCandidate] = useState(null)

  useEffect(() => {
    const id = parseInt(candidateId, 10)
    const candidateData = MOCK_CANDIDATE_DETAILS[id] || getDefaultCandidate(id)
    setCandidate(candidateData)
  }, [candidateId])

  if (!candidate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#226D68] mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    )
  }

  const primaryColor = '#226D68'
  const secondaryColor = '#e76f51'
  const primaryLight = '#E8F4F3'
  const defaultAvatarUrl = generateAvatarFromFullName(candidate.full_name)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec badge démo */}
      <div className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/demo/cvtheque')}
                className="text-gray-700"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à la CVthèque
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  <span style={{ color: primaryColor }}>Yemma</span>
                  <span style={{ color: secondaryColor }}>-Solutions</span>
                </h1>
                <p className="text-xs text-gray-500">Version Démo</p>
              </div>
            </div>
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1">
              <Sparkles className="h-3 w-3 mr-1" />
              Mode Démo
            </Badge>
          </div>
        </div>
      </div>

      {/* Header du profil */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Photo */}
            <div className="relative">
              <img
                src={defaultAvatarUrl}
                alt={candidate.full_name}
                className="w-24 h-24 rounded-full object-cover border-4 border-white/30 shadow-xl"
              />
              {candidate.is_verified && (
                <div className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow-lg">
                  <CheckCircle2 className="h-5 w-5" style={{ color: primaryColor }} />
                </div>
              )}
              {candidate.admin_score && (
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-[#e76f51] to-[#d45a3f] text-white rounded-full px-3 py-1 shadow-xl flex items-center gap-1 border-2 border-white">
                  <Star className="h-3 w-3 fill-current" />
                  <span className="text-xs font-bold">{candidate.admin_score.toFixed(1)}/5</span>
                </div>
              )}
            </div>

            {/* Informations principales */}
            <div className="flex-1 text-white min-w-0">
              <h2 className="text-3xl font-bold mb-2">{candidate.full_name}</h2>
              {candidate.title && (
                <p className="text-lg text-white/90 mb-4">{candidate.title}</p>
              )}
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">
                {candidate.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{candidate.location}</span>
                  </div>
                )}
                {candidate.years_of_experience && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    <span>{candidate.years_of_experience} ans d'expérience</span>
                  </div>
                )}
                {candidate.availability && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{candidate.availability}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Résumé professionnel */}
            {candidate.professional_summary && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" style={{ color: primaryColor }} />
                    Résumé professionnel
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{candidate.professional_summary}</p>
                </CardContent>
              </Card>
            )}

            {/* Expériences */}
            {candidate.experiences && candidate.experiences.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" style={{ color: primaryColor }} />
                    Expériences professionnelles
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {candidate.experiences.map((exp, idx) => (
                    <div key={idx} className="border-l-2 pl-4" style={{ borderColor: primaryColor }}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900">{exp.position}</h4>
                          <p className="text-sm text-gray-600">{exp.company_name}</p>
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(exp.start_date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })} - 
                          {exp.is_current ? ' En cours' : ` ${new Date(exp.end_date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}`}
                        </div>
                      </div>
                      {exp.description && (
                        <p className="text-sm text-gray-700 mt-2">{exp.description}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Formations */}
            {candidate.educations && candidate.educations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" style={{ color: primaryColor }} />
                    Formations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {candidate.educations.map((edu, idx) => (
                    <div key={idx} className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">{edu.diploma}</h4>
                        <p className="text-sm text-gray-600">{edu.institution}</p>
                      </div>
                      <div className="text-sm text-gray-500">
                        {edu.graduation_year} • {edu.level}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Certifications */}
            {candidate.certifications && candidate.certifications.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" style={{ color: primaryColor }} />
                    Certifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {candidate.certifications.map((cert, idx) => (
                    <div key={idx} className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">{cert.name}</h4>
                        <p className="text-sm text-gray-600">{cert.issuer}</p>
                      </div>
                      <div className="text-sm text-gray-500">{cert.year}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Compétences */}
            {candidate.skills && candidate.skills.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" style={{ color: primaryColor }} />
                    Compétences
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="technical" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="technical">Techniques</TabsTrigger>
                      <TabsTrigger value="soft">Soft Skills</TabsTrigger>
                    </TabsList>
                    <TabsContent value="technical" className="mt-4">
                      <div className="flex flex-wrap gap-2">
                        {candidate.skills
                          .filter(s => s.skill_type === 'TECHNICAL')
                          .map((skill, idx) => (
                            <Badge 
                              key={idx}
                              className="text-sm px-3 py-1"
                              style={{ 
                                backgroundColor: primaryLight, 
                                color: primaryColor,
                                border: `1px solid ${primaryColor}40`
                              }}
                            >
                              {skill.name}
                              {skill.level && (
                                <span className="ml-2 text-xs opacity-75">({skill.level})</span>
                              )}
                            </Badge>
                          ))}
                      </div>
                    </TabsContent>
                    <TabsContent value="soft" className="mt-4">
                      <div className="flex flex-wrap gap-2">
                        {candidate.skills
                          .filter(s => s.skill_type === 'SOFT')
                          .map((skill, idx) => (
                            <Badge 
                              key={idx}
                              className="text-sm px-3 py-1"
                              style={{ 
                                backgroundColor: '#FDF2F0', 
                                color: secondaryColor,
                                border: `1px solid ${secondaryColor}40`
                              }}
                            >
                              {skill.name}
                            </Badge>
                          ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Colonne latérale */}
          <div className="space-y-6">
            {/* Avis de l'expert */}
            {candidate.admin_report && (
              <Card className="border-2" style={{ borderColor: primaryColor }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" style={{ color: primaryColor }} />
                    Avis de l'expert
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(candidate.admin_score)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-lg font-bold" style={{ color: primaryColor }}>
                      {candidate.admin_score.toFixed(1)}/5
                    </span>
                  </div>
                  
                  {candidate.admin_report.summary && (
                    <p className="text-sm text-gray-700">{candidate.admin_report.summary}</p>
                  )}
                  
                  {candidate.admin_report.strengths && candidate.admin_report.strengths.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Points forts</h4>
                      <ul className="space-y-1">
                        {candidate.admin_report.strengths.map((strength, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: primaryColor }} />
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {candidate.admin_report.recommendations && candidate.admin_report.recommendations.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Recommandations</h4>
                      <ul className="space-y-1">
                        {candidate.admin_report.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                            <Target className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: secondaryColor }} />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Informations de contact (mockées) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" style={{ color: primaryColor }} />
                  Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Mail className="h-4 w-4" style={{ color: primaryColor }} />
                  <span>{candidate.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Phone className="h-4 w-4" style={{ color: primaryColor }} />
                  <span>{candidate.phone}</span>
                </div>
              </CardContent>
            </Card>

            {/* CTA pour s'inscrire */}
            <Card style={{ backgroundColor: primaryLight }}>
              <CardContent className="p-6 text-center">
                <h3 className="font-bold text-gray-900 mb-2">
                  Accédez à la CVthèque complète
                </h3>
                <p className="text-sm text-gray-700 mb-4">
                  Cette version démo vous montre un aperçu. Inscrivez-vous pour accéder à tous les profils vérifiés.
                </p>
                <Button
                  className="w-full text-white"
                  style={{ backgroundColor: primaryColor }}
                  onClick={() => navigate('/register/company')}
                >
                  Créer un compte entreprise
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
