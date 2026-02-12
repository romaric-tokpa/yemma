import { Link } from 'react-router-dom'
import { Building, Mail, Globe, Shield, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import PublicPageLayout from '@/components/layout/PublicPageLayout'

export default function MentionsLegales() {
  return (
    <PublicPageLayout
      title="Mentions légales"
      subtitle="Identité de l'éditeur, hébergeur et informations relatives à l'utilisation du site."
      badge={<>Informations légales</>}
    >
      <section className="py-8 md:py-10 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="space-y-4">
            <Card className="border-0 shadow-sm border-l-4 border-l-[#226D68]">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg shrink-0 bg-[#E8F4F3]">
                    <Building className="h-4 w-4 text-[#226D68]" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-base font-bold text-[#226D68] mb-2">1. Éditeur du site</h2>
                    <p className="text-sm text-[#6b7280] leading-relaxed mb-3">
                      Le site <strong>yemma-solutions.com</strong> (ci-après «&nbsp;le Site&nbsp;») est édité par&nbsp;:
                    </p>
                    <div className="bg-[#F4F6F8] rounded-lg p-4 border border-gray-200">
                      <p className="font-semibold text-[#226D68] mb-1.5">Yemma Solutions</p>
                      <p className="text-sm text-[#6b7280] mb-1">Société par actions simplifiée (SAS) – Acte uniforme OHADA</p>
                      <p className="text-sm text-[#6b7280] mb-1">Siège social&nbsp;: Abidjan, Côte d&apos;Ivoire</p>
                      <p className="text-sm text-[#6b7280] mb-1">Capital social&nbsp;: [À compléter]</p>
                      <p className="text-sm text-[#6b7280] mb-1">RCCM&nbsp;: [À compléter – ex. CI-ABJ-XX-XXXX-BXX-XXXXX]</p>
                      <p className="text-sm text-[#6b7280] mb-2">NIU / IDU&nbsp;: [À compléter]</p>
                      <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                        <Mail className="h-3.5 w-3.5 text-[#226D68]" />
                        <a href="mailto:contact@yemma-solutions.com" className="text-sm font-medium hover:underline text-[#226D68]">
                          contact@yemma-solutions.com
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm border-l-4 border-l-[#e76f51]">
              <CardContent className="p-5">
                <h2 className="text-base font-bold text-[#e76f51] mb-2">2. Directeur de la publication</h2>
                <p className="text-sm text-[#6b7280] leading-relaxed">
                  Le directeur de la publication du Site est [Nom du responsable], en qualité de [fonction].
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm border-l-4 border-l-[#226D68]">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg shrink-0 bg-[#E8F4F3]">
                    <Globe className="h-4 w-4 text-[#226D68]" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-base font-bold text-[#226D68] mb-2">3. Hébergeur</h2>
                    <p className="text-sm text-[#6b7280] leading-relaxed mb-3">
                      Le Site est hébergé par&nbsp;:
                    </p>
                    <div className="bg-[#F4F6F8] rounded-lg p-4 border border-gray-200">
                      <p className="font-semibold text-[#226D68] mb-1.5">[Nom de l&apos;hébergeur]</p>
                      <p className="text-sm text-[#6b7280] mb-1">[Adresse du siège]</p>
                      <p className="text-sm text-[#6b7280]">[Coordonnées]</p>
                    </div>
                    <p className="text-sm text-[#6b7280] mt-3 leading-relaxed">
                      En cas de difficulté d&apos;accès au Site ou de contenu illicite, vous pouvez contacter l&apos;hébergeur aux coordonnées ci-dessus.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm border-l-4 border-l-[#e76f51]">
              <CardContent className="p-5">
                <h2 className="text-base font-bold text-[#e76f51] mb-2">4. Propriété intellectuelle</h2>
                <p className="text-sm text-[#6b7280] leading-relaxed mb-2">
                  L&apos;ensemble du Site (structure, textes, logos, visuels, bases de données, logiciels, etc.) est protégé par le droit d&apos;auteur, le droit des marques et le droit des bases de données, en vigueur en Côte d&apos;Ivoire et dans l&apos;espace OHADA. Toute reproduction, représentation, modification ou exploitation, totale ou partielle, sans autorisation préalable écrite de Yemma Solutions est interdite et constitue une contrefaçon susceptible d&apos;engager la responsabilité civile et pénale de son auteur.
                </p>
                <p className="text-sm text-[#6b7280] leading-relaxed">
                  La marque «&nbsp;Yemma&nbsp;» et le logo Yemma Solutions sont des signes distinctifs protégés. Leur utilisation sans autorisation est prohibée.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm border-l-4 border-l-[#226D68]">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg shrink-0 bg-[#E8F4F3]">
                    <Shield className="h-4 w-4 text-[#226D68]" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-base font-bold text-[#226D68] mb-2">5. Données personnelles et cookies</h2>
                    <p className="text-sm text-[#6b7280] leading-relaxed mb-3">
                      Les données à caractère personnel collectées via le Site sont traitées conformément à la <strong>loi n°&nbsp;2013-450 du 19&nbsp;juin 2013</strong> relative à la protection des données à caractère personnel en Côte d&apos;Ivoire. Vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement, de limitation du traitement et d&apos;opposition. Vous pouvez introduire une réclamation auprès de l&apos;ARTCI (Autorité de régulation des télécommunications/TIC de Côte d&apos;Ivoire), autorité compétente en matière de protection des données.
                    </p>
                    <p className="text-sm text-[#6b7280] leading-relaxed mb-2">Pour plus d&apos;informations&nbsp;:</p>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-[#6b7280] mb-3">
                      <li>
                        <Link to="/legal/privacy" className="font-medium hover:underline text-[#226D68]">
                          Politique de confidentialité
                        </Link>
                      </li>
                      <li>
                        <Link to="/legal/rgpd" className="font-medium hover:underline text-[#226D68]">
                          Protection des données personnelles
                        </Link>
                      </li>
                    </ul>
                    <p className="text-sm text-[#6b7280] leading-relaxed">
                      Les cookies et traceurs utilisés sur le Site permettent d&apos;assurer son fonctionnement, d&apos;analyser l&apos;audience et, le cas échéant, de personnaliser les contenus. Vous pouvez gérer vos préférences via les paramètres de votre navigateur ou via les mécanismes prévus sur le Site.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm border-l-4 border-l-[#e76f51]">
              <CardContent className="p-5">
                <h2 className="text-base font-bold text-[#e76f51] mb-2">6. Limitation de responsabilité</h2>
                <p className="text-sm text-[#6b7280] leading-relaxed mb-2">
                  Yemma Solutions s&apos;efforce d&apos;assurer l&apos;exactitude et la mise à jour des informations diffusées sur le Site. Toutefois, Yemma Solutions ne peut garantir l&apos;exactitude, la complétude ou l&apos;actualité des informations. L&apos;utilisation du Site et des contenus qui y sont proposés s&apos;effectue sous la seule responsabilité de l&apos;utilisateur.
                </p>
                <p className="text-sm text-[#6b7280] leading-relaxed">
                  Yemma Solutions décline toute responsabilité&nbsp;: (i)&nbsp;en cas d&apos;interruption ou de dysfonctionnement du Site&nbsp;; (ii)&nbsp;en cas d&apos;accès illicite ou d&apos;altération des données des utilisateurs&nbsp;; (iii)&nbsp;pour les contenus publiés par des tiers (liens, espaces utilisateurs, etc.) ou pour les dommages résultant de l&apos;utilisation de sites tiers accessibles via des liens depuis le Site.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm border-l-4 border-l-[#226D68]">
              <CardContent className="p-5">
                <h2 className="text-base font-bold text-[#226D68] mb-2">7. Liens hypertextes</h2>
                <p className="text-sm text-[#6b7280] leading-relaxed">
                  Tout lien vers le Site devra faire l&apos;objet d&apos;une autorisation préalable de Yemma Solutions. Les liens vers des sites externes sont fournis à titre indicatif&nbsp;; Yemma Solutions n&apos;exerce aucun contrôle sur ces sites et décline toute responsabilité quant à leur contenu.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm border-l-4 border-l-[#e76f51]">
              <CardContent className="p-5">
                <h2 className="text-base font-bold text-[#e76f51] mb-2">8. Droit applicable et juridiction compétente</h2>
                <p className="text-sm text-[#6b7280] leading-relaxed">
                  Les présentes mentions légales et l&apos;utilisation du Site sont régies par le <strong>droit ivoirien</strong>. En cas de litige, et à défaut de résolution amiable, les <strong>tribunaux compétents de Côte d&apos;Ivoire</strong> (notamment le Tribunal de commerce d&apos;Abidjan pour les litiges commerciaux) seront seuls compétents.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm border-l-4 border-l-[#226D68]">
              <CardContent className="p-5">
                <h2 className="text-base font-bold text-[#226D68] mb-2">9. Dernière mise à jour</h2>
                <p className="text-sm text-[#6b7280] leading-relaxed">
                  Dernière mise à jour des mentions légales&nbsp;: [Date à compléter]. Yemma Solutions se réserve le droit de modifier les présentes mentions à tout moment. Il est recommandé de les consulter régulièrement.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-2 justify-center">
            <a href="mailto:contact@yemma-solutions.com">
              <Button className="h-9 bg-[#226D68] hover:bg-[#1a5a55] text-white text-sm">
                Nous contacter <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </a>
            <Link to="/legal/terms">
              <Button variant="outline" className="h-9 border-[#226D68] text-[#226D68] hover:bg-[#E8F4F3] text-sm">
                Consulter les CGU
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicPageLayout>
  )
}
