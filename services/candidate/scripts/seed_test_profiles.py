#!/usr/bin/env python3
"""
Seed de profils candidats de test pour le développement.
Crée des utilisateurs dans auth puis des profils dans candidate.

Usage (depuis la racine du projet) :
  docker compose exec candidate python scripts/seed_test_profiles.py

Ou avec les URLs des services (depuis la machine hôte) :
  AUTH_URL=http://localhost:8001 CANDIDATE_URL=http://localhost:8002 python scripts/seed_test_profiles.py
"""
import asyncio
import os
import sys

# Ajouter le répertoire parent au path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    import httpx
except ImportError:
    print("⚠️  httpx requis: pip install httpx")
    sys.exit(1)

AUTH_URL = os.getenv("AUTH_URL", "http://auth:8000")
CANDIDATE_URL = os.getenv("CANDIDATE_URL", "http://candidate:8000")

TEST_CANDIDATES = [
    {"email": "candidat1@test.com", "password": "12345678", "first_name": "Marie", "last_name": "Dupont", "profile_title": "Développeuse Full Stack"},
    {"email": "candidat2@test.com", "password": "12345678", "first_name": "Jean", "last_name": "Martin", "profile_title": "Data Analyst"},
    {"email": "candidat3@test.com", "password": "12345678", "first_name": "Sophie", "last_name": "Bernard", "profile_title": "Chef de projet"},
]


async def register_candidate(client: httpx.AsyncClient, data: dict) -> str | None:
    """Inscrit un candidat et retourne le token."""
    try:
        r = await client.post(
            f"{AUTH_URL}/api/v1/auth/register",
            json={
                "email": data["email"],
                "password": data["password"],
                "first_name": data["first_name"],
                "last_name": data["last_name"],
                "role": "ROLE_CANDIDAT",
            },
            timeout=10.0,
        )
        if r.status_code in (200, 201):
            return r.json().get("access_token")
        if r.status_code == 409:
            # Déjà inscrit, on se connecte
            r2 = await client.post(
                f"{AUTH_URL}/api/v1/auth/login",
                json={"email": data["email"], "password": data["password"]},
                timeout=10.0,
            )
            if r2.status_code == 200:
                return r2.json().get("access_token")
        return None
    except Exception as e:
        print(f"  Erreur inscription {data['email']}: {e}")
        return None


async def create_or_get_profile(client: httpx.AsyncClient, token: str, data: dict) -> bool:
    """Crée ou récupère le profil candidat."""
    headers = {"Authorization": f"Bearer {token}"}
    try:
        r = await client.post(
            f"{CANDIDATE_URL}/api/v1/profiles",
            json={
                "email": data["email"],
                "first_name": data["first_name"],
                "last_name": data["last_name"],
                "profile_title": data["profile_title"],
                "accept_cgu": True,
                "accept_rgpd": True,
                "accept_verification": True,
            },
            headers=headers,
            timeout=10.0,
        )
        if r.status_code in (200, 201):
            return True
        return False
    except Exception as e:
        print(f"  Erreur création profil {data['email']}: {e}")
        return False


async def main():
    print("🌱 Seed des profils candidats de test...")
    print(f"   Auth: {AUTH_URL}")
    print(f"   Candidate: {CANDIDATE_URL}")

    async with httpx.AsyncClient() as client:
        created = 0
        for data in TEST_CANDIDATES:
            token = await register_candidate(client, data)
            if not token:
                print(f"  ⚠️  {data['email']}: impossible d'obtenir un token")
                continue
            if await create_or_get_profile(client, token, data):
                created += 1
                print(f"  ✅ {data['email']} ({data['first_name']} {data['last_name']})")
            else:
                print(f"  ⚠️  {data['email']}: profil peut-être déjà existant")

    print(f"\n✅ {created} profil(s) candidat(s) prêt(s). Rafraîchissez /admin/validation")


if __name__ == "__main__":
    asyncio.run(main())
