import { Helmet } from 'react-helmet-async'

const SITE_URL = 'https://yemma-solutions.com'
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`
const OG_IMAGE_WIDTH = 1200
const OG_IMAGE_HEIGHT = 630

/**
 * Composant SEO pour les meta tags dynamiques par page.
 * Optimise le référencement pour les moteurs de recherche (Google, Bing, etc.)
 * et le partage sur les réseaux sociaux.
 */
export function SEO({
  title,
  description,
  keywords,
  canonical,
  image = DEFAULT_IMAGE,
  imageAlt,
  type = 'website',
  noindex = false,
  jsonLd,
}) {
  const fullTitle = title ? `${title} | Yemma Solutions` : 'Yemma Solutions - Plateforme de Recrutement'
  const fullCanonical = canonical ? (canonical.startsWith('http') ? canonical : `${SITE_URL}${canonical}`) : SITE_URL
  const fullImage = image.startsWith('http') ? image : `${SITE_URL}${image}`

  const defaultKeywords = [
    'recrutement',
    'emploi',
    'offre emploi',
    'recherche emploi',
    'candidat',
    'recruteur',
    'entreprise',
    'CV',
    'cvthèque',
    'profils préqualifiés',
    'matching',
    'scoring',
    'plateforme recrutement',
    'RH',
    'ressources humaines',
    'recrutement France',
    'emploi France',
    'Yemma Solutions',
  ]

  const mergedKeywords = keywords
    ? [...new Set([...keywords.split(',').map(k => k.trim()), ...defaultKeywords])].join(', ')
    : defaultKeywords.join(', ')

  const faviconDataUri = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cmVjdCB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgcng9IjExMCIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjI1NiIgY3k9IjI1NiIgcj0iMTcwIiBmaWxsPSJub25lIiBzdHJva2U9IiMwRjVDNUUiIHN0cm9rZS13aWR0aD0iNDAiLz48cGF0aCBkPSJNMjkwIDExMCBBMTQwIDE0MCAwIDEgMCAyOTAgNDAyIEE5NSAxNDAgMCAxIDEgMjkwIDExMCIgZmlsbD0iI0YyOEMyOCIvPjwvc3ZnPg=='

  return (
    <Helmet>
      <link rel="icon" type="image/svg+xml" href={faviconDataUri} />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={mergedKeywords} />
      <link rel="canonical" href={fullCanonical} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullCanonical} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      {imageAlt && <meta property="og:image:alt" content={imageAlt} />}
      <meta property="og:site_name" content="Yemma Solutions" />
      <meta property="og:locale" content="fr_FR" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullCanonical} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />
      {imageAlt && <meta name="twitter:image:alt" content={imageAlt} />}

      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  )
}
