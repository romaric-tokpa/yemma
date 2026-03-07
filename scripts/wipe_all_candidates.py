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
    python3 scripts/wipe_all_candidates.py -y           # Tout supprimer en une commande (recommandé)
    python3 scripts/wipe_all_candidates.py              # Avec confirmation
    python3 scripts/wipe_all_candidates.py -y --no-es   # Sans vider Elasticsearch
    python3 scripts/wipe_all_candidates.py -y --no-users # Garder les comptes (données uniquement)

Prérequis:
  - .env à la racine avec les variables DB_*
  - Base unifiée (yemma_db) : le script réessaie automatiquement si candidate_db/document_db n'existent pas
  - auth_db (users, roles) : souvent sur port 5432 (DB_AUTH_PORT). Si sur le même postgres que yemma_db,
    mettre DB_AUTH_PORT=5433 (même que DB_PORT)
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

# Ports : POSTGRES_* > DB_*_PORT > DB_PORT > docker_default
def _port(postgres_key: str, db_key: str, docker_default: int) -> int:
    v = os.getenv(postgres_key)
    if v:
        return int(v)
    v = os.getenv(db_key)
    if v:
        return int(v)
    v = os.getenv("DB_PORT")  # Base unique sur un seul port
    if v:
        return int(v)
    return docker_default

# Utiliser DB_USER/DB_PASSWORD pour les scripts (évite "password authentication failed")
# Les users service (candidate_user, auth_user) peuvent ne pas exister en dev local
_script_user = os.getenv("DB_USER", "postgres")
_script_password = os.getenv("DB_PASSWORD", "postgres")

# Auth (users, roles, user_roles, refresh_tokens)
AUTH_DB = {
    "host": os.getenv("DB_AUTH_HOST", DB_HOST),
    "port": _port("POSTGRES_AUTH_PORT", "DB_AUTH_PORT", 5441),
    "user": _script_user,
    "password": _script_password,
    "name": os.getenv("DB_AUTH_NAME", "auth_db"),
}

# Candidate (profiles, experiences, educations, certifications, skills, job_preferences, applications)
CANDIDATE_DB = {
    "host": os.getenv("DB_CANDIDATE_HOST", DB_HOST),
    "port": _port("POSTGRES_CANDIDATE_PORT", "DB_CANDIDATE_PORT", 5442),
    "user": _script_user,
    "password": _script_password,
    "name": os.getenv("DB_CANDIDATE_NAME", "candidate_db"),
}

# Document (documents - CV, attestations, etc.)
DOCUMENT_DB = {
    "host": os.getenv("DB_DOCUMENT_HOST", DB_HOST),
    "port": _port("POSTGRES_DOCUMENT_PORT", "DB_DOCUMENT_PORT", 5445),
    "user": _script_user,
    "password": _script_password,
    "name": os.getenv("DB_DOCUMENT_NAME", "document_db"),
}

# Logs / Audit (access_logs)
LOGS_DB = {
    "host": os.getenv("DB_LOGS_HOST", DB_HOST),
    "port": _port("POSTGRES_LOGS_PORT", "DB_LOGS_PORT", 5446),
    "user": _script_user,
    "password": _script_password,
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
        profile_ids = await conn_cand.fetch("SELECT id, user_id FROM profiles")
        profile_id_list = [r["id"] for r in profile_ids]
        candidate_user_ids = [r["user_id"] for r in profile_ids]
        await conn_cand.close()
    except Exception as e:
        print(f"  ⚠ Impossible de se connecter à candidate_db ({CANDIDATE_DB['host']}:{CANDIDATE_DB['port']}): {e}")
        profile_id_list = []
        candidate_user_ids = []

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

    # 3. Access logs (logs_db) - optionnel, peut ne pas exister en base unifiée
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
            if "does not exist" not in str(e):
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
            if "does not exist" not in str(e):
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
    # En mode unifié : auth_db (port 5432) contient users/roles ; yemma_db contient profiles
    if with_users:
        auth_db_same_port = {**UNIFIED_DB, "name": AUTH_DB["name"]} if unified_db else None
        auth_configs = [AUTH_DB]
        if unified_db:
            auth_configs.append(auth_db_same_port)
            auth_configs.append(UNIFIED_DB)
        conn_auth = None
        role_row = None
        for auth_config in auth_configs:
            try:
                conn_auth = await asyncpg.connect(get_db_url(auth_config))
                role_row = await conn_auth.fetchrow(
                    "SELECT id FROM roles WHERE name = 'ROLE_CANDIDAT'"
                )
                if role_row:
                    break
                await conn_auth.close()
                conn_auth = None
            except Exception as e:
                if auth_config == auth_configs[0]:
                    print(f"  ⚠ auth_db: {e}")
                if conn_auth:
                    await conn_auth.close()
                conn_auth = None
                role_row = None
        try:
            if role_row and conn_auth:
                role_id = role_row["id"]
                user_ids = await conn_auth.fetch(
                    "SELECT user_id FROM user_roles WHERE role_id = $1", role_id
                )
                uids = [r["user_id"] for r in user_ids]
                if not uids and unified_db and candidate_user_ids:
                    uids = candidate_user_ids
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
            elif candidate_user_ids and unified_db:
                try:
                    conn_unified = await asyncpg.connect(get_db_url(UNIFIED_DB))
                    await conn_unified.execute(
                        "DELETE FROM refresh_tokens WHERE user_id = ANY($1)",
                        candidate_user_ids,
                    )
                    await conn_unified.execute(
                        "DELETE FROM user_roles WHERE user_id = ANY($1)",
                        candidate_user_ids,
                    )
                    await conn_unified.execute(
                        "DELETE FROM users WHERE id = ANY($1)",
                        candidate_user_ids,
                    )
                    await conn_unified.close()
                    stats["users"] = len(candidate_user_ids)
                    print(f"  ✓ users (candidats, via profils): {stats['users']} supprimés")
                except Exception as e:
                    print(f"  ⚠ auth (users): {e}")
                    stats["users"] = 0
            else:
                stats["users"] = 0
                print(f"  ⚠ Rôle ROLE_CANDIDAT non trouvé ou auth_db inaccessible")
        except Exception as e:
            print(f"  ⚠ auth (users): {e}")
            stats["users"] = 0
        finally:
            if conn_auth:
                await conn_auth.close()

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

    for attempt_unified in ([False] if unified_db else [False, True]):
        try:
            use_unified = unified_db or attempt_unified
            if attempt_unified:
                print("\n   ⚠ Réessai avec base unifiée (DB_HOST:DB_PORT/DB_NAME)...")
            stats = await wipe_all_candidates(
                with_users=with_users, with_es=with_es, unified_db=use_unified
            )
            total = sum(v for v in stats.values() if isinstance(v, int))
            print()
            print(f"✅ Terminé. {total} enregistrements supprimés.")
            break
        except (OSError, ConnectionError, Exception) as e:
            if attempt_unified:
                print(f"\n❌ Erreur: {e}")
                if "Connect call failed" in str(e) or "Errno 61" in str(e):
                    print("   Vérifiez que PostgreSQL/Docker est démarré et que les ports dans .env sont corrects.")
                import traceback
                traceback.print_exc()
                sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
