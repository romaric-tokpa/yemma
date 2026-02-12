import { Link } from 'react-router-dom'
import { FileCheck, Users, AlertTriangle, Shield, Mail, Scale, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import PublicPageLayout from '@/components/layout/PublicPageLayout'

export default function CGU() {
  return (
    <PublicPageLayout
      title="Conditions générales d'utilisation"
      subtitle="Les règles d'utilisation de la plateforme Yemma Solutions."
      badge={<>Conditions d&apos;utilisation</>}
    >
      <section className="py-8 md:py-10 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="space-y-4">
            <Card className="border-0 shadow-sm border-l-4 border-l-[#226D68]">
              <CardContent className="p-4">
                <h2 className="text-sm font-bold text-[#226D68] mb-2 flex items-center gap-2"><FileCheck className="h-4 w-4" />1. Objet et acceptation</h2>
                <p className="text-sm text-[#6b7280] leading-relaxed mb-2">Les présentes Conditions Générales d&apos;Utilisation (ci-après «&nbsp;CGU&nbsp;») régissent l&apos;accès et l&apos;utilisation de la plateforme <strong>Yemma Solutions</strong> (ci-après «&nbsp;la Plateforme&nbsp;» ou «&nbsp;le Site&nbsp;»), accessible à l&apos;adresse yemma-solutions.com, ainsi que des services associés.</p>
                <p className="text-sm text-[#6b7280] leading-relaxed">En créant un compte ou en utilisant la Plateforme, vous acceptez sans réserve les présentes CGU. Si vous n&apos;acceptez pas ces conditions, vous ne devez pas utiliser nos services. L&apos;éditeur de la Plateforme est <strong>Yemma Solutions</strong>, dont les coordonnées figurent dans les <Link to="/legal/mentions" className="font-medium hover:underline text-[#226D68]">mentions légales</Link>.</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm border-l-4 border-l-[#e76f51]">
              <CardContent className="p-4">
                <h2 className="text-sm font-bold text-[#e76f51] mb-2 flex items-center gap-2"><Users className="h-4 w-4" />2. Description des services</h2>
                <p className="text-sm text-[#6b7280] leading-relaxed mb-3">Yemma Solutions propose une plateforme de mise en relation entre <strong>candidats</strong> et <strong>entreprises/recruteurs</strong>&nbsp;:</p>
                <ul className="list-disc pl-5 space-y-1.5 text-sm text-[#6b7280] mb-3">
                  <li><strong>Candidats&nbsp;:</strong> création d&apos;un profil professionnel, validation du profil par nos experts RH (entretien, compte-rendu), visibilité auprès des recruteurs inscrits, réception d&apos;offres et de contacts.</li>
                  <li><strong>Recruteurs / Entreprises&nbsp;:</strong> accès à une CVthèque de profils validés, outils de recherche et de filtrage, consultation des comptes-rendus RH, gestion d&apos;équipe de recruteurs, contact des candidats.</li>
                </ul>
                <p className="text-sm text-[#6b7280] leading-relaxed">Les fonctionnalités détaillées, les offres tarifaires et les modalités d&apos;abonnement sont décrites sur le Site (pages Tarifs, FAQ, etc.). Yemma se réserve le droit de faire évoluer les services dans le respect des présentes CGU.</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm border-l-4 border-l-[#226D68]">
              <CardContent className="p-4">
                <h2 className="text-sm font-bold text-[#226D68] mb-2">3. Inscription et compte utilisateur</h2>
                <div className="space-y-2 text-sm">
                  <p className="text-[#6b7280] leading-relaxed"><strong>3.1. Création de compte</strong> — Pour accéder à certains services, vous devez créer un compte en fournissant des informations exactes et à jour. Vous êtes responsable de la confidentialité de vos identifiants et de toutes les activités réalisées depuis votre compte.</p>
                  <p className="text-[#6b7280] leading-relaxed"><strong>3.2. Comptes candidats</strong> — L&apos;inscription en tant que candidat est gratuite. Après création du profil, un processus de validation (entretien RH) peut être proposé. L&apos;accès à la CVthèque et la visibilité auprès des recruteurs peuvent être conditionnés à cette validation.</p>
                  <p className="text-[#6b7280] leading-relaxed"><strong>3.3. Comptes recruteurs / entreprises</strong> — L&apos;accès à la CVthèque et aux outils recruteur est soumis à une inscription et, selon les offres, à un abonnement payant. Les conditions financières sont précisées dans les Conditions Générales de Vente (CGV) et sur la page Tarifs.</p>
                  <p className="text-[#6b7280] leading-relaxed"><strong>3.4. Exactitude des informations</strong> — Vous vous engagez à maintenir des informations exactes et complètes. Toute fausse déclaration ou utilisation frauduleuse peut entraîner la suspension ou la résiliation de votre compte.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm border-l-4 border-l-[#e76f51]">
              <CardContent className="p-4">
                <h2 className="text-sm font-bold text-[#e76f51] mb-2 flex items-center gap-2"><AlertTriangle className="h-4 w-4" />4. Obligations des utilisateurs</h2>
                <p className="text-sm text-[#6b7280] leading-relaxed mb-3">En utilisant la Plateforme, vous vous engagez à&nbsp;:</p>
                <ul className="list-disc pl-5 space-y-1.5 text-sm text-[#6b7280] mb-3">
                  <li>Utiliser les services de manière loyale, conforme à leur finalité et aux présentes CGU.</li>
                  <li>Ne pas transmettre de contenus illicites, diffamatoires, discriminatoires, ou portant atteinte aux droits de tiers.</li>
                  <li>Ne pas usurper l&apos;identité d&apos;une personne physique ou morale.</li>
                  <li>Ne pas tenter d&apos;accéder aux comptes ou données d&apos;autrui, ni de perturber le fonctionnement du Site.</li>
                  <li>Ne pas utiliser de robots, scripts ou outils automatisés non autorisés pour extraire des données ou solliciter la Plateforme.</li>
                  <li>Respecter les droits de propriété intellectuelle de Yemma Solutions et des tiers.</li>
                </ul>
                <div className="bg-[#F4F6F8] rounded-lg p-3 border border-gray-200">
                  <p className="text-sm text-[#6b7280] mb-1.5"><strong className="text-[#e76f51]">Candidats&nbsp;:</strong> vous garantissez l&apos;exactitude des informations de votre profil (CV, expériences, compétences). Vous vous engagez à participer de bonne foi au processus de validation si vous y souscrivez.</p>
                  <p className="text-sm text-[#6b7280]"><strong className="text-[#e76f51]">Recruteurs&nbsp;:</strong> vous vous engagez à utiliser les données des candidats uniquement à des fins de recrutement, dans le respect du droit du travail et de la protection des données personnelles. Toute réutilisation ou revente des données est interdite.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm border-l-4 border-l-[#226D68]">
              <CardContent className="p-4">
                <h2 className="text-sm font-bold text-[#226D68] mb-2">5. Propriété intellectuelle</h2>
                <p className="text-sm text-[#6b7280] leading-relaxed mb-2">La Plateforme, son architecture, les textes, graphismes, logos, bases de données et logiciels sont protégés par le droit d&apos;auteur et le droit des marques. Yemma Solutions vous concède un droit d&apos;utilisation personnelle, non exclusif et non transférable, limité à l&apos;accès aux services. Toute reproduction, représentation ou exploitation non autorisée est interdite.</p>
                <p className="text-sm text-[#6b7280] leading-relaxed">Les contenus que vous publiez (CV, descriptions, etc.) restent votre propriété. En les publiant, vous accordez à Yemma Solutions une licence mondiale, non exclusive et sublicenciable, pour les utiliser, afficher et communiquer aux recruteurs dans le cadre du service, conformément à notre <Link to="/legal/privacy" className="font-medium hover:underline text-[#226D68]">politique de confidentialité</Link>.</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm border-l-4 border-l-[#e76f51]">
              <CardContent className="p-4">
                <h2 className="text-sm font-bold text-[#e76f51] mb-2 flex items-center gap-2"><Shield className="h-4 w-4" />6. Données personnelles</h2>
                <p className="text-sm text-[#6b7280] leading-relaxed">Le traitement de vos données personnelles est décrit dans notre <Link to="/legal/privacy" className="font-medium hover:underline text-[#e76f51]">politique de confidentialité</Link>, conforme à la loi n°&nbsp;2013-450 du 19&nbsp;juin 2013 relative à la protection des données à caractère personnel en Côte d&apos;Ivoire. En acceptant les CGU, vous confirmez avoir pris connaissance de ces documents et acceptez le traitement de vos données dans les conditions qui y sont décrites.</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm border-l-4 border-l-[#226D68]">
              <CardContent className="p-4">
                <h2 className="text-sm font-bold text-[#226D68] mb-2">7. Responsabilité et limitation des garanties</h2>
                <div className="space-y-2 text-sm">
                  <p className="text-[#6b7280] leading-relaxed"><strong>7.1. Yemma Solutions</strong> — Nous nous efforçons d&apos;assurer la disponibilité et la qualité du service. Toutefois, nous ne garantissons pas une disponibilité ininterrompue ni l&apos;absence d&apos;erreurs. Nous déclinons toute responsabilité en cas d&apos;interruption, de perte de données ou de dommages indirects résultant de l&apos;utilisation de la Plateforme.</p>
                  <p className="text-[#6b7280] leading-relaxed"><strong>7.2. Contenus et mises en relation</strong> — Yemma Solutions assure une validation des profils candidats (entretien, compte-rendu) mais ne garantit pas l&apos;exactitude complète des informations fournies par les utilisateurs. La conclusion d&apos;un contrat de travail entre un candidat et une entreprise relève de la seule responsabilité des parties concernées. Yemma n&apos;est pas partie à ces relations.</p>
                  <p className="text-[#6b7280] leading-relaxed"><strong>7.3. Utilisation des services</strong> — Vous utilisez la Plateforme sous votre seule responsabilité. Yemma Solutions ne peut être tenu responsable des agissements des utilisateurs (candidats ou recruteurs) ou des contenus qu&apos;ils publient, sous réserve des obligations légales en matière de modération.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm border-l-4 border-l-[#e76f51]">
              <CardContent className="p-4">
                <h2 className="text-sm font-bold text-[#e76f51] mb-2">8. Modération, suspension et résiliation</h2>
                <p className="text-sm text-[#6b7280] leading-relaxed mb-3">Yemma Solutions se réserve le droit de&nbsp;:</p>
                <ul className="list-disc pl-5 space-y-1.5 text-sm text-[#6b7280] mb-3">
                  <li>Modérer, retirer ou refuser tout contenu contraire aux CGU ou au droit en vigueur.</li>
                  <li>Suspendre ou résilier tout compte en cas de manquement aux présentes CGU, de comportement frauduleux ou préjudiciable, ou sur simple décision, avec ou sans préavis.</li>
                  <li>Refuser l&apos;inscription ou la validation d&apos;un candidat ou d&apos;une entreprise.</li>
                </ul>
                <p className="text-sm text-[#6b7280] leading-relaxed mb-2">En cas de résiliation, votre droit d&apos;accès aux services cessera. Les dispositions qui, par leur nature, doivent survivre (propriété intellectuelle, responsabilité, droit applicable) resteront applicables.</p>
                <p className="text-sm text-[#6b7280] leading-relaxed">Vous pouvez à tout moment supprimer votre compte et demander l&apos;effacement de vos données conformément à la politique de confidentialité.</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm border-l-4 border-l-[#226D68]">
              <CardContent className="p-4">
                <h2 className="text-sm font-bold text-[#226D68] mb-2">9. Modifications des CGU</h2>
                <p className="text-sm text-[#6b7280] leading-relaxed">Yemma Solutions peut modifier les présentes CGU à tout moment. Les utilisateurs seront informés des changements substantiels par email ou par un avis sur la Plateforme. La poursuite de l&apos;utilisation des services après l&apos;entrée en vigueur des modifications vaut acceptation des nouvelles CGU. À défaut d&apos;acceptation, vous devez cesser d&apos;utiliser la Plateforme et clôturer votre compte.</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm border-l-4 border-l-[#e76f51]">
              <CardContent className="p-4">
                <h2 className="text-sm font-bold text-[#e76f51] mb-2 flex items-center gap-2"><Scale className="h-4 w-4" />10. Droit applicable et litiges</h2>
                <p className="text-sm text-[#6b7280] leading-relaxed">Les présentes CGU sont régies par le <strong>droit ivoirien</strong>. En cas de litige, et à défaut de résolution amiable, les <strong>tribunaux compétents de Côte d&apos;Ivoire</strong> seront seuls compétents (notamment le Tribunal de commerce d&apos;Abidjan pour les litiges commerciaux).</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm border-l-4 border-l-[#226D68]">
              <CardContent className="p-4">
                <h2 className="text-sm font-bold text-[#226D68] mb-2 flex items-center gap-2"><Mail className="h-4 w-4" />11. Contact</h2>
                <p className="text-sm text-[#6b7280] leading-relaxed mb-3">Pour toute question relative aux présentes CGU&nbsp;:</p>
                <div className="bg-[#F4F6F8] rounded-lg p-4 border border-gray-200">
                  <p className="font-semibold text-[#226D68] mb-1.5">Yemma Solutions</p>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-[#226D68]" />
                    <span className="text-sm text-[#6b7280]">Email&nbsp;: </span>
                    <a href="mailto:contact@yemma-solutions.com" className="text-sm font-medium hover:underline text-[#226D68]">contact@yemma-solutions.com</a>
                  </div>
                </div>
                <div className="bg-[#F4F6F8] rounded-lg p-3 border border-gray-200 mt-3">
                  <p className="text-sm text-[#6b7280]"><strong className="text-[#226D68]">Dernière mise à jour des CGU&nbsp;:</strong> [Date à compléter]</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-2 justify-center flex-wrap">
            <a href="mailto:contact@yemma-solutions.com">
              <Button className="h-9 bg-[#226D68] hover:bg-[#1a5a55] text-white text-sm">
                Nous contacter <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </a>
            <Link to="/legal/mentions">
              <Button variant="outline" className="h-9 border-[#226D68] text-[#226D68] hover:bg-[#E8F4F3] text-sm">Mentions légales</Button>
            </Link>
            <Link to="/legal/privacy">
              <Button variant="outline" className="h-9 border-[#226D68] text-[#226D68] hover:bg-[#E8F4F3] text-sm">Confidentialité</Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicPageLayout>
  )
}
