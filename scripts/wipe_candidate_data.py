#!/usr/bin/env python3
"""
Script de développement : efface les données candidats pour les tests.

⚠️  S'exécute UNIQUEMENT si APP_ENV=development.

Usage:
  Depuis la racine du projet :
    python scripts/wipe_candidate_data.py
    python scripts/wipe_candidate_data.py --with-users     # Supprime aussi les comptes candidats (auth)
    python scripts/wipe_candidate_data.py --with-es      # Vide l'index Elasticsearch certified_candidates
    python scripts/wipe_candidate_data.py --all           # --with-users + --with-es

Prérequis:
  - .env à la racine avec DB_USER, DB_PASSWORD, DB_NAME, DB_HOST, DB_PORT
  - Pour --with-es : ELASTICSEARCH_HOST, ELASTICSEARCH_PORT dans .env
"""
import asyncio
import os
import sys
from pathlib import Path

# Charger .env depuis la racine du projet
project_root = Path(__file__).resolve().parent.parent
env_path = project_root / ".env"
if env_path.exists():
    from dotenv import load_dotenv
    load_dotenv(env_path)
else:
    print("⚠️  Fichier .env non trouvé à la racine du projet.")
    sys.exit(1)

# Vérifier APP_ENV=development
if os.getenv("APP_ENV", "development") != "development":
    print("❌ Ce script ne s'exécute qu'en mode développement (APP_ENV=development).")
    sys.exit(1)

# Configuration DB (connexion depuis la machine hôte vers Docker)
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5433")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")
DB_NAME = os.getenv("DB_NAME", "yemma_db")


def get_db_url():
    """URL de connexion asyncpg."""
    return f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"


async def wipe_candidate_data(with_users: bool = False, with_es: bool = False):
    """Efface les données candidats dans l'ordre des contraintes FK."""
    import asyncpg

    db_url = get_db_url()
    conn = await asyncpg.connect(db_url)

    stats = {}

    try:
        # 1. Documents (candidate_id -> profile.id)
        r = await conn.execute("DELETE FROM documents")
        stats["documents"] = int(r.split()[-1]) if r else 0
        print(f"  ✓ documents: {stats['documents']} supprimés")

        # 2. Tables liées aux profils (profile_id -> profile.id)
        for table in ["job_preferences", "skills", "certifications", "educations", "experiences"]:
            try:
                r = await conn.execute(f"DELETE FROM {table}")
                stats[table] = int(r.split()[-1]) if r else 0
                print(f"  ✓ {table}: {stats[table]} supprimés")
            except Exception as e:
                print(f"  ⚠ {table}: {e}")
                stats[table] = 0

        # 3. Profils
        r = await conn.execute("DELETE FROM profiles")
        stats["profiles"] = int(r.split()[-1]) if r else 0
        print(f"  ✓ profiles: {stats['profiles']} supprimés")

        # 4. Optionnel : utilisateurs candidats (auth)
        if with_users:
            # Récupérer l'id du rôle ROLE_CANDIDAT
            role_row = await conn.fetchrow(
                "SELECT id FROM roles WHERE name = 'ROLE_CANDIDAT'"
            )
            if role_row:
                role_id = role_row["id"]
                # IDs des users avec ce rôle
                user_ids = await conn.fetch(
                    "SELECT user_id FROM user_roles WHERE role_id = $1", role_id
                )
                uids = [r["user_id"] for r in user_ids]
                if uids:
                    await conn.execute("DELETE FROM refresh_tokens WHERE user_id = ANY($1)", uids)
                    await conn.execute("DELETE FROM user_roles WHERE user_id = ANY($1)", uids)
                    r = await conn.execute("DELETE FROM users WHERE id = ANY($1)", uids)
                    stats["users"] = len(uids)
                    print(f"  ✓ users (candidats): {stats['users']} supprimés")
                else:
                    stats["users"] = 0
                    print(f"  ✓ users (candidats): 0 (aucun trouvé)")
            else:
                stats["users"] = 0
                print(f"  ⚠ Rôle ROLE_CANDIDAT non trouvé, aucun user supprimé")

        await conn.close()
    except Exception as e:
        await conn.close()
        raise e

    # 5. Optionnel : vider l'index Elasticsearch
    if with_es:
        await clear_elasticsearch_index(stats)

    return stats


async def clear_elasticsearch_index(stats: dict):
    """Vide l'index certified_candidates dans Elasticsearch."""
    host = os.getenv("ELASTICSEARCH_HOST", "localhost")
    port = os.getenv("ELASTICSEARCH_PORT", "9200")
    index = os.getenv("ELASTICSEARCH_INDEX_NAME", "certified_candidates")
    url = f"http://{host}:{port}/{index}"

    try:
        import httpx
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.delete(url)
            if resp.status_code in (200, 404):
                stats["elasticsearch"] = "index vidé ou supprimé"
                print(f"  ✓ elasticsearch: index '{index}' vidé")
            else:
                stats["elasticsearch"] = f"erreur {resp.status_code}"
                print(f"  ⚠ elasticsearch: {resp.status_code} - {resp.text[:200]}")
    except ImportError:
        print("  ⚠ httpx non disponible, skip Elasticsearch")
        stats["elasticsearch"] = "skip (httpx manquant)"
    except Exception as e:
        print(f"  ⚠ elasticsearch: {e}")
        stats["elasticsearch"] = str(e)


async def main():
    import argparse
    parser = argparse.ArgumentParser(
        description="Efface les données candidats (dev uniquement)"
    )
    parser.add_argument(
        "--with-users",
        action="store_true",
        help="Supprime aussi les comptes candidats (users, user_roles, refresh_tokens)",
    )
    parser.add_argument(
        "--with-es",
        action="store_true",
        help="Vide l'index Elasticsearch certified_candidates",
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Équivalent à --with-users --with-es",
    )
    parser.add_argument(
        "-y", "--yes",
        action="store_true",
        help="Confirmer sans demander",
    )
    args = parser.parse_args()

    with_users = args.with_users or args.all
    with_es = args.with_es or args.all

    print("🗑  Effacement des données candidats (mode développement)")
    print(f"   DB: {DB_HOST}:{DB_PORT}/{DB_NAME}")
    if with_users:
        print("   + Comptes candidats (auth)")
    if with_es:
        print("   + Index Elasticsearch certified_candidates")
    print()

    if not args.yes:
        confirm = input("Continuer ? [y/N] ").strip().lower()
        if confirm not in ("y", "yes"):
            print("Annulé.")
            sys.exit(0)

    try:
        stats = await wipe_candidate_data(with_users=with_users, with_es=with_es)
        total = sum(
            v for v in stats.values()
            if isinstance(v, int)
        )
        print()
        print(f"✅ Terminé. {total} enregistrements supprimés.")
    except Exception as e:
        print(f"\n❌ Erreur: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
