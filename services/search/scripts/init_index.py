"""
Script d'initialisation de l'index ElasticSearch pour les candidats

Ce script définit l'index 'candidates' avec le mapping spécifique demandé.
"""
import asyncio
import sys
from pathlib import Path

# Ajouter le répertoire parent au path pour les imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.infrastructure.elasticsearch import es_client
from app.core.config import settings


async def init_candidates_index():
    """
    Initialise l'index 'candidates' avec le mapping spécifique
    
    Mapping :
    - full_name: text
    - title: text (boosté pour la recherche)
    - skills: nested (name: keyword, level: keyword)
    - years_of_experience: integer
    - location: keyword
    - is_verified: boolean
    - summary: text
    """
    await es_client.connect()
    
    index_name = "candidates"
    
    # Vérifier si l'index existe
    exists = await es_client.client.indices.exists(index=index_name)
    
    if exists:
        print(f"Index '{index_name}' existe déjà. Suppression...")
        await es_client.client.indices.delete(index=index_name)
    
    # Définir le mapping
    mapping = {
        "mappings": {
            "properties": {
                "full_name": {
                    "type": "text",
                    "analyzer": "standard",
                    "fields": {
                        "keyword": {
                            "type": "keyword"
                        }
                    }
                },
                "title": {
                    "type": "text",
                    "analyzer": "standard",
                    "boost": 2.0,  # Boost pour la recherche
                    "fields": {
                        "keyword": {
                            "type": "keyword"
                        }
                    }
                },
                "skills": {
                    "type": "nested",
                    "properties": {
                        "name": {
                            "type": "keyword"
                        },
                        "level": {
                            "type": "keyword"
                        }
                    }
                },
                "years_of_experience": {
                    "type": "integer"
                },
                "location": {
                    "type": "keyword"
                },
                "is_verified": {
                    "type": "boolean"
                },
                "summary": {
                    "type": "text",
                    "analyzer": "standard"
                }
            }
        },
        "settings": {
            "number_of_shards": 1,
            "number_of_replicas": 0,  # 0 pour le développement
            "analysis": {
                "analyzer": {
                    "standard": {
                        "type": "standard"
                    }
                }
            }
        }
    }
    
    # Créer l'index avec le mapping
    try:
        await es_client.client.indices.create(
            index=index_name,
            mappings=mapping["mappings"],
            settings=mapping["settings"]
        )
        print(f"✅ Index '{index_name}' créé avec succès!")
        print("\nMapping défini:")
        print(f"  - full_name: text")
        print(f"  - title: text (boost: 2.0)")
        print(f"  - skills: nested (name: keyword, level: keyword)")
        print(f"  - years_of_experience: integer")
        print(f"  - location: keyword")
        print(f"  - is_verified: boolean")
        print(f"  - summary: text")
        
        # Afficher le mapping créé
        mapping_info = await es_client.client.indices.get_mapping(index=index_name)
        print(f"\n📋 Mapping complet:")
        print(mapping_info)
        
    except Exception as e:
        print(f"❌ Erreur lors de la création de l'index: {str(e)}")
        raise
    
    finally:
        await es_client.disconnect()


async def main():
    """Point d'entrée principal"""
    print("🚀 Initialisation de l'index ElasticSearch 'candidates'...")
    print(f"📍 Connexion à ElasticSearch: {settings.ELASTICSEARCH_HOST}:{settings.ELASTICSEARCH_PORT}")
    print()
    
    try:
        await init_candidates_index()
    except Exception as e:
        print(f"\n❌ Erreur: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())

