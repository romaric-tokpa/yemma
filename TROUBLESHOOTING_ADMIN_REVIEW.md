# Dépannage - Erreur de connexion Admin Review

## Problème
Erreur réseau lors de l'accès à `/admin/review/{id}` : "Impossible de se connecter au serveur".

## Vérifications à effectuer

### 1. Vérifier que tous les services sont démarrés

```bash
docker-compose ps
```

Vérifiez que les services suivants sont `Up` :
- `nginx` (port 80)
- `candidate` (port 8002)
- `frontend` (port 3000)
- `postgres`
- `redis`

### 2. Vérifier les logs du service candidate

```bash
docker-compose logs candidate --tail=100
```

Recherchez :
- Erreurs de démarrage
- Erreurs de connexion à la base de données
- Erreurs de validation de schémas

### 3. Vérifier que nginx peut joindre le service candidate

```bash
docker-compose exec nginx curl -I http://candidate:8000/health
```

Cela devrait retourner `HTTP/1.1 200 OK`.

### 4. Vérifier que nginx est accessible depuis le navigateur

```bash
curl -I http://localhost/health
```

Cela devrait retourner `HTTP/1.1 200 OK`.

### 5. Tester l'endpoint directement depuis le conteneur candidate

```bash
docker-compose exec candidate curl http://localhost:8000/health
```

### 6. Redémarrer les services si nécessaire

```bash
# Redémarrer le service candidate
docker-compose restart candidate

# Ou redémarrer tous les services
docker-compose restart
```

### 7. Vérifier la configuration réseau Docker

```bash
docker network inspect yemma_yemma-network | grep -A 5 candidate
```

## Solutions courantes

### Solution 1 : Service candidate non démarré

Si le service candidate n'est pas démarré :

```bash
docker-compose up -d candidate
docker-compose logs -f candidate
```

Attendez que les logs montrent que le service est prêt (message "Application startup complete").

### Solution 2 : Problème de dépendances

Si le service candidate ne démarre pas à cause de dépendances :

```bash
docker-compose up -d postgres redis auth
# Attendez que ces services soient healthy
docker-compose up -d candidate
```

### Solution 3 : Erreur de validation dans le code

Si vous voyez des erreurs de validation Pydantic dans les logs, cela signifie que le code backend a un problème. Vérifiez les logs pour identifier l'erreur exacte.

### Solution 4 : Problème de réseau Docker

Si nginx ne peut pas joindre candidate :

```bash
# Reconstruire les réseaux
docker-compose down
docker-compose up -d
```

## Vérification finale

Une fois les services démarrés, testez l'endpoint depuis le navigateur :

```bash
# Dans la console du navigateur (F12 > Console)
fetch('http://localhost/api/v1/profiles/1', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
  }
}).then(r => r.json()).then(console.log).catch(console.error)
```

Si cela fonctionne, l'API est accessible. Si cela échoue, vérifiez :
- Le token JWT dans `localStorage`
- La configuration CORS
- Les logs nginx : `docker-compose logs nginx --tail=50`
