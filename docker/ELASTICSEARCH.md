# Configuration ElasticSearch et Kibana

## Services Docker

### ElasticSearch 8.11.0

Le service ElasticSearch est configuré pour le développement local :

- **Mode** : `single-node` (développement uniquement)
- **Sécurité** : Désactivée (SSL/Auth désactivés)
- **Port** : 9200 (HTTP API)
- **Port Transport** : 9300 (communication inter-nœuds)
- **Mémoire** : 512MB heap (Xms512m -Xmx512m)

**Configuration de sécurité désactivée :**
- `xpack.security.enabled=false`
- `xpack.security.http.ssl.enabled=false`
- `xpack.security.transport.ssl.enabled=false`
- `xpack.security.enrollment.enabled=false`

⚠️ **Attention** : Cette configuration est uniquement pour le développement. En production, activez la sécurité et configurez SSL/TLS.

### Kibana 8.11.0

Interface web pour visualiser et explorer les données ElasticSearch :

- **Port** : 5601
- **URL** : http://localhost:5601
- **Connexion** : Automatique à ElasticSearch (http://elasticsearch:9200)
- **Sécurité** : Désactivée (correspond à ElasticSearch)

## Utilisation

### Démarrer les services

```bash
docker-compose up -d elasticsearch kibana
```

### Vérifier ElasticSearch

```bash
# Health check
curl http://localhost:9200/_cluster/health

# Lister les index
curl http://localhost:9200/_cat/indices?v
```

### Accéder à Kibana

1. Ouvrir http://localhost:5601 dans votre navigateur
2. Kibana se connecte automatiquement à ElasticSearch
3. Vous pouvez :
   - Explorer les index via "Dev Tools"
   - Créer des visualisations
   - Analyser les données

### Dev Tools dans Kibana

Dans Kibana, allez dans **Dev Tools** (menu de gauche) pour exécuter des requêtes ElasticSearch :

```json
# Vérifier l'index certified_candidates
GET /certified_candidates/_search
{
  "query": {
    "match_all": {}
  }
}

# Compter les documents
GET /certified_candidates/_count

# Voir le mapping
GET /certified_candidates/_mapping
```

## Variables d'environnement

Ajoutez dans votre `.env` :

```env
# ElasticSearch
ELASTICSEARCH_PORT=9200
ELASTICSEARCH_TRANSPORT_PORT=9300

# Kibana
KIBANA_PORT=5601
```

## Index par défaut

Le service `search` crée automatiquement l'index `certified_candidates` au démarrage avec le mapping approprié pour les profils candidats.

## Dépannage

### ElasticSearch ne démarre pas

1. Vérifier les logs : `docker-compose logs elasticsearch`
2. Vérifier les permissions du volume : `docker volume inspect yemma-elasticsearch-data`
3. Augmenter la mémoire si nécessaire : Modifier `ES_JAVA_OPTS` dans docker-compose.yml

### Kibana ne se connecte pas à ElasticSearch

1. Vérifier qu'ElasticSearch est healthy : `docker-compose ps elasticsearch`
2. Vérifier les logs : `docker-compose logs kibana`
3. Vérifier la variable `ELASTICSEARCH_HOSTS` dans Kibana

### Réinitialiser ElasticSearch

```bash
# Supprimer le volume (⚠️ supprime toutes les données)
docker-compose down -v
docker volume rm yemma-elasticsearch-data
docker-compose up -d elasticsearch kibana
```

## Production

Pour la production, activez la sécurité :

1. Générez les certificats SSL
2. Activez `xpack.security.enabled=true`
3. Configurez les utilisateurs et rôles
4. Activez SSL pour HTTP et Transport
5. Configurez Kibana avec les credentials

Consultez la [documentation officielle ElasticSearch](https://www.elastic.co/guide/en/elasticsearch/reference/8.11/security-minimal-setup.html) pour plus de détails.

