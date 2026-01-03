"""
Repositories pour l'accès aux données
"""
from typing import Optional, List
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.domain.models import Notification, NotificationStatus


class NotificationRepository:
    """Repository pour les opérations sur les notifications"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def create(self, notification: Notification) -> Notification:
        """Crée une nouvelle notification"""
        self.session.add(notification)
        await self.session.commit()
        await self.session.refresh(notification)
        return notification
    
    async def get_by_id(self, notification_id: int) -> Optional[Notification]:
        """Récupère une notification par ID"""
        result = await self.session.get(Notification, notification_id)
        return result
    
    async def update_status(
        self,
        notification_id: int,
        status: NotificationStatus,
        error_message: Optional[str] = None
    ) -> Notification:
        """Met à jour le statut d'une notification"""
        notification = await self.get_by_id(notification_id)
        if notification:
            notification.status = status
            notification.updated_at = datetime.utcnow()
            if status == NotificationStatus.SENT:
                notification.sent_at = datetime.utcnow()
            if error_message:
                notification.error_message = error_message
            self.session.add(notification)
            await self.session.commit()
            await self.session.refresh(notification)
        return notification
    
    async def get_pending_notifications(self, limit: int = 100) -> List[Notification]:
        """Récupère les notifications en attente"""
        statement = select(Notification).where(
            Notification.status == NotificationStatus.PENDING
        ).order_by(Notification.created_at).limit(limit)
        result = await self.session.execute(statement)
        return list(result.scalars().all())
    
    async def get_by_recipient(
        self,
        recipient_email: str,
        limit: int = 50
    ) -> List[Notification]:
        """Récupère les notifications d'un destinataire"""
        statement = select(Notification).where(
            Notification.recipient_email == recipient_email
        ).order_by(desc(Notification.created_at)).limit(limit)
        result = await self.session.execute(statement)
        return list(result.scalars().all())
    
    async def get_by_recipient_email(
        self,
        recipient_email: str,
        limit: int = 50
    ) -> List[Notification]:
        """Récupère les notifications d'un destinataire (alias)"""
        return await self.get_by_recipient(recipient_email, limit)
    
    async def update(self, notification: Notification) -> Notification:
        """Met à jour une notification"""
        notification.updated_at = datetime.utcnow()
        self.session.add(notification)
        await self.session.commit()
        await self.session.refresh(notification)
        return notification


