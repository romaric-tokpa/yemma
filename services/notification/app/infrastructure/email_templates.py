"""
Templates d'emails
"""
from typing import Dict, Any
from app.core.config import settings


def get_profile_validated_template(data: Dict[str, Any]) -> tuple[str, str]:
    """
    Template pour 'Profil validé'
    
    Args:
        data: {
            "recipient_name": "John Doe",
            "candidate_name": "Jane Smith",
            "profile_url": "https://..."
        }
    """
    recipient_name = data.get("recipient_name", "Cher candidat")
    candidate_name = data.get("candidate_name", "")
    profile_url = data.get("profile_url", f"{settings.FRONTEND_URL}/profile")
    
    subject = "🎉 Votre profil a été validé !"
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
            .content {{ background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }}
            .button {{ display: inline-block; padding: 12px 30px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }}
            .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Profil Validé !</h1>
            </div>
            <div class="content">
                <p>Bonjour {recipient_name},</p>
                <p>Nous avons le plaisir de vous informer que votre profil candidat <strong>{candidate_name}</strong> a été validé par notre équipe.</p>
                <p>Votre profil est maintenant visible par les recruteurs et vous pouvez commencer à recevoir des opportunités.</p>
                <p style="text-align: center;">
                    <a href="{profile_url}" class="button">Voir mon profil</a>
                </p>
                <p>Merci de votre confiance !</p>
                <p>L'équipe Yemma Solutions</p>
            </div>
            <div class="footer">
                <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    text = f"""
    Bonjour {recipient_name},
    
    Nous avons le plaisir de vous informer que votre profil candidat {candidate_name} a été validé par notre équipe.
    
    Votre profil est maintenant visible par les recruteurs et vous pouvez commencer à recevoir des opportunités.
    
    Voir mon profil : {profile_url}
    
    Merci de votre confiance !
    L'équipe Yemma Solutions
    """
    
    return subject, html, text


