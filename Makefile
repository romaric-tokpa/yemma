.PHONY: help up down restart logs ps build clean init-env start-backend

# Variables
# Utiliser docker-compose.yml à la racine si disponible, sinon docker/docker-compose.yml
COMPOSE_FILE = $(shell if [ -f docker-compose.yml ]; then echo docker-compose.yml; else echo docker/docker-compose.yml; fi)
ENV_FILE = .env

help: ## Affiche cette aide
	@echo "Commandes disponibles :"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

init-env: ## Initialise le fichier .env depuis env.example
	@if [ ! -f $(ENV_FILE) ]; then \
		cp env.example $(ENV_FILE); \
		echo "✅ Fichier .env créé depuis env.example"; \
		echo "⚠️  N'oubliez pas de modifier les mots de passe et clés secrètes !"; \
	else \
		echo "⚠️  Le fichier .env existe déjà"; \
	fi

up: ## Démarre tous les services
	@docker-compose -f $(COMPOSE_FILE) up -d
	@echo "✅ Services démarrés"
	@echo "📊 Vérifiez l'état avec: make ps"

down: ## Arrête tous les services
	@docker-compose -f $(COMPOSE_FILE) down
	@echo "✅ Services arrêtés"

restart: ## Redémarre tous les services
	@docker-compose -f $(COMPOSE_FILE) restart
	@echo "✅ Services redémarrés"

logs: ## Affiche les logs de tous les services
	@docker-compose -f $(COMPOSE_FILE) logs -f

logs-auth: ## Affiche les logs du service auth
	@docker-compose -f $(COMPOSE_FILE) logs -f auth-service

logs-candidate: ## Affiche les logs du service candidate
	@docker-compose -f $(COMPOSE_FILE) logs -f candidate-service

logs-admin: ## Affiche les logs du service admin
	@docker-compose -f $(COMPOSE_FILE) logs -f admin-service

logs-document: ## Affiche les logs du service document
	@docker-compose -f $(COMPOSE_FILE) logs -f document-service

ps: ## Affiche l'état des services
	@docker-compose -f $(COMPOSE_FILE) ps

build: ## Rebuild toutes les images
	@docker-compose -f $(COMPOSE_FILE) build --no-cache
	@echo "✅ Images rebuildées"

build-up: ## Build et démarre les services
	@docker-compose -f $(COMPOSE_FILE) up -d --build
	@echo "✅ Services buildés et démarrés"

clean: ## Arrête et supprime les conteneurs, réseaux (garde les volumes)
	@docker-compose -f $(COMPOSE_FILE) down
	@echo "✅ Nettoyage effectué (volumes conservés)"

clean-all: ## Arrête et supprime tout (conteneurs, réseaux, volumes) ⚠️
	@docker-compose -f $(COMPOSE_FILE) down -v
	@echo "⚠️  Tout a été supprimé (y compris les volumes de données)"

shell-auth: ## Ouvre un shell dans le conteneur auth-service
	@docker-compose -f $(COMPOSE_FILE) exec auth-service /bin/bash

shell-candidate: ## Ouvre un shell dans le conteneur candidate-service
	@docker-compose -f $(COMPOSE_FILE) exec candidate-service /bin/bash

shell-admin: ## Ouvre un shell dans le conteneur admin-service
	@docker-compose -f $(COMPOSE_FILE) exec admin-service /bin/bash

shell-document: ## Ouvre un shell dans le conteneur document-service
	@docker-compose -f $(COMPOSE_FILE) exec document-service /bin/bash

migrate-auth: ## Exécute les migrations pour auth-service
	@docker-compose -f $(COMPOSE_FILE) exec auth-service alembic upgrade head

migrate-candidate: ## Exécute les migrations pour candidate-service
	@docker-compose -f $(COMPOSE_FILE) exec candidate-service alembic upgrade head

migrate-admin: ## Exécute les migrations pour admin-service
	@docker-compose -f $(COMPOSE_FILE) exec admin-service alembic upgrade head

migrate-all: ## Exécute les migrations pour tous les services
	@make migrate-auth
	@make migrate-candidate
	@make migrate-admin

health: ## Vérifie l'état de santé de tous les services
	@echo "🔍 Vérification de l'état des services..."
	@docker-compose -f $(COMPOSE_FILE) ps

volumes: ## Liste les volumes Docker
	@docker volume ls | grep yemma

stats: ## Affiche les statistiques d'utilisation des ressources
	@docker stats --no-stream

# URLs d'accès
start-backend: ## Démarre tous les services backend par étapes
	@./scripts/start-services.sh

urls: ## Affiche les URLs d'accès aux services
	@echo "📡 URLs des services :"
	@echo "  Frontend:          http://localhost:3000"
	@echo "  Auth Service:      http://localhost:8001/docs"
	@echo "  Candidate Service: http://localhost:8002/docs"
	@echo "  Admin Service:     http://localhost:8009/docs"
	@echo "  Document Service:  http://localhost:8003/docs"
	@echo "  Search Service:    http://localhost:8004/docs"
	@echo "  Company Service:   http://localhost:8005/docs"
	@echo "  Payment Service:   http://localhost:8006/docs"
	@echo "  Notification:      http://localhost:8007/docs"
	@echo "  Audit Service:     http://localhost:8008/docs"
	@echo ""
	@echo "🔧 Interfaces d'administration :"
	@echo "  MinIO Console:     http://localhost:9001 (minioadmin/minioadmin123)"
	@echo "  Kibana:            http://localhost:5601"
	@echo "  ElasticSearch:     http://localhost:9200"

