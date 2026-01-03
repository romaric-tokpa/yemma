# Service d'Audit pour la Conformité RGPD

## Vue d'ensemble

Le service Audit enregistre tous les accès aux profils candidats pour garantir la conformité RGPD et permettre aux candidats d'exercer leur droit à l'information.

## Modèle AccessLog

### Champs principaux

- **recruiter_id** : ID du recruteur
- **candidate_id** : ID du candidat consulté
- **accessed_at** : Timestamp de l'accès
- **action_type** : Type d'action (VIEW_PROFILE, DOWNLOAD_CV)
- **company_id** : ID de l'entreprise
- **company_name** : Nom de l'entreprise

### Enum ActionType

```python
class ActionType(str, Enum):
    VIEW_PROFILE = "VIEW_PROFILE"
    DOWNLOAD_CV = "DOWNLOAD_CV"
```

## Fonction Utilitaire Partagée

### `log_access()` dans `services/shared/audit_logger.py`

Cette fonction peut être appelée par n'importe quel service pour enregistrer un accès.

**Exemple d'utilisation** :

```python
from services.shared.audit_logger import log_access

# Dans le service Recherche ou Document
await log_access(
    service_name="search-service",
    audit_service_url="http://audit:8000",
    recruiter_id=123,
    recruiter_email="recruiter@example.com",
    recruiter_name="Jane Recruiter",
    company_id=1,
    company_name="Acme Corp",
    candidate_id=456,
    candidate_email="candidate@example.com",
    candidate_name="John Doe",
    action_type="VIEW_PROFILE"  # ou "DOWNLOAD_CV"
)
```

**Caractéristiques** :
- Non-bloquant : Si l'enregistrement échoue, l'erreur est loggée mais n'interrompt pas le processus
- Authentification inter-services : Utilise un token de service pour l'authentification
- Flexible : Accepte tous les paramètres nécessaires pour l'audit

## Endpoints

### POST /api/v1/audit

Enregistre un log d'accès (appelé par les autres services).

**Body** :
```json
{
  "recruiter_id": 123,
  "recruiter_email": "recruiter@example.com",
  "recruiter_name": "Jane Recruiter",
  "company_id": 1,
  "company_name": "Acme Corp",
  "candidate_id": 456,
  "candidate_email": "candidate@example.com",
  "candidate_name": "John Doe",
  "action_type": "VIEW_PROFILE",
  "access_type": "profile_view"
}
```

### GET /api/v1/audit/candidate/me

**Récupère le résumé des accès pour le candidat connecté (RGPD)**

Retourne uniquement la liste des entreprises (nom uniquement) qui ont consulté le profil.

**Authentification** : Requis (Bearer Token)

**Permissions** : Seul le candidat connecté peut accéder à ses propres données

**Réponse** :
```json
{
  "candidate_id": 456,
  "total_accesses": 25,
  "unique_companies": 5,
  "companies": [
    {
      "company_id": 1,
      "company_name": "Acme Corp",
      "access_count": 10,
      "last_access": "2024-01-15T10:30:00Z"
    },
    {
      "company_id": 2,
      "company_name": "TechCorp",
      "access_count": 8,
      "last_access": "2024-01-14T14:20:00Z"
    }
  ]
}
```

**Paramètres de requête** :
- `limit` (int, défaut: 100, max: 1000) : Nombre d'entreprises par page
- `offset` (int, défaut: 0) : Décalage pour la pagination

## Conformité RGPD

### Article 15 - Droit d'accès

Les candidats ont le droit de :
- **Savoir quelles entreprises** ont consulté leur profil (nom uniquement)
- **Savoir combien de fois** chaque entreprise a consulté
- **Savoir quand** la dernière consultation a eu lieu

### Données minimales exposées

Pour respecter la vie privée des entreprises, seuls les **noms d'entreprises** sont exposés, pas les détails des recruteurs individuels.

## Intégration avec les autres services

### Service Recherche

Lorsqu'un recruteur consulte un profil :

```python
# Dans search-service
from services.shared.audit_logger import log_access

# Après avoir vérifié le quota et récupéré le profil
await log_access(
    service_name="search-service",
    audit_service_url=settings.AUDIT_SERVICE_URL,
    recruiter_id=current_user.user_id,
    recruiter_email=current_user.email,
    company_id=current_user.company_id,
    candidate_id=candidate_id,
    action_type="VIEW_PROFILE"
)
```

### Service Document

Lorsqu'un recruteur télécharge un CV :

```python
# Dans document-service
await log_access(
    service_name="document-service",
    audit_service_url=settings.AUDIT_SERVICE_URL,
    recruiter_id=current_user.user_id,
    recruiter_email=current_user.email,
    company_id=current_user.company_id,
    candidate_id=candidate_id,
    action_type="DOWNLOAD_CV"
)
```

## Exemple d'utilisation Frontend

### Afficher les entreprises qui ont consulté mon profil

```javascript
// Dans le service API
const getMyAccessSummary = async () => {
  const response = await auditApiClient.get('/api/v1/audit/candidate/me')
  return response.data
}
```

### Composant React

```jsx
function MyAccessHistory() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data = await getMyAccessSummary()
        setSummary(data)
      } catch (error) {
        console.error('Error fetching access summary:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchSummary()
  }, [])
  
  if (loading) return <div>Chargement...</div>
  
  return (
    <div>
      <h2>Entreprises qui ont consulté mon profil</h2>
      <p>Total d'accès : {summary.total_accesses}</p>
      <p>Entreprises uniques : {summary.unique_companies}</p>
      
      <table>
        <thead>
          <tr>
            <th>Entreprise</th>
            <th>Nombre d'accès</th>
            <th>Dernier accès</th>
          </tr>
        </thead>
        <tbody>
          {summary.companies.map(company => (
            <tr key={company.company_id}>
              <td>{company.company_name || 'Entreprise inconnue'}</td>
              <td>{company.access_count}</td>
              <td>{new Date(company.last_access).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

## Sécurité

1. **Authentification obligatoire** : Token JWT requis
2. **Vérification des permissions** : Seul le candidat concerné peut voir ses logs
3. **Données minimales** : Seuls les noms d'entreprises sont exposés
4. **Traçabilité complète** : Tous les accès sont enregistrés de manière immuable

## Notes importantes

1. **Non-bloquant** : L'enregistrement des logs ne doit pas bloquer les opérations principales
2. **Performance** : Les logs sont indexés pour des requêtes rapides
3. **Rétention** : Les logs sont conservés selon la politique de rétention RGPD
4. **Anonymisation** : Possibilité d'anonymiser les logs après une période de rétention