def get_action_required_template(data: Dict[str, Any]) -> tuple[str, str, str]:
    """
    Template pour 'Action requise sur votre profil'
    
    Args:
        data: {
            "recipient_name": "John Doe",
            "candidate_name": "Jane Smith",
            "action_message": "Veuillez compléter votre CV",
            "profile_url": "https://..."
        }
    """
    recipient_name = data.get("recipient_name", "Cher candidat")
    candidate_name = data.get("candidate_name", "")
    action_message = data.get("action_message", "Une action est requise sur votre profil")
    profile_url = data.get("profile_url", f"{settings.FRONTEND_URL}/profile")
    
    subject = "⚠️ Action requise sur votre profil"
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #FF9800; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
            .content {{ background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }}
            .button {{ display: inline-block; padding: 12px 30px; background-color: #FF9800; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }}
            .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
            .alert {{ background-color: #fff3cd; border-left: 4px solid #FF9800; padding: 15px; margin: 20px 0; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Action Requise</h1>
            </div>
            <div class="content">
                <p>Bonjour {recipient_name},</p>
                <p>Une action est requise sur votre profil candidat <strong>{candidate_name}</strong>.</p>
                <div class="alert">
                    <p><strong>{action_message}</strong></p>
                </div>
                <p style="text-align: center;">
                    <a href="{profile_url}" class="button">Mettre à jour mon profil</a>
                </p>
                <p>Merci de votre attention.</p>
                <p>L'équipe Yemma Solutions</p>
            </div>
            <div class="footer">
                <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    text = f"""
    Bonjour {recipient_name},
    
    Une action est requise sur votre profil candidat {candidate_name}.
    
    {action_message}
    
    Mettre à jour mon profil : {profile_url}
    
    Merci de votre attention.
    L'équipe Yemma Solutions
    """
    
    return subject, html, text


def get_recruiter_invitation_template(data: Dict[str, Any]) -> tuple[str, str, str]:
    """
    Template pour 'Nouvelle invitation recruteur'
    
    Args:
        data: {
            "recipient_name": "John Doe",
            "company_name": "Acme Corp",
            "invitation_token": "abc123",
            "invitation_url": "https://..."
        }
    """
    recipient_name = data.get("recipient_name", "Cher recruteur")
    company_name = data.get("company_name", "")
    invitation_url = data.get("invitation_url", f"{settings.FRONTEND_URL}/invitation/accept")
    
    subject = f"🎯 Invitation à rejoindre {company_name}"
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #2196F3; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
            .content {{ background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }}
            .button {{ display: inline-block; padding: 12px 30px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }}
            .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Invitation Recruteur</h1>
            </div>
            <div class="content">
                <p>Bonjour {recipient_name},</p>
                <p>Vous avez été invité(e) à rejoindre l'équipe de recrutement de <strong>{company_name}</strong> sur la plateforme Yemma Solutions.</p>
                <p>En acceptant cette invitation, vous pourrez :</p>
                <ul>
                    <li>Accéder aux profils de candidats validés</li>
                    <li>Rechercher des talents selon vos critères</li>
                    <li>Gérer vos candidatures</li>
                </ul>
                <p style="text-align: center;">
                    <a href="{invitation_url}" class="button">Accepter l'invitation</a>
                </p>
                <p>Cette invitation est valable pendant 7 jours.</p>
                <p>L'équipe Yemma Solutions</p>
            </div>
            <div class="footer">
                <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    text = f"""
    Bonjour {recipient_name},
    
    Vous avez été invité(e) à rejoindre l'équipe de recrutement de {company_name} sur la plateforme Yemma Solutions.
    
    En acceptant cette invitation, vous pourrez :
    - Accéder aux profils de candidats validés
    - Rechercher des talents selon vos critères
    - Gérer vos candidatures
    
    Accepter l'invitation : {invitation_url}
    
    Cette invitation est valable pendant 7 jours.
    
    L'équipe Yemma Solutions
    """
    
    return subject, html, text


def get_welcome_candidate_template(data: Dict[str, Any]) -> tuple[str, str, str]:
    """
    Template pour 'Bienvenue (Candidat)'
    
    Args:
        data: {
            "recipient_name": "John Doe",
            "candidate_name": "John Doe",
            "profile_url": "https://..."
        }
    """
    recipient_name = data.get("recipient_name", "Cher candidat")
    candidate_name = data.get("candidate_name", recipient_name)
    profile_url = data.get("profile_url", f"{settings.FRONTEND_URL}/profile")
    
    subject = "Bienvenue sur Yemma Solutions ! 🎉"
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 5px 5px 0 0; }}
            .content {{ background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }}
            .button {{ display: inline-block; padding: 12px 30px; background-color: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }}
            .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
            .features {{ margin: 20px 0; }}
            .feature {{ padding: 10px; background-color: white; margin: 10px 0; border-radius: 5px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Bienvenue {recipient_name} !</h1>
            </div>
            <div class="content">
                <p>Bonjour {recipient_name},</p>
                <p>Nous sommes ravis de vous accueillir sur <strong>Yemma Solutions</strong>, la plateforme qui connecte les talents aux meilleures opportunités.</p>
                
                <div class="features">
                    <h3>Ce que vous pouvez faire :</h3>
                    <div class="feature">
                        <strong>✓</strong> Créer votre profil professionnel complet
                    </div>
                    <div class="feature">
                        <strong>✓</strong> Mettre en avant vos compétences et expériences
                    </div>
                    <div class="feature">
                        <strong>✓</strong> Être visible par les recruteurs après validation
                    </div>
                    <div class="feature">
                        <strong>✓</strong> Recevoir des opportunités personnalisées
                    </div>
                </div>
                
                <p style="text-align: center;">
                    <a href="{profile_url}" class="button">Compléter mon profil</a>
                </p>
                
                <p>Notre équipe validera votre profil dans les plus brefs délais. Une fois validé, vous serez visible par les recruteurs partenaires.</p>
                
                <p>Bonne chance dans votre recherche !</p>
                <p>L'équipe Yemma Solutions</p>
            </div>
            <div class="footer">
                <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    text = f"""
    Bonjour {recipient_name},
    
    Nous sommes ravis de vous accueillir sur Yemma Solutions, la plateforme qui connecte les talents aux meilleures opportunités.
    
    Ce que vous pouvez faire :
    ✓ Créer votre profil professionnel complet
    ✓ Mettre en avant vos compétences et expériences
    ✓ Être visible par les recruteurs après validation
    ✓ Recevoir des opportunités personnalisées
    
    Compléter mon profil : {profile_url}
    
    Notre équipe validera votre profil dans les plus brefs délais. Une fois validé, vous serez visible par les recruteurs partenaires.
    
    Bonne chance dans votre recherche !
    L'équipe Yemma Solutions
    """
    
    return subject, html, text


def get_profile_rejected_template(data: Dict[str, Any]) -> tuple[str, str, str]:
    """
    Template pour 'Profil Refusé (Candidat)'
    
    Args:
        data: {
            "recipient_name": "John Doe",
            "candidate_name": "John Doe",
            "rejection_reason": "Profil ne correspond pas aux critères",
            "profile_url": "https://..."
        }
    """
    recipient_name = data.get("recipient_name", "Cher candidat")
    candidate_name = data.get("candidate_name", recipient_name)
    rejection_reason = data.get("rejection_reason", "Votre profil ne correspond pas actuellement aux critères de notre plateforme.")
    profile_url = data.get("profile_url", f"{settings.FRONTEND_URL}/profile")
    
    subject = "Information concernant votre profil"
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #f44336; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
            .content {{ background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }}
            .button {{ display: inline-block; padding: 12px 30px; background-color: #f44336; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }}
            .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
            .alert {{ background-color: #ffebee; border-left: 4px solid #f44336; padding: 15px; margin: 20px 0; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Décision sur votre profil</h1>
            </div>
            <div class="content">
                <p>Bonjour {recipient_name},</p>
                <p>Nous avons examiné votre profil candidat <strong>{candidate_name}</strong> avec attention.</p>
                
                <div class="alert">
                    <p><strong>Malheureusement, votre profil n'a pas pu être validé à ce jour.</strong></p>
                    <p>Raison : {rejection_reason}</p>
                </div>
                
                <p>Nous vous encourageons à :</p>
                <ul>
                    <li>Améliorer votre profil en ajoutant plus de détails sur vos expériences</li>
                    <li>Mettre à jour vos compétences et certifications</li>
                    <li>Compléter toutes les sections de votre profil</li>
                </ul>
                
                <p style="text-align: center;">
                    <a href="{profile_url}" class="button">Mettre à jour mon profil</a>
                </p>
                
                <p>Vous pouvez soumettre à nouveau votre profil une fois les améliorations apportées.</p>
                
                <p>Nous restons à votre disposition pour toute question.</p>
                <p>L'équipe Yemma Solutions</p>
            </div>
            <div class="footer">
                <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    text = f"""
    Bonjour {recipient_name},
    
    Nous avons examiné votre profil candidat {candidate_name} avec attention.
    
    Malheureusement, votre profil n'a pas pu être validé à ce jour.
    Raison : {rejection_reason}
    
    Nous vous encourageons à améliorer votre profil en ajoutant plus de détails sur vos expériences, mettre à jour vos compétences et compléter toutes les sections.
    
    Mettre à jour mon profil : {profile_url}
    
    Vous pouvez soumettre à nouveau votre profil une fois les améliorations apportées.
    
    Nous restons à votre disposition pour toute question.
    L'équipe Yemma Solutions
    """
    
    return subject, html, text


def get_quota_alert_template(data: Dict[str, Any]) -> tuple[str, str, str]:
    """
    Template pour 'Alerte de quota d'abonnement atteint (Entreprise)'
    
    Args:
        data: {
            "recipient_name": "John Doe",
            "company_name": "Acme Corp",
            "quota_used": 90,
            "quota_limit": 100,
            "quota_type": "profile_views",
            "upgrade_url": "https://..."
        }
    """
    recipient_name = data.get("recipient_name", "Cher administrateur")
    company_name = data.get("company_name", "Votre entreprise")
    quota_used = data.get("quota_used", 0)
    quota_limit = data.get("quota_limit", 100)
    quota_type = data.get("quota_type", "profile_views")
    upgrade_url = data.get("upgrade_url", f"{settings.FRONTEND_URL}/company/management?tab=subscription")
    
    percentage = (quota_used / quota_limit * 100) if quota_limit > 0 else 0
    
    subject = f"⚠️ Alerte : {percentage:.0f}% de votre quota utilisé"
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #FF9800; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
            .content {{ background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }}
            .button {{ display: inline-block; padding: 12px 30px; background-color: #FF9800; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }}
            .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
            .alert {{ background-color: #fff3cd; border-left: 4px solid #FF9800; padding: 15px; margin: 20px 0; }}
            .progress {{ background-color: #e0e0e0; border-radius: 10px; height: 20px; margin: 15px 0; overflow: hidden; }}
            .progress-bar {{ background-color: #FF9800; height: 100%; width: {percentage}%; transition: width 0.3s; }}
            .stats {{ display: flex; justify-content: space-between; margin: 15px 0; }}
            .stat-item {{ text-align: center; }}
            .stat-value {{ font-size: 24px; font-weight: bold; color: #FF9800; }}
            .stat-label {{ font-size: 12px; color: #666; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>⚠️ Alerte Quota</h1>
            </div>
            <div class="content">
                <p>Bonjour {recipient_name},</p>
                <p>Votre entreprise <strong>{company_name}</strong> a atteint <strong>{percentage:.0f}%</strong> de son quota mensuel.</p>
                
                <div class="alert">
                    <p><strong>Quota utilisé :</strong></p>
                    <div class="stats">
                        <div class="stat-item">
                            <div class="stat-value">{quota_used}</div>
                            <div class="stat-label">Utilisé</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">{quota_limit}</div>
                            <div class="stat-label">Limite</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">{quota_limit - quota_used}</div>
                            <div class="stat-label">Restant</div>
                        </div>
                    </div>
                    <div class="progress">
                        <div class="progress-bar"></div>
                    </div>
                </div>
                
                <p>Type de quota : <strong>{quota_type.replace('_', ' ').title()}</strong></p>
                
                <p>Pour continuer à utiliser la plateforme sans interruption, nous vous recommandons de passer à un plan supérieur avec un quota plus élevé ou illimité.</p>
                
                <p style="text-align: center;">
                    <a href="{upgrade_url}" class="button">Voir les plans disponibles</a>
                </p>
                
                <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
                <p>L'équipe Yemma Solutions</p>
            </div>
            <div class="footer">
                <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    text = f"""
    Bonjour {recipient_name},
    
    Votre entreprise {company_name} a atteint {percentage:.0f}% de son quota mensuel.
    
    Quota utilisé : {quota_used} / {quota_limit}
    Restant : {quota_limit - quota_used}
    Type : {quota_type.replace('_', ' ').title()}
    
    Pour continuer à utiliser la plateforme sans interruption, nous vous recommandons de passer à un plan supérieur avec un quota plus élevé ou illimité.
    
    Voir les plans disponibles : {upgrade_url}
    
    Si vous avez des questions, n'hésitez pas à nous contacter.
    L'équipe Yemma Solutions
    """
    
    return subject, html, text


def get_email_template(notification_type: str, data: Dict[str, Any]) -> tuple[str, str, str]:
    """
    Récupère le template d'email selon le type
    
    Args:
        notification_type: Type de notification
        data: Données pour le template
    """
    templates = {
        "welcome_candidate": get_welcome_candidate_template,
        "profile_validated": get_profile_validated_template,
        "profile_rejected": get_profile_rejected_template,
        "action_required": get_action_required_template,
        "recruiter_invitation": get_recruiter_invitation_template,
        "quota_alert": get_quota_alert_template,
    }
    
    template_func = templates.get(notification_type)
    if not template_func:
        raise ValueError(f"Template not found for type: {notification_type}")
    
    return template_func(data)


