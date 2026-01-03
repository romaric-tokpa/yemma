# Droit à l'Information RGPD - Consultation des Accès par Candidat

## Vue d'ensemble

Le service Audit implémente le **droit à l'information** (Article 15 du RGPD) en permettant aux candidats de consulter l'historique complet des accès à leur profil.

## Endpoint

### GET /api/v1/audit/candidate/{candidate_id}

Récupère tous les logs d'accès pour un candidat spécifique.

**Authentification** : Requis (Bearer Token)

**Permissions** :
- Le candidat peut consulter uniquement ses propres logs
- Les administrateurs peuvent consulter tous les logs

**Paramètres de requête** :
- `limit` (int, défaut: 100, max: 1000) : Nombre de résultats par page
- `offset` (int, défaut: 0) : Décalage pour la pagination

## Exemple d'utilisation

### Requête

```http
GET /api/v1/audit/candidate/123?limit=50&offset=0
Authorization: Bearer <jwt_token>
```

### Réponse

```json
{
  "total": 150,
  "items": [
    {
      "id": 1,
      "recruiter_id": 5,
      "recruiter_email": "recruiter@acme.com",
      "recruiter_name": "Jane Recruiter",
      "company_id": 2,
      "company_name": "Acme Corp",
      "candidate_id": 123,
      "candidate_email": "candidate@example.com",
      "candidate_name": "John Doe",
      "accessed_at": "2024-01-15T10:30:00Z",
      "access_type": "profile_view",
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "created_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": 2,
      "recruiter_id": 8,
      "recruiter_email": "manager@techcorp.com",
      "recruiter_name": "Bob Manager",
      "company_id": 3,
      "company_name": "TechCorp",
      "candidate_id": 123,
      "candidate_email": "candidate@example.com",
      "candidate_name": "John Doe",
      "accessed_at": "2024-01-14T14:20:00Z",
      "access_type": "profile_view",
      "ip_address": "192.168.1.2",
      "user_agent": "Mozilla/5.0...",
      "created_at": "2024-01-14T14:20:00Z"
    }
  ]
}
```

## Sécurité

### Vérification des permissions

La route utilise la dépendance `require_candidate_access(candidate_id)` qui :

1. **Vérifie l'authentification** : L'utilisateur doit être authentifié avec un token JWT valide
2. **Vérifie les permissions** :
   - L'utilisateur doit être le candidat concerné (`user_id == candidate_id`)
   - OU être un administrateur (`ROLE_ADMIN`)

### Erreurs possibles

- **401 Unauthorized** : Token manquant ou invalide
- **403 Forbidden** : L'utilisateur n'est pas le candidat concerné et n'est pas admin

## Conformité RGPD

### Article 15 - Droit d'accès

Les candidats ont le droit de :
- **Savoir qui** a consulté leur profil (recruteur, entreprise)
- **Savoir quand** leur profil a été consulté (date et heure précise)
- **Savoir dans quel contexte** (type d'accès, IP, User-Agent)

### Informations fournies

Pour chaque accès, le candidat peut voir :
- **Qui** : 
  - ID, email et nom du recruteur
  - ID et nom de l'entreprise
- **Quand** : Date et heure précise de l'accès
- **Contexte** :
  - Type d'accès (profile_view, document_view, etc.)
  - Adresse IP (si disponible)
  - User-Agent (si disponible)

## Intégration Frontend

### Exemple d'appel depuis le frontend

```javascript
// Dans le service API
const getMyAccessLogs = async (candidateId, limit = 100, offset = 0) => {
  const response = await auditApiClient.get(
    `/api/v1/audit/candidate/${candidateId}`,
    {
      params: { limit, offset }
    }
  )
  return response.data
}
```

### Affichage dans l'interface candidat

```jsx
// Composant React
function AccessHistory({ candidateId }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await getMyAccessLogs(candidateId)
        setLogs(data.items)
      } catch (error) {
        console.error('Error fetching access logs:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchLogs()
  }, [candidateId])
  
  return (
    <div>
      <h2>Historique des accès à mon profil</h2>
      <p>Total: {logs.length} accès</p>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Recruteur</th>
            <th>Entreprise</th>
            <th>Type d'accès</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.id}>
              <td>{new Date(log.accessed_at).toLocaleString()}</td>
              <td>{log.recruiter_name || log.recruiter_email}</td>
              <td>{log.company_name}</td>
              <td>{log.access_type}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

## Pagination

La route supporte la pagination avec `limit` et `offset` :

```http
# Première page (50 premiers résultats)
GET /api/v1/audit/candidate/123?limit=50&offset=0

# Deuxième page (résultats 51-100)
GET /api/v1/audit/candidate/123?limit=50&offset=50
```

Le champ `total` dans la réponse indique le nombre total de logs pour permettre la pagination complète.

## Performance

- **Index sur `candidate_id`** : Optimise les requêtes par candidat
- **Index sur `accessed_at`** : Optimise le tri par date
- **Pagination** : Limite le nombre de résultats retournés

## Notes importantes

1. **Confidentialité** : Les logs sont accessibles uniquement au candidat concerné
2. **Traçabilité** : Tous les accès sont enregistrés de manière immuable
3. **Rétention** : Les logs sont conservés selon la politique de rétention de l'entreprise
4. **Export** : Les candidats peuvent exporter leurs données (à implémenter si nécessaire)

