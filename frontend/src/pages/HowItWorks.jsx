import { useNavigate } from 'react-router-dom'
import { UserPlus, FileCheck, Shield, Star, Building, Search, Users, CheckCircle, Clock, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import PublicPageLayout from '@/components/layout/PublicPageLayout'

export default function HowItWorks() {
  const navigate = useNavigate()

  const candidateSteps = [
    { icon: UserPlus, title: 'Créez votre compte', desc: 'Inscrivez-vous gratuitement en quelques clics avec votre email.' },
    { icon: FileCheck, title: 'Complétez votre profil', desc: 'Renseignez vos expériences, compétences, formations et téléchargez votre CV.' },
    { icon: Shield, title: 'Validation par nos experts', desc: 'Notre équipe vérifie et valide votre profil pour garantir sa qualité.' },
    { icon: Star, title: 'Soyez visible', desc: 'Votre profil validé devient visible par les recruteurs de confiance.' },
  ]

  const recruiterSteps = [
    { icon: Building, title: 'Créez votre compte entreprise', desc: 'Inscrivez votre entreprise et configurez votre espace recruteur.' },
    { icon: Search, title: 'Accédez à la CVthèque', desc: 'Parcourez notre base de candidats validés avec des filtres avancés.' },
    { icon: Users, title: 'Contactez les talents', desc: 'Entrez en contact direct avec les candidats qui correspondent à vos besoins.' },
    { icon: CheckCircle, title: 'Recrutez en confiance', desc: 'Tous nos candidats sont vérifiés pour vous garantir des profils de qualité.' },
  ]

  const advantages = [
    { icon: Shield, title: 'Profils vérifiés', desc: 'Chaque candidat est validé par notre équipe d\'experts.' },
    { icon: Clock, title: 'Gain de temps', desc: 'Accédez directement à des profils qualifiés et pertinents.' },
    { icon: Zap, title: 'Mise en relation rapide', desc: 'Contactez les candidats en quelques clics.' },
    { icon: Star, title: 'Qualité garantie', desc: 'Une sélection rigoureuse pour des recrutements réussis.' },
  ]

  return (
    <PublicPageLayout
      title="Comment ça marche ?"
      subtitle="Découvrez comment Yemma connecte candidats qualifiés et entreprises en quelques étapes."
      badge={<>Guide</>}
    >
      {/* Candidats */}
      <section className="py-8 md:py-10 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-6">
            <h2 className="text-lg md:text-xl font-bold text-[#226D68] mb-1">Pour les candidats</h2>
            <p className="text-sm text-[#6b7280]">Valorisez votre profil et accédez à des opportunités de qualité</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {candidateSteps.map((step, i) => {
              const Icon = step.icon
              return (
                <Card key={i} className="border-0 shadow-sm bg-[#F4F6F8] hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="w-8 h-8 rounded-lg bg-[#E8F4F3] flex items-center justify-center mb-2">
                      <Icon className="h-4 w-4 text-[#226D68]" />
                    </div>
                    <span className="text-[10px] font-bold text-[#226D68]">Étape {i + 1}</span>
                    <h3 className="font-semibold text-sm text-[#2C2C2C] mt-1">{step.title}</h3>
                    <p className="text-sm text-[#6b7280] mt-1 leading-relaxed">{step.desc}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          <div className="text-center mt-5">
            <Button size="sm" onClick={() => navigate('/register/candidat')}
              className="bg-[#226D68] hover:bg-[#1a5a55] text-white h-9">
              Créer mon profil candidat
            </Button>
          </div>
        </div>
      </section>

      {/* Recruteurs */}
      <section className="py-8 md:py-10 bg-[#F4F6F8]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-6">
            <h2 className="text-lg md:text-xl font-bold text-[#e76f51] mb-1">Pour les recruteurs</h2>
            <p className="text-sm text-[#6b7280]">Accédez à une CVthèque de candidats vérifiés et qualifiés</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {recruiterSteps.map((step, i) => {
              const Icon = step.icon
              return (
                <Card key={i} className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="w-8 h-8 rounded-lg bg-[#FDF2F0] flex items-center justify-center mb-2">
                      <Icon className="h-4 w-4 text-[#e76f51]" />
                    </div>
                    <span className="text-[10px] font-bold text-[#e76f51]">Étape {i + 1}</span>
                    <h3 className="font-semibold text-sm text-[#2C2C2C] mt-1">{step.title}</h3>
                    <p className="text-sm text-[#6b7280] mt-1 leading-relaxed">{step.desc}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          <div className="text-center mt-5">
            <Button size="sm" onClick={() => navigate('/register/company')}
              className="bg-[#e76f51] hover:bg-[#d45a3f] text-white h-9">
              Créer mon compte recruteur
            </Button>
          </div>
        </div>
      </section>

      {/* Avantages */}
      <section className="py-8 md:py-10 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-6">
            <h2 className="text-lg md:text-xl font-bold text-[#2C2C2C] mb-1">Pourquoi choisir Yemma ?</h2>
            <p className="text-xs text-[#6b7280]">Une plateforme pensée pour simplifier le recrutement</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {advantages.map((a, i) => {
              const Icon = a.icon
              return (
                <Card key={i} className="border-0 shadow-sm border-l-4 border-l-[#226D68]">
                  <CardContent className="p-4">
                    <div className="w-8 h-8 rounded-lg bg-[#E8F4F3] flex items-center justify-center mb-2">
                      <Icon className="h-4 w-4 text-[#226D68]" />
                    </div>
                    <h3 className="font-semibold text-sm text-[#2C2C2C]">{a.title}</h3>
                    <p className="text-sm text-[#6b7280] mt-1 leading-relaxed">{a.desc}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-8 bg-[#226D68]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-lg font-bold text-white mb-2">Prêt à commencer ?</h2>
          <p className="text-sm text-[#E8F4F3] mb-4">Rejoignez Yemma Solutions et découvrez une nouvelle façon de recruter ou de trouver votre prochain emploi.</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button size="sm" onClick={() => navigate('/register/candidat')}
              className="bg-white text-[#226D68] hover:bg-gray-100 h-9">
              Je suis candidat
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate('/register/company')}
              className="border-white text-white hover:bg-white/10 h-9">
              Je suis recruteur
            </Button>
          </div>
        </div>
      </section>
    </PublicPageLayout>
  )
}
