"""
Configuration et gestion d'ElasticSearch
"""
from elasticsearch import AsyncElasticsearch
from typing import Optional, Dict, Any

from app.core.config import settings
from app.core.exceptions import ElasticsearchError


class ElasticsearchClient:
    """Client ElasticSearch"""
    
    def __init__(self):
        self.client: Optional[AsyncElasticsearch] = None
        self.index_name = settings.ELASTICSEARCH_INDEX_NAME
    
    def _create_client(self) -> AsyncElasticsearch:
        """Crée le client ElasticSearch"""
        # Construire l'URL avec le bon schéma (http ou https)
        scheme = "https" if settings.ELASTICSEARCH_USE_SSL else "http"
        host_url = f"{scheme}://{settings.ELASTICSEARCH_HOST}:{settings.ELASTICSEARCH_PORT}"
        
        config = {
            "hosts": [host_url],
        }
        
        # Configuration SSL/TLS pour Elasticsearch 8.x
        # La vérification des certificats est gérée via urllib3 si nécessaire
        if settings.ELASTICSEARCH_USE_SSL and not settings.ELASTICSEARCH_VERIFY_CERTS:
            import urllib3
            urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
        
        # Authentification basique si fournie
        if settings.ELASTICSEARCH_USER and settings.ELASTICSEARCH_PASSWORD:
            config["basic_auth"] = (
                settings.ELASTICSEARCH_USER,
                settings.ELASTICSEARCH_PASSWORD
            )
        
        return AsyncElasticsearch(**config)
    
    async def connect(self):
        """Connecte le client"""
        if not self.client:
            self.client = self._create_client()
    
    async def disconnect(self):
        """Déconnecte le client"""
        if self.client:
            await self.client.close()
            self.client = None
    
    async def create_index_if_not_exists(self):
        """Crée l'index s'il n'existe pas"""
        await self.connect()
        
        # Vérifier si l'index existe
        exists = await self.client.indices.exists(index=self.index_name)
        
        if not exists:
            # Mapping pour l'index
            mapping = {
                "mappings": {
                    "properties": {
                        "candidate_id": {"type": "integer"},
                        "full_name": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                        "title": {
                            "type": "text",
                            "analyzer": "french",
                            "fields": {
                                "keyword": {"type": "keyword"}
                            }
                        },
                        "summary": {
                            "type": "text",
                            "analyzer": "french"
                        },
                        "location": {"type": "keyword"},
                        "years_of_experience": {"type": "integer"},
                        "is_verified": {"type": "boolean"},
                        # Champs de compatibilité (anciens noms)
                        "profile_title": {
                            "type": "text",
                            "analyzer": "french",
                            "fields": {
                                "keyword": {"type": "keyword"}
                            }
                        },
                        "professional_summary": {
                            "type": "text",
                            "analyzer": "french"
                        },
                        "first_name": {"type": "keyword"},
                        "last_name": {"type": "keyword"},
                        "email": {"type": "keyword"},
                        "sector": {
                            "type": "keyword"
                        },
                        "main_job": {
                            "type": "text",
                            "fields": {
                                "keyword": {"type": "keyword"}
                            }
                        },
                        "total_experience": {"type": "integer"},
                        "admin_score": {"type": "float"},
                        "skills": {
                            "type": "nested",
                            "properties": {
                                "name": {
                                    "type": "text",
                                    "analyzer": "french",
                                    "fields": {
                                        "keyword": {"type": "keyword"}
                                    }
                                },
                                "level": {"type": "keyword"},
                                "years_of_practice": {"type": "integer"}
                            }
                        },
                        "experiences": {
                            "type": "nested",
                            "properties": {
                                "position": {"type": "text"},
                                "company_name": {"type": "keyword"},
                                "start_date": {"type": "date"},
                                "end_date": {"type": "date"},
                                "is_current": {"type": "boolean"}
                            }
                        },
                        "educations": {
                            "type": "nested",
                            "properties": {
                                "diploma": {"type": "text"},
                                "institution": {"type": "keyword"},
                                "level": {"type": "keyword"},
                                "graduation_year": {"type": "integer"}
                            }
                        },
                        "languages": {
                            "type": "nested",
                            "properties": {
                                "name": {"type": "keyword"},
                                "level": {"type": "keyword"}
                            }
                        },
                        "desired_positions": {
                            "type": "keyword"
                        },
                        "contract_type": {"type": "keyword"},
                        "desired_location": {"type": "keyword"},
                        "availability": {"type": "keyword"},
                        "salary_expectations": {"type": "integer"},
                        "status": {"type": "keyword"},
                        "created_at": {"type": "date"},
                        "validated_at": {"type": "date"}
                    }
                },
                "settings": {
                    "analysis": {
                        "analyzer": {
                            "french": {
                                "type": "standard",
                                "stopwords": "_french_"
                            }
                        }
                    }
                }
            }
            
            # Pour ElasticSearch 8.x, on passe directement les paramètres
            await self.client.indices.create(
                index=self.index_name,
                mappings=mapping["mappings"],
                settings=mapping["settings"]
            )
    
    async def index_document(self, document: Dict[str, Any], document_id: Optional[str] = None) -> bool:
        """Indexe un document"""
        await self.connect()
        
        try:
            await self.client.index(
                index=self.index_name,
                id=document_id or str(document.get("candidate_id")),
                document=document
            )
            return True
        except Exception as e:
            raise ElasticsearchError(f"Failed to index document: {str(e)}")
    
    async def delete_document(self, document_id: str) -> bool:
        """Supprime un document de l'index"""
        await self.connect()
        
        try:
            await self.client.delete(
                index=self.index_name,
                id=document_id
            )
            return True
        except Exception as e:
            raise ElasticsearchError(f"Failed to delete document: {str(e)}")
    
    async def search(self, query: Dict[str, Any]) -> Dict[str, Any]:
        """Effectue une recherche"""
        await self.connect()
        
        try:
            # Extraire les paramètres de la requête
            es_query = query.get("query", {})
            aggs = query.get("aggs")
            from_param = query.get("from", 0)
            size = query.get("size", 20)
            sort = query.get("sort", [])
            
            # Construire les paramètres de recherche
            search_params = {
                "index": self.index_name,
                "query": es_query,
                "from_": from_param,
                "size": size,
            }
            
            if aggs:
                search_params["aggs"] = aggs
            
            if sort:
                search_params["sort"] = sort
            
            result = await self.client.search(**search_params)
            return result
        except Exception as e:
            raise ElasticsearchError(f"Search failed: {str(e)}")


# Instance globale
es_client = ElasticsearchClient()


async def init_elasticsearch():
    """Initialise ElasticSearch (crée l'index si nécessaire)"""
    await es_client.create_index_if_not_exists()

