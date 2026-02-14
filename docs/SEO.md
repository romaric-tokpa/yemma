# Guide SEO - Yemma Solutions

Ce document décrit les optimisations SEO mises en place pour améliorer le référencement sur les moteurs de recherche (Google, Bing, etc.) pour les requêtes liées à l'emploi et au recrutement.

## ✅ Implémentations réalisées

### 1. Meta tags enrichis (index.html)
- **Description** : Texte optimisé avec mots-clés (recrutement, emploi, cvthèque, 48h, 60%)
- **Keywords** : Lexique complet emploi/recrutement (recrutement, emploi, offre emploi, candidat, recruteur, cvthèque, RH, etc.)
- **Canonical** : URL canonique pour éviter le contenu dupliqué
- **theme-color** : Cohérence visuelle navigateur

### 2. Open Graph & Twitter Cards
- Titre, description, image pour le partage sur réseaux sociaux
- **og:image** : Image 1200x630px recommandée (à placer dans `frontend/public/og-image.png`)

### 3. Données structurées JSON-LD (Schema.org)
- **Organization** : Identité Yemma Solutions
- **WebSite** : Site avec SearchAction
- **EmploymentAgency** : Type d'activité (agence de recrutement)

### 4. Meta dynamiques par page (react-helmet-async)
Chaque page publique a ses propres meta :
- Landing, HowItWorks, Contact, Register (choice/candidat/company), Login
- DemoCvtheque, Mentions légales, CGU, Politique de confidentialité

### 5. Sitemap.xml
- Toutes les URLs publiques avec `lastmod`, `changefreq`, `priority`
- Priorités : accueil (1.0), inscription (0.9), démo (0.7), légal (0.3)

### 6. Robots.txt
- Allow explicite des pages importantes
- Disallow /api/
- Référence au sitemap
- Section dédiée Bingbot

## 📋 Actions recommandées pour maximiser le référencement

### Image OG (prioritaire)
Créez une image **1200x630px** pour le partage social et placez-la dans :
```
frontend/public/og-image.png
```
Contenu suggéré : logo Yemma + texte "Plateforme de Recrutement | Recrutez en 48h"

### Google Search Console
1. Vérifiez le site : https://search.google.com/search-console
2. Soumettez le sitemap : `https://yemma-solutions.com/sitemap.xml`
3. Surveillez les performances (impressions, clics, position)

### Bing Webmaster Tools
1. Inscrivez le site : https://www.bing.com/webmasters
2. Soumettez le sitemap

### Contenu & backlinks
- **Blog / articles** : Créer du contenu autour de "recrutement", "comment recruter", "trouver un emploi"
- **Backlinks** : Partenariats avec sites emploi, annuaires RH
- **Référencement local** : Si pertinent, Google Business Profile

### Performance (Core Web Vitals)
- Le build Vite est déjà optimisé (code splitting, minification)
- Images : utiliser des formats modernes (WebP), lazy loading
- Vérifier avec PageSpeed Insights

## Mots-clés ciblés

| Catégorie | Exemples |
|-----------|----------|
| Recrutement | recrutement, plateforme recrutement, recruter, cabinet recrutement |
| Emploi | emploi, offre emploi, recherche emploi, trouver un emploi, postuler |
| Candidat | candidat, CV, cvthèque, profil candidat, créer profil |
| Entreprise | recruteur, entreprise, RH, ressources humaines |
| Géographique | recrutement France, emploi France |

## Vérification

```bash
# Build et test local
cd frontend && npm run build && npm run preview

# Vérifier les meta dans le HTML généré
curl -s http://localhost:4173 | grep -E '<meta|<title'
```
