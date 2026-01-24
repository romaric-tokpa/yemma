# 🔧 Dépannage : Erreurs I/O Docker (input/output error)

## Problème identifié

Vous rencontrez des erreurs `input/output error` sur Docker Desktop, ce qui indique un problème au niveau du système de fichiers de Docker, pas seulement avec PostgreSQL.

### Symptômes observés :
```
Error response from daemon: write /var/lib/desktop-containerd/daemon/io.containerd.metadata.v1.bolt/meta.db: input/output error
```

## Solutions (par ordre de priorité)

### Solution 1 : Redémarrer Docker Desktop (le plus simple)

1. **Quitter complètement Docker Desktop** :
   - Cliquez sur l'icône Docker dans la barre de menu
   - Sélectionnez "Quit Docker Desktop"
   - Attendez que Docker se ferme complètement

2. **Redémarrer Docker Desktop** :
   - Ouvrez Docker Desktop depuis Applications
   - Attendez qu'il démarre complètement (icône Docker stable)

3. **Réessayer** :
   ```bash
   docker-compose down
   docker-compose up -d postgres
   ```

### Solution 2 : Nettoyer Docker (si Solution 1 ne fonctionne pas)

```bash
# 1. Arrêter Docker Desktop complètement

# 2. Nettoyer les conteneurs orphelins
docker container prune -f

# 3. Nettoyer les images non utilisées
docker image prune -a -f

# 4. Nettoyer les volumes non utilisés (ATTENTION: supprime les données)
docker volume prune -f

# 5. Redémarrer Docker Desktop

# 6. Réessayer
docker-compose up -d postgres
```

### Solution 3 : Réinitialiser Docker Desktop (si Solution 2 ne fonctionne pas)

⚠️ **ATTENTION** : Cela supprimera TOUTES vos données Docker (conteneurs, images, volumes)

1. **Ouvrir Docker Desktop**
2. **Aller dans Settings (⚙️)**
3. **Trouver "Troubleshoot" ou "Dépannage"**
4. **Cliquer sur "Clean / Purge data" ou "Réinitialiser"**
5. **Confirmer la réinitialisation**
6. **Redémarrer Docker Desktop**

### Solution 4 : Vérifier l'espace disque

Les erreurs I/O peuvent être causées par un disque plein :

```bash
# Vérifier l'espace disque disponible
df -h

# Vérifier l'espace utilisé par Docker
docker system df
```

Si le disque est plein :
- Libérer de l'espace
- Nettoyer Docker : `docker system prune -a --volumes -f`

### Solution 5 : Forcer l'arrêt du conteneur PostgreSQL

Si le conteneur est bloqué et ne peut pas être supprimé :

```bash
# 1. Arrêter Docker Desktop

# 2. Redémarrer Docker Desktop

# 3. Forcer l'arrêt du conteneur
docker kill yemma-postgres 2>/dev/null || true
docker rm -f yemma-postgres 2>/dev/null || true

# 4. Supprimer le volume (si le conteneur est supprimé)
docker volume rm yemma-postgres-data 2>/dev/null || true

# 5. Redémarrer
docker-compose up -d postgres
```

### Solution 6 : Réparer Docker Desktop (macOS)

Si rien ne fonctionne, réinstallez Docker Desktop :

1. **Désinstaller Docker Desktop** :
   ```bash
   # Supprimer l'application
   rm -rf /Applications/Docker.app
   
   # Supprimer les données utilisateur (optionnel, mais recommandé)
   rm -rf ~/Library/Containers/com.docker.docker
   rm -rf ~/Library/Application\ Support/Docker\ Desktop
   rm -rf ~/Library/Group\ Containers/group.com.docker
   ```

2. **Télécharger et réinstaller Docker Desktop** depuis [docker.com](https://www.docker.com/products/docker-desktop)

3. **Redémarrer votre Mac** (recommandé)

4. **Réessayer** :
   ```bash
   docker-compose up -d postgres
   ```

## Solution rapide recommandée

Essayez dans cet ordre :

```bash
# 1. Redémarrer Docker Desktop (via l'interface graphique)

# 2. Une fois Docker redémarré, nettoyer
docker system prune -f

# 3. Forcer l'arrêt de tous les conteneurs Yemma
docker ps -a --filter "name=yemma" --format "{{.ID}}" | xargs -r docker kill 2>/dev/null || true
docker ps -a --filter "name=yemma" --format "{{.ID}}" | xargs -r docker rm -f 2>/dev/null || true

# 4. Supprimer les volumes (ATTENTION: supprime les données)
docker volume ls --filter "name=yemma" --format "{{.Name}}" | xargs -r docker volume rm 2>/dev/null || true

# 5. Redémarrer proprement
docker-compose up -d postgres
```

## Vérification après correction

Une fois Docker fonctionnel, vérifiez :

```bash
# Vérifier que Docker fonctionne
docker ps

# Vérifier que PostgreSQL démarre
docker-compose up -d postgres
docker-compose logs -f postgres

# Vérifier la santé
docker-compose ps postgres
```

## Prévention

Pour éviter ce problème à l'avenir :

1. **Nettoyer régulièrement Docker** :
   ```bash
   docker system prune -f
   ```

2. **Surveiller l'espace disque** :
   ```bash
   docker system df
   ```

3. **Arrêter proprement les conteneurs** :
   ```bash
   docker-compose down
   ```

4. **Mettre à jour Docker Desktop régulièrement**

## Support supplémentaire

Si le problème persiste après avoir essayé toutes les solutions :

1. **Vérifier les logs Docker** :
   - macOS : `~/Library/Containers/com.docker.docker/Data/log/vm/dockerd.log`

2. **Vérifier les permissions** :
   ```bash
   ls -la ~/Library/Containers/com.docker.docker/
   ```

3. **Contacter le support Docker** ou consulter les forums Docker
