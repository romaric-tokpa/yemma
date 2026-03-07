#!/usr/bin/env python3
"""
Script : supprime un utilisateur par email de la base auth.

Utile quand wipe_all_candidates.py n'a pas pu supprimer les comptes (ex. auth DB
inaccessible) ou pour supprimer un compte spécifique avant de se réinscrire.

⚠️  S'exécute UNIQUEMENT si APP_ENV=development.

Usage:
  python3 scripts/delete_user_by_email.py user@example.com
  python3 scripts/delete_user_by_email.py user@example.com -y
"""
import asyncio
import os
import sys
from pathlib import Path

project_root = Path(__file__).resolve().parent.parent
env_path = project_root / ".env"
if env_path.exists():
    from dotenv import load_dotenv
    load_dotenv(env_path)

if os.getenv("APP_ENV", "development") != "development":
    print("❌ Ce script ne s'exécute qu'en mode développement (APP_ENV=development).")
    sys.exit(1)

def _port():
    v = os.getenv("POSTGRES_AUTH_PORT")
    if v:
        return int(v)
    v = os.getenv("DB_AUTH_PORT")
    if v:
        return int(v)
    v = os.getenv("DB_PORT")
    if v:
        return int(v)
    return 5441


DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = _port()
DB_USER = os.getenv("DB_AUTH_USER", os.getenv("DB_USER", "postgres"))
DB_PASSWORD = os.getenv("DB_AUTH_PASSWORD", os.getenv("DB_PASSWORD", "postgres"))
DB_NAME = os.getenv("DB_AUTH_NAME", "auth_db")


async def delete_user_by_email(email: str) -> bool:
    import asyncpg
    auth_url = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    try:
        conn = await asyncpg.connect(auth_url)
        row = await conn.fetchrow("SELECT id FROM users WHERE email = $1", email)
        if not row:
            print(f"  Aucun utilisateur trouvé avec l'email {email}")
            await conn.close()
            return False
        user_id = row["id"]
        await conn.execute("DELETE FROM refresh_tokens WHERE user_id = $1", user_id)
        await conn.execute("DELETE FROM user_roles WHERE user_id = $1", user_id)
        await conn.execute("DELETE FROM users WHERE id = $1", user_id)
        await conn.close()
        print(f"  ✓ Utilisateur {email} (id={user_id}) supprimé de auth_db")

        # Supprimer aussi le profil candidat si existant
        cand_host = os.getenv("DB_CANDIDATE_HOST", DB_HOST)
        cand_port = int(os.getenv("POSTGRES_CANDIDATE_PORT", os.getenv("DB_CANDIDATE_PORT", os.getenv("DB_PORT", "5442"))))
        cand_user = os.getenv("DB_CANDIDATE_USER", os.getenv("DB_USER", "postgres"))
        cand_pass = os.getenv("DB_CANDIDATE_PASSWORD", os.getenv("DB_PASSWORD", "postgres"))
        cand_name = os.getenv("DB_CANDIDATE_NAME", "candidate_db")
        cand_url = f"postgresql://{cand_user}:{cand_pass}@{cand_host}:{cand_port}/{cand_name}"
        try:
            conn_c = await asyncpg.connect(cand_url)
            prof = await conn_c.fetchrow("SELECT id FROM profiles WHERE user_id = $1", user_id)
            if prof:
                pid = prof["id"]
                # Documents (document_db) - avant profiles
                doc_port = int(os.getenv("POSTGRES_DOCUMENT_PORT", os.getenv("DB_DOCUMENT_PORT", os.getenv("DB_PORT", "5445"))))
                doc_url = f"postgresql://{cand_user}:{cand_pass}@{cand_host}:{doc_port}/document_db"
                try:
                    conn_d = await asyncpg.connect(doc_url)
                    r = await conn_d.execute("DELETE FROM documents WHERE candidate_id = $1", pid)
                    await conn_d.close()
                    n = int(r.split()[-1]) if r else 0
                    if n:
                        print(f"  ✓ {n} document(s) supprimé(s)")
                except Exception:
                    pass
                await conn_c.execute("DELETE FROM applications WHERE candidate_id = $1", pid)
                await conn_c.execute("DELETE FROM job_preferences WHERE profile_id = $1", pid)
                for t in ["skills", "certifications", "educations", "experiences"]:
                    await conn_c.execute(f"DELETE FROM {t} WHERE profile_id = $1", pid)
                await conn_c.execute("DELETE FROM profiles WHERE id = $1", pid)
                print(f"  ✓ Profil candidat (id={pid}) supprimé de candidate_db")
            await conn_c.close()
        except Exception as e:
            print(f"  ⚠ Profil candidat: {e} (auth supprimé, vous pouvez réessayer l'inscription)")
        return True
    except Exception as e:
        print(f"  ❌ Erreur: {e}")
        return False


async def main():
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/delete_user_by_email.py <email> [-y]")
        print("Ex:    python3 scripts/delete_user_by_email.py test@example.com")
        sys.exit(1)
    email = sys.argv[1].strip()
    if not email or "@" not in email:
        print("❌ Email invalide")
        sys.exit(1)
    skip_confirm = "-y" in sys.argv or "--yes" in sys.argv
    print(f"🗑  Suppression de l'utilisateur {email}")
    print(f"   DB: {DB_HOST}:{DB_PORT}/{DB_NAME}")
    if not skip_confirm:
        r = input("Continuer ? [y/N] ").strip().lower()
        if r not in ("y", "yes"):
            print("Annulé.")
            sys.exit(0)
    ok = await delete_user_by_email(email)
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    asyncio.run(main())
