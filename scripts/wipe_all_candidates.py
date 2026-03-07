#!/usr/bin/env python3
"""
Script : efface TOUTES les données des candidats inscrits, y compris leurs comptes.

⚠️  DANGER : Suppression irréversible. S'exécute UNIQUEMENT si APP_ENV=development.

Ce qui est supprimé :
  - Comptes utilisateurs (auth) : users, user_roles, refresh_tokens des candidats
  - Profils candidats : profiles, experiences, educations, certifications, skills, job_preferences
  - Candidatures : applications
  - Documents : documents (CV, attestations, etc.)
  - Logs d'accès : access_logs (audit RGPD)
  - Index Elasticsearch : certified_candidates (optionnel)

Usage:
  Depuis la racine du projet :
    python scripts/wipe_all_candidates.py
    python scripts/wipe_all_candidates.py -y              # Sans confirmation
    python scripts/wipe_all_candidates.py --no-es        # Sans vider Elasticsearch
    python scripts/wipe_all_candidates.py --no-users    # Garder les comptes (supprimer uniquement les données)

Prérequis:
  - .env à la racine avec les variables DB_*
  - Pour Docker local (docker-compose.override) : les ports par défaut sont 5441 (auth),
    5442 (candidate), 5445 (document), 5446 (logs). Vérifier POSTGRES_*_PORT si besoin.
  - Si toutes les tables sont dans une seule base : utiliser --unified-db
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

# Configuration des bases de données (multi-service)
DB_HOST = os.getenv("DB_HOST", "localhost")

# Auth (users, roles, user_roles, refresh_tokens)
AUTH_DB = {
    "host": os.getenv("DB_AUTH_HOST", DB_HOST),
    "port": int(os.getenv("POSTGRES_AUTH_PORT", os.getenv("DB_AUTH_PORT", "5441"))),
    "user": os.getenv("DB_AUTH_USER", os.getenv("DB_USER", "postgres")),
    "password": os.getenv("DB_AUTH_PASSWORD", os.getenv("DB_PASSWORD", "postgres")),
    "name": os.getenv("DB_AUTH_NAME", "auth_db"),
}

# Candidate (profiles, experiences, educations, certifications, skills, job_preferences, applications)
CANDIDATE_DB = {
    "host": os.getenv("DB_CANDIDATE_HOST", DB_HOST),
    "port": int(os.getenv("POSTGRES_CANDIDATE_PORT", os.getenv("DB_CANDIDATE_PORT", "5442"))),
    "user": os.getenv("DB_CANDIDATE_USER", os.getenv("DB_USER", "postgres")),
    "password": os.getenv("DB_CANDIDATE_PASSWORD", os.getenv("DB_PASSWORD", "postgres")),
    "name": os.getenv("DB_CANDIDATE_NAME", "candidate_db"),
}

# Document (documents - CV, attestations, etc.)
DOCUMENT_DB = {
    "host": os.getenv("DB_DOCUMENT_HOST", DB_HOST),
    "port": int(os.getenv("POSTGRES_DOCUMENT_PORT", os.getenv("DB_DOCUMENT_PORT", "5445"))),
    "user": os.getenv("DB_DOCUMENT_USER", os.getenv("DB_USER", "postgres")),
    "password": os.getenv("DB_DOCUMENT_PASSWORD", os.getenv("DB_PASSWORD", "postgres")),
    "name": os.getenv("DB_DOCUMENT_NAME", "document_db"),
}

# Logs / Audit (access_logs)
LOGS_DB = {
    "host": os.getenv("DB_LOGS_HOST", DB_HOST),
    "port": int(os.getenv("POSTGRES_LOGS_PORT", os.getenv("DB_LOGS_PORT", "5446"))),
    "user": os.getenv("DB_LOGS_USER", os.getenv("DB_USER", "postgres")),
    "password": os.getenv("DB_LOGS_PASSWORD", os.getenv("DB_PASSWORD", "postgres")),
    "name": os.getenv("DB_LOGS_NAME", "logs_db"),
}

# Mode base unique (legacy) : DB_HOST, DB_PORT, DB_NAME pour tout
UNIFIED_DB = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", "5433")),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "postgres"),
    "name": os.getenv("DB_NAME", "yemma_db"),
}


def get_db_url(config: dict) -> str:
    return f"postgresql://{config['user']}:{config['password']}@{config['host']}:{config['port']}/{config['name']}"


async def wipe_all_candidates(with_users: bool = True, with_es: bool = True, unified_db: bool = False) -> dict:
    """Efface toutes les données candidats dans l'ordre des contraintes FK."""
    import asyncpg

    stats = {}
    db_config = UNIFIED_DB if unified_db else CANDIDATE_DB
    candidate_url = get_db_url(db_config)
    try:
        conn_cand = await asyncpg.connect(candidate_url)
        profile_ids = await conn_cand.fetch("SELECT id FROM profiles")
        profile_id_list = [r["id"] for r in profile_ids]
        await conn_cand.close()
    except Exception as e:
        print(f"  ⚠ Impossible de se connecter à candidate_db ({CANDIDATE_DB['host']}:{CANDIDATE_DB['port']}): {e}")
        profile_id_list = []

    # 2. Documents (document_db) - candidate_id = profile.id
    doc_config = UNIFIED_DB if unified_db else DOCUMENT_DB
    if profile_id_list:
        try:
            doc_url = get_db_url(doc_config)
            conn_doc = await asyncpg.connect(doc_url)
            r = await conn_doc.execute(
                "DELETE FROM documents WHERE candidate_id = ANY($1)",
                profile_id_list,
            )
            stats["documents"] = int(r.split()[-1]) if r else 0
            await conn_doc.close()
            print(f"  ✓ documents: {stats['documents']} supprimés")
        except Exception as e:
            print(f"  ⚠ documents: {e}")
            stats["documents"] = 0
    else:
        try:
            doc_url = get_db_url(doc_config)
            conn_doc = await asyncpg.connect(doc_url)
            r = await conn_doc.execute("DELETE FROM documents")
            stats["documents"] = int(r.split()[-1]) if r else 0
            await conn_doc.close()
            print(f"  ✓ documents: {stats['documents']} supprimés")
        except Exception as e:
            print(f"  ⚠ documents: {e}")
            stats["documents"] = 0

    # 3. Access logs (logs_db) - candidate_id = profile.id
    logs_config = UNIFIED_DB if unified_db else LOGS_DB
    if profile_id_list:
        try:
            logs_url = get_db_url(logs_config)
            conn_logs = await asyncpg.connect(logs_url)
            r = await conn_logs.execute(
                "DELETE FROM access_logs WHERE candidate_id = ANY($1)",
                profile_id_list,
            )
            stats["access_logs"] = int(r.split()[-1]) if r else 0
            await conn_logs.close()
            print(f"  ✓ access_logs: {stats['access_logs']} supprimés")
        except Exception as e:
            print(f"  ⚠ access_logs: {e}")
            stats["access_logs"] = 0
    else:
        try:
            logs_url = get_db_url(logs_config)
            conn_logs = await asyncpg.connect(logs_url)
            r = await conn_logs.execute("DELETE FROM access_logs")
            stats["access_logs"] = int(r.split()[-1]) if r else 0
            await conn_logs.close()
            print(f"  ✓ access_logs: {stats['access_logs']} supprimés")
        except Exception as e:
            print(f"  ⚠ access_logs: {e}")
            stats["access_logs"] = 0

    # 4. Candidate DB - ordre des FK
    conn_cand = await asyncpg.connect(candidate_url)
    try:
        # Applications (candidate_id -> profiles.id)
        r = await conn_cand.execute("DELETE FROM applications")
        stats["applications"] = int(r.split()[-1]) if r else 0
        print(f"  ✓ applications: {stats['applications']} supprimés")

        # Tables liées aux profils
        for table in ["job_preferences", "skills", "certifications", "educations", "experiences"]:
            try:
                r = await conn_cand.execute(f"DELETE FROM {table}")
                stats[table] = int(r.split()[-1]) if r else 0
                print(f"  ✓ {table}: {stats[table]} supprimés")
            except Exception as e:
                print(f"  ⚠ {table}: {e}")
                stats[table] = 0

        # Profils
        r = await conn_cand.execute("DELETE FROM profiles")
        stats["profiles"] = int(r.split()[-1]) if r else 0
        print(f"  ✓ profiles: {stats['profiles']} supprimés")
    finally:
        await conn_cand.close()

    # 5. Auth - utilisateurs candidats (users, user_roles, refresh_tokens)
    if with_users:
        auth_config = UNIFIED_DB if unified_db else AUTH_DB
        auth_url = get_db_url(auth_config)
        try:
            conn_auth = await asyncpg.connect(auth_url)
            role_row = await conn_auth.fetchrow(
                "SELECT id FROM roles WHERE name = 'ROLE_CANDIDAT'"
            )
            if role_row:
                role_id = role_row["id"]
                user_ids = await conn_auth.fetch(
                    "SELECT user_id FROM user_roles WHERE role_id = $1", role_id
                )
                uids = [r["user_id"] for r in user_ids]
                if uids:
                    await conn_auth.execute(
                        "DELETE FROM refresh_tokens WHERE user_id = ANY($1)",
                        uids,
                    )
                    await conn_auth.execute(
                        "DELETE FROM user_roles WHERE user_id = ANY($1)",
                        uids,
                    )
                    await conn_auth.execute(
                        "DELETE FROM users WHERE id = ANY($1)",
                        uids,
                    )
                    stats["users"] = len(uids)
                    print(f"  ✓ users (candidats): {stats['users']} supprimés")
                else:
                    stats["users"] = 0
                    print(f"  ✓ users (candidats): 0 (aucun trouvé)")
            else:
                stats["users"] = 0
                print(f"  ⚠ Rôle ROLE_CANDIDAT non trouvé, aucun user supprimé")
            await conn_auth.close()
        except Exception as e:
            print(f"  ⚠ auth (users): {e}")
            stats["users"] = 0

    # 6. Elasticsearch
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
        description="Efface TOUTES les données candidats et leurs comptes (dev uniquement)"
    )
    parser.add_argument(
        "--no-users",
        action="store_true",
        help="Ne pas supprimer les comptes utilisateurs (garder users, user_roles, refresh_tokens)",
    )
    parser.add_argument(
        "--no-es",
        action="store_true",
        help="Ne pas vider l'index Elasticsearch certified_candidates",
    )
    parser.add_argument(
        "--unified-db",
        action="store_true",
        help="Utiliser une seule base (DB_HOST, DB_PORT, DB_NAME) pour toutes les tables",
    )
    parser.add_argument(
        "-y", "--yes",
        action="store_true",
        help="Confirmer sans demander",
    )
    args = parser.parse_args()

    with_users = not args.no_users
    with_es = not args.no_es
    unified_db = args.unified_db

    print("🗑  EFFACEMENT COMPLET DES DONNÉES CANDIDATS")
    print("   (mode développement uniquement)")
    print()
    print("   Bases de données :")
    if unified_db:
        print(f"   - Unifiée:   {UNIFIED_DB['host']}:{UNIFIED_DB['port']}/{UNIFIED_DB['name']}")
    else:
        print(f"   - Auth:      {AUTH_DB['host']}:{AUTH_DB['port']}/{AUTH_DB['name']}")
        print(f"   - Candidate: {CANDIDATE_DB['host']}:{CANDIDATE_DB['port']}/{CANDIDATE_DB['name']}")
        print(f"   - Document:  {DOCUMENT_DB['host']}:{DOCUMENT_DB['port']}/{DOCUMENT_DB['name']}")
        print(f"   - Logs:      {LOGS_DB['host']}:{LOGS_DB['port']}/{LOGS_DB['name']}")
    if with_users:
        print("   + Comptes candidats (auth)")
    if with_es:
        print("   + Index Elasticsearch certified_candidates")
    print()
    print("   ⚠️  Cette action est IRRÉVERSIBLE.")
    print()

    if not args.yes:
        confirm = input("Continuer ? [y/N] ").strip().lower()
        if confirm not in ("y", "yes"):
            print("Annulé.")
            sys.exit(0)

    try:
        stats = await wipe_all_candidates(
            with_users=with_users, with_es=with_es, unified_db=unified_db
        )
        total = sum(v for v in stats.values() if isinstance(v, int))
        print()
        print(f"✅ Terminé. {total} enregistrements supprimés.")
    except Exception as e:
        print(f"\n❌ Erreur: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
