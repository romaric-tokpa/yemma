"""
Script de seed pour créer un utilisateur administrateur par défaut
"""
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database import AsyncSessionLocal
from app.infrastructure.repositories import UserRepository, RoleRepository
from app.domain.models import User, UserRoleLink, UserStatus
from app.infrastructure.security import hash_password


async def seed_admin_user():
    """Crée un utilisateur administrateur par défaut s'il n'existe pas"""
    async with AsyncSessionLocal() as session:
        user_repo = UserRepository(session)
        role_repo = RoleRepository(session)
        
        # Email et mot de passe par défaut pour l'admin
        admin_email = "admin@yemma.com"
        admin_password = "12345678"
        admin_first_name = "Admin"
        admin_last_name = "Yemma"
        admin_role = "ROLE_SUPER_ADMIN"
        
        # Vérifier si l'admin existe déjà
        existing_admin = await user_repo.get_by_email(admin_email)
        if existing_admin:
            print(f"✅ L'utilisateur administrateur {admin_email} existe déjà")
            return existing_admin
        
        # Créer l'utilisateur admin
        hashed_password = hash_password(admin_password)
        admin_user = User(
            email=admin_email,
            hashed_password=hashed_password,
            first_name=admin_first_name,
            last_name=admin_last_name,
            status=UserStatus.ACTIVE,  # Activer directement pour le développement
        )
        
        admin_user = await user_repo.create(admin_user)
        
        # Assigner le rôle SUPER_ADMIN
        role = await role_repo.get_or_create(admin_role)
        user_role = UserRoleLink(user_id=admin_user.id, role_id=role.id)
        session.add(user_role)
        await session.commit()
        
        print(f"✅ Utilisateur administrateur créé avec succès:")
        print(f"   Email: {admin_email}")
        print(f"   Mot de passe: {admin_password}")
        print(f"   Rôle: {admin_role}")
        print(f"   ⚠️  IMPORTANT: Changez le mot de passe en production !")
        
        return admin_user


if __name__ == "__main__":
    asyncio.run(seed_admin_user())
