import { Link } from 'react-router-dom'
import { Shield, Mail, Database, Lock, Eye, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import PublicPageLayout from '@/components/layout/PublicPageLayout'

export default function PrivacyPolicy() {
  return (
    <PublicPageLayout
      title="Politique de confidentialité"
      subtitle="Comment Yemma Solutions collecte, utilise et protège vos données personnelles."
      badge={<>Protection des données</>}
    >
      <section className="py-8 md:py-10 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="space-y-4">
            <Card className="border-0 shadow-sm border-l-4 border-l-[#226D68]">
              <CardContent className="p-4">
                <h2 className="text-sm font-bold text-[#226D68] mb-2 flex items-center gap-2"><Shield className="h-4 w-4" />1. Introduction</h2>
                <p className="text-sm text-[#6b7280] leading-relaxed mb-2">
                  Yemma Solutions (ci-après «&nbsp;nous&nbsp;», «&nbsp;notre&nbsp;» ou «&nbsp;Yemma&nbsp;») s&apos;engage à protéger la confidentialité et la sécurité de vos données personnelles. La présente politique de confidentialité explique comment nous collectons, utilisons, partageons et protégeons vos informations personnelles lorsque vous utilisez notre site web et nos services.
                </p>
                <p className="text-sm text-[#6b7280] leading-relaxed mb-2">
                  Le traitement de vos données est effectué conformément à la <strong>loi n°&nbsp;2013-450 du 19&nbsp;juin 2013</strong> relative à la protection des données à caractère personnel en Côte d&apos;Ivoire, et sous le contrôle de l&apos;<strong>ARTCI</strong> (Autorité de régulation des télécommunications/TIC de Côte d&apos;Ivoire).
                </p>
                <p className="text-sm text-[#6b7280] leading-relaxed mb-3">
                  En utilisant notre plateforme, vous acceptez les pratiques décrites dans cette politique. Si vous n&apos;êtes pas d&apos;accord avec cette politique, veuillez ne pas utiliser nos services.
                </p>
                <div className="bg-[#F4F6F8] rounded-lg p-3 border border-gray-200">
                  <p className="text-sm text-[#6b7280]"><strong className="text-[#226D68]">Dernière mise à jour&nbsp;:</strong> [Date à compléter]</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm border-l-4 border-l-[#e76f51]">
              <CardContent className="p-4">
                <h2 className="text-sm font-bold text-[#e76f51] mb-2 flex items-center gap-2"><Mail className="h-4 w-4" />2. Responsable du traitement</h2>
                <p className="text-sm text-[#6b7280] leading-relaxed mb-3">Le responsable du traitement de vos données personnelles est&nbsp;:</p>
                <div className="bg-[#F4F6F8] rounded-lg p-4 border border-gray-200">
                  <p className="font-semibold text-[#e76f51] mb-1.5">Yemma Solutions</p>
                  <p className="text-sm text-[#6b7280] mb-2">Siège social&nbsp;: Abidjan, Côte d&apos;Ivoire</p>
                  <div className="space-y-1.5 pt-2 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-[#e76f51]" />
                      <span className="text-sm text-[#6b7280]">Contact&nbsp;: </span>
                      <a href="mailto:contact@yemma-solutions.com" className="text-sm font-medium hover:underline text-[#226D68]">contact@yemma-solutions.com</a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-[#e76f51]" />
                      <span className="text-sm text-[#6b7280]">DPO&nbsp;: </span>
                      <a href="mailto:dpo@yemma-solutions.com" className="text-sm font-medium hover:underline text-[#226D68]">dpo@yemma-solutions.com</a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm border-l-4 border-l-[#226D68]">
              <CardContent className="p-4">
                <h2 className="text-sm font-bold text-[#226D68] mb-2 flex items-center gap-2"><Database className="h-4 w-4" />3. Données collectées</h2>
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-sm text-[#226D68] mb-1.5">3.1. Données fournies directement</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-[#6b7280]">
                      <li><strong>Pour les candidats&nbsp;:</strong> nom, prénom, email, téléphone, adresse, date de naissance, CV, lettre de motivation, parcours professionnel, formations, compétences, préférences géographiques, etc.</li>
                      <li><strong>Pour les entreprises/recruteurs&nbsp;:</strong> raison sociale, RCCM, NIU, adresse, nom et coordonnées des responsables, informations de facturation, etc.</li>
                      <li><strong>Lors des entretiens de validation&nbsp;:</strong> enregistrements audio/vidéo (avec consentement), notes d&apos;entretien, évaluations.</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-[#226D68] mb-1.5">3.2. Données collectées automatiquement</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-[#6b7280]">
                      <li>Données de connexion&nbsp;: adresse IP, type de navigateur, système d&apos;exploitation, pages visitées, durée de visite, etc.</li>
                      <li>Cookies et traceurs&nbsp;: voir section dédiée ci-dessous.</li>
                      <li>Données d&apos;utilisation&nbsp;: interactions avec la plateforme, recherches effectuées, profils consultés, etc.</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-[#226D68] mb-1.5">3.3. Données provenant de tiers</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-[#6b7280]">
                      <li>Données issues de réseaux sociaux si vous vous connectez via ces services.</li>
                      <li>Données de référencement professionnel (LinkedIn, etc.) si vous les importez.</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm border-l-4 border-l-[#e76f51]">
              <CardContent className="p-4">
                <h2 className="text-sm font-bold text-[#e76f51] mb-2">4. Finalités du traitement</h2>
                <ul className="list-disc pl-5 space-y-1.5 text-sm text-[#6b7280] mb-3">
                  <li><strong>Gestion de votre compte et des services&nbsp;:</strong> création de profil, authentification, mise à jour de vos informations, accès à la CVthèque (recruteurs), etc.</li>
                  <li><strong>Validation des profils candidats&nbsp;:</strong> organisation d&apos;entretiens, évaluation, rédaction de compte-rendu RH.</li>
                  <li><strong>Mise en relation&nbsp;:</strong> permettre aux recruteurs de découvrir et contacter les candidats validés, et inversement.</li>
                  <li><strong>Communication&nbsp;:</strong> envoi de notifications, réponses à vos demandes, informations sur nos services.</li>
                  <li><strong>Amélioration de nos services&nbsp;:</strong> analyse statistique, développement de nouvelles fonctionnalités, optimisation de l&apos;expérience utilisateur.</li>
                  <li><strong>Facturation et gestion commerciale&nbsp;:</strong> pour les entreprises abonnées.</li>
                  <li><strong>Obligations légales&nbsp;:</strong> respect des obligations comptables, fiscales et de sécurité en vigueur en Côte d&apos;Ivoire.</li>
                  <li><strong>Prévention de la fraude et sécurité&nbsp;:</strong> détection d&apos;activités suspectes, protection de la plateforme.</li>
                </ul>
                <div className="bg-[#F4F6F8] rounded-lg p-3 border border-gray-200">
                  <p className="text-sm text-[#6b7280]"><strong className="text-[#e76f51]">Base légale&nbsp;:</strong> Le traitement repose sur votre consentement, l&apos;exécution d&apos;un contrat, le respect d&apos;obligations légales ou nos intérêts légitimes, conformément à la loi ivoirienne sur la protection des données.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm border-l-4 border-l-[#226D68]">
              <CardContent className="p-4">
                <h2 className="text-sm font-bold text-[#226D68] mb-2">5. Conservation</h2>
                <ul className="list-disc pl-5 space-y-1.5 text-sm text-[#6b7280] mb-3">
                  <li><strong>Données de compte actif&nbsp;:</strong> pendant toute la durée d&apos;utilisation de nos services, puis 3 ans après la dernière connexion.</li>
                  <li><strong>Profils candidats validés&nbsp;:</strong> conservés tant que le candidat souhaite rester visible, puis 2 ans après désactivation (sauf demande de suppression).</li>
                  <li><strong>Données de facturation&nbsp;:</strong> 10 ans conformément aux obligations comptables applicables en Côte d&apos;Ivoire (OHADA, droit ivoirien).</li>
                  <li><strong>Données de connexion et logs&nbsp;:</strong> 12 mois maximum.</li>
                  <li><strong>Cookies&nbsp;:</strong> voir section dédiée.</li>
                </ul>
                <p className="text-sm text-[#6b7280] leading-relaxed">Au-delà de ces durées, vos données sont supprimées ou anonymisées, sauf obligation légale de conservation.</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm border-l-4 border-l-[#e76f51]">
              <CardContent className="p-4">
                <h2 className="text-sm font-bold text-[#e76f51] mb-2">6. Destinataires</h2>
                <ul className="list-disc pl-5 space-y-1.5 text-sm text-[#6b7280] mb-3">
                  <li><strong>Équipe Yemma Solutions&nbsp;:</strong> personnel autorisé (RH, support, technique, commercial) dans le cadre de leurs fonctions.</li>
                  <li><strong>Recruteurs et entreprises&nbsp;:</strong> pour les candidats validés, les informations de profil (CV, compte-rendu RH) sont visibles par les recruteurs inscrits sur la plateforme.</li>
                  <li><strong>Prestataires techniques&nbsp;:</strong> hébergeurs, services cloud, outils d&apos;analyse, services de paiement, etc., sous contrat strict de confidentialité.</li>
                  <li><strong>Autorités compétentes&nbsp;:</strong> en cas d&apos;obligation légale ou de réquisition judiciaire en Côte d&apos;Ivoire.</li>
                </ul>
                <div className="bg-[#F4F6F8] rounded-lg p-3 border border-gray-200">
                  <p className="text-sm text-[#6b7280]"><strong className="text-[#e76f51]">Transferts hors Côte d&apos;Ivoire&nbsp;:</strong> Certains prestataires peuvent être situés à l&apos;étranger. Dans ce cas, nous nous assurons que des garanties appropriées sont en place (clauses contractuelles, adéquation) conformément à la loi ivoirienne sur la protection des données.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm border-l-4 border-l-[#226D68]">
              <CardContent className="p-4">
                <h2 className="text-sm font-bold text-[#226D68] mb-2">7. Cookies et traceurs</h2>
                <p className="text-sm text-[#6b7280] leading-relaxed mb-3">Notre site utilise des cookies et traceurs pour&nbsp;:</p>
                <ul className="list-disc pl-5 space-y-1.5 text-sm text-[#6b7280] mb-3">
                  <li><strong>Cookies strictement nécessaires&nbsp;:</strong> authentification, sécurité, fonctionnement du site (conservation&nbsp;: session ou 12 mois).</li>
                  <li><strong>Cookies de préférences&nbsp;:</strong> mémorisation de vos choix (langue, paramètres) (conservation&nbsp;: 12 mois).</li>
                  <li><strong>Cookies analytiques&nbsp;:</strong> mesure d&apos;audience, statistiques d&apos;utilisation (conservation&nbsp;: 13 mois maximum).</li>
                  <li><strong>Cookies de ciblage/publicité&nbsp;:</strong> personnalisation de contenus, publicité ciblée (si applicable) (conservation&nbsp;: 13 mois maximum).</li>
                </ul>
                <p className="text-sm text-[#6b7280] leading-relaxed">Vous pouvez gérer vos préférences de cookies via les paramètres de votre navigateur ou via le bandeau de consentement affiché lors de votre première visite. Le refus de certains cookies peut affecter le fonctionnement du site.</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm border-l-4 border-l-[#e76f51]">
              <CardContent className="p-4">
                <h2 className="text-sm font-bold text-[#e76f51] mb-2 flex items-center gap-2"><Eye className="h-4 w-4" />8. Vos droits</h2>
                <p className="text-sm text-[#6b7280] leading-relaxed mb-3">Conformément à la <strong>loi n°&nbsp;2013-450 du 19&nbsp;juin 2013</strong> relative à la protection des données à caractère personnel en Côte d&apos;Ivoire, vous disposez des droits suivants&nbsp;:</p>
                <ul className="list-disc pl-5 space-y-1.5 text-sm text-[#6b7280] mb-3">
                  <li><strong>Droit d&apos;accès&nbsp;:</strong> obtenir une copie de vos données personnelles.</li>
                  <li><strong>Droit de rectification&nbsp;:</strong> corriger vos données inexactes ou incomplètes.</li>
                  <li><strong>Droit à l&apos;effacement&nbsp;:</strong> demander la suppression de vos données (sous réserve d&apos;obligations légales).</li>
                  <li><strong>Droit à la limitation&nbsp;:</strong> limiter le traitement de vos données dans certains cas.</li>
                  <li><strong>Droit d&apos;opposition&nbsp;:</strong> vous opposer au traitement pour motifs légitimes ou à des fins de prospection.</li>
                  <li><strong>Droit de retirer votre consentement&nbsp;:</strong> à tout moment, sans affecter la licéité du traitement antérieur.</li>
                </ul>
                <div className="bg-[#F4F6F8] rounded-lg p-3 border border-gray-200">
                  <p className="text-sm text-[#6b7280] mb-1.5">Pour exercer vos droits, contactez-nous à&nbsp;: <a href="mailto:dpo@yemma-solutions.com" className="font-medium hover:underline text-[#226D68]">dpo@yemma-solutions.com</a>. Nous répondrons dans un délai d&apos;un mois.</p>
                  <p className="text-sm text-[#6b7280]">Vous avez également le droit d&apos;introduire une réclamation auprès de l&apos;<strong>ARTCI</strong>&nbsp;: <a href="https://www.artci.ci" target="_blank" rel="noopener noreferrer" className="font-medium hover:underline text-[#226D68]">www.artci.ci</a></p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm border-l-4 border-l-[#226D68]">
              <CardContent className="p-4">
                <h2 className="text-sm font-bold text-[#226D68] mb-2 flex items-center gap-2"><Lock className="h-4 w-4" />9. Sécurité des données</h2>
                <p className="text-sm text-[#6b7280] leading-relaxed mb-2">Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données personnelles contre la perte, l&apos;accès non autorisé, la divulgation, l&apos;altération ou la destruction&nbsp;: chiffrement (HTTPS/TLS), authentification forte, contrôle d&apos;accès, sauvegardes régulières, audits de sécurité, etc.</p>
                <p className="text-sm text-[#6b7280] leading-relaxed">Cependant, aucune méthode de transmission ou de stockage n&apos;est totalement sécurisée. Nous ne pouvons garantir une sécurité absolue, mais nous nous engageons à prendre toutes les précautions raisonnables.</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm border-l-4 border-l-[#e76f51]">
              <CardContent className="p-4">
                <h2 className="text-sm font-bold text-[#e76f51] mb-2">10. Modifications de la politique</h2>
                <p className="text-sm text-[#6b7280] leading-relaxed">Nous pouvons modifier cette politique de confidentialité à tout moment. Les modifications importantes vous seront notifiées par email ou via un avis sur le site. La date de dernière mise à jour est indiquée en haut de cette page. Il est recommandé de consulter régulièrement cette politique.</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm border-l-4 border-l-[#226D68]">
              <CardContent className="p-4">
                <h2 className="text-sm font-bold text-[#226D68] mb-2 flex items-center gap-2"><Mail className="h-4 w-4" />11. Contact</h2>
                <p className="text-sm text-[#6b7280] leading-relaxed mb-3">Pour toute question concernant cette politique de confidentialité ou le traitement de vos données, contactez&nbsp;:</p>
                <div className="bg-[#F4F6F8] rounded-lg p-4 border border-gray-200">
                  <p className="font-semibold text-[#226D68] mb-1.5">Délégué à la protection des données (DPO)</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-[#226D68]" />
                      <span className="text-sm text-[#6b7280]">Email&nbsp;: </span>
                      <a href="mailto:dpo@yemma-solutions.com" className="text-sm font-medium hover:underline text-[#226D68]">dpo@yemma-solutions.com</a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-[#226D68]" />
                      <span className="text-sm text-[#6b7280]">Ou&nbsp;: </span>
                      <a href="mailto:contact@yemma-solutions.com" className="text-sm font-medium hover:underline text-[#226D68]">contact@yemma-solutions.com</a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-2 justify-center">
            <a href="mailto:contact@yemma-solutions.com">
              <Button className="h-9 bg-[#226D68] hover:bg-[#1a5a55] text-white text-sm">
                Nous contacter <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </a>
            <Link to="/legal/mentions">
              <Button variant="outline" className="h-9 border-[#226D68] text-[#226D68] hover:bg-[#E8F4F3] text-sm">Mentions légales</Button>
            </Link>
            <Link to="/legal/terms">
              <Button variant="outline" className="h-9 border-[#226D68] text-[#226D68] hover:bg-[#E8F4F3] text-sm">CGU</Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicPageLayout>
  )
}
