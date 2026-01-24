# 🔧 Guide de Dépannage Docker Compose - Yemma Solutions

## Problème : PostgreSQL ne démarre pas

### Symptômes
```
Container yemma-postgres Error
dependency failed to start: container yemma-postgres exited (1)
```

### Solutions

#### 1. Vérifier les logs PostgreSQL

```bash
docker-compose logs postgres
```

Ou pour voir les logs en temps réel :
```bash
docker-compose logs -f postgres
```

#### 2. Vérifier les variables d'environnement

Assurez-vous qu'un fichier `.env` existe à la racine du projet. Si ce n'est pas le cas :

```bash
cp env.example .env
```

Vérifiez que les variables suivantes sont définies dans `.env` :
```bash
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=yemma_db
```

#### 3. Nettoyer et redémarrer

**Option A : Nettoyage complet (supprime toutes les données)**
```bash
# Arrêter tous les conteneurs
docker-compose down

# Supprimer les volumes (ATTENTION: supprime toutes les données)
docker-compose down -v

# Redémarrer
docker-compose up -d
```

**Option B : Nettoyage partiel (conserve les données)**
```bash
# Arrêter tous les conteneurs
docker-compose down

# Supprimer uniquement le conteneur PostgreSQL
docker rm -f yemma-postgres

# Supprimer le volume PostgreSQL (ATTENTION: supprime les données)
docker volume rm yemma-postgres-data

# Redémarrer
docker-compose up -d postgres
```

#### 4. Vérifier les permissions du volume

Si vous êtes sur Linux, vérifiez les permissions :

```bash
# Vérifier le volume
docker volume inspect yemma-postgres-data

# Si nécessaire, corriger les permissions
sudo chown -R 999:999 /var/lib/docker/volumes/yemma-postgres-data/_data
```

#### 5. Vérifier les ports utilisés

PostgreSQL utilise le port 5432 en interne. Vérifiez qu'aucun autre service ne l'utilise :

```bash
# Sur macOS/Linux
lsof -i :5432

# Si un processus utilise le port, arrêtez-le ou changez le port dans docker-compose.yml
```

#### 6. Vérifier l'espace disque

PostgreSQL nécessite de l'espace disque. Vérifiez :

```bash
df -h
```

#### 7. Démarrer PostgreSQL seul pour diagnostiquer

```bash
# Démarrer uniquement PostgreSQL
docker-compose up -d postgres

# Suivre les logs
docker-compose logs -f postgres

# Vérifier le statut
docker-compose ps postgres
```

#### 8. Réinitialiser complètement PostgreSQL

Si rien ne fonctionne, réinitialisez complètement :

```bash
# Arrêter tous les services
docker-compose down

# Supprimer le conteneur et le volume
docker rm -f yemma-postgres
docker volume rm yemma-postgres-data

# Recréer le volume
docker volume create yemma-postgres-data

# Redémarrer
docker-compose up -d postgres
```

### Erreurs courantes

#### Erreur : "permission denied"
**Solution** : Vérifiez les permissions du volume Docker
```bash
sudo chown -R $USER:$USER ~/.docker
```

#### Erreur : "port already in use"
**Solution** : Arrêtez le service qui utilise le port ou changez le port dans docker-compose.yml

#### Erreur : "database files are incompatible"
**Solution** : Supprimez le volume et recréez-le
```bash
docker volume rm yemma-postgres-data
docker-compose up -d postgres
```

#### Erreur : "could not connect to server"
**Solution** : Attendez que PostgreSQL soit complètement démarré (peut prendre 10-30 secondes)

### Vérification que PostgreSQL fonctionne

Une fois PostgreSQL démarré, vérifiez :

```bash
# Vérifier que le conteneur est en cours d'exécution
docker ps | grep yemma-postgres

# Vérifier les logs (devrait voir "database system is ready")
docker-compose logs postgres | grep "ready"

# Tester la connexion
docker-compose exec postgres psql -U postgres -d yemma_db -c "SELECT version();"
```

### Commandes utiles

```bash
# Voir tous les conteneurs Yemma
docker ps -a | grep yemma

# Voir tous les volumes Yemma
docker volume ls | grep yemma

# Voir l'utilisation des ressources
docker stats yemma-postgres

# Entrer dans le conteneur PostgreSQL
docker-compose exec postgres sh

# Accéder à la base de données
docker-compose exec postgres psql -U postgres -d yemma_db
```

### Support supplémentaire

Si le problème persiste :

1. Vérifiez la version de Docker et Docker Compose :
   ```bash
   docker --version
   docker-compose --version
   ```

2. Vérifiez les logs système Docker :
   ```bash
   # Sur macOS
   cat ~/Library/Containers/com.docker.docker/Data/log/vm/dockerd.log | tail -50
   ```

3. Redémarrez Docker Desktop (macOS/Windows) ou le service Docker (Linux)

4. Vérifiez les ressources allouées à Docker (mémoire, CPU)
