"""
Templates d'emails simples et professionnels
"""
from typing import Dict, Any
from app.core.config import settings


def get_base_template(title: str, content: str, button_text: str = None, button_url: str = None) -> str:
    """
    Template de base pour tous les emails
    
    Args:
        title: Titre de l'email
        content: Contenu HTML principal
        button_text: Texte du bouton CTA (optionnel)
        button_url: URL du bouton CTA (optionnel)
    """
    button_html = ""
    if button_text and button_url:
        button_html = f"""
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 30px auto;">
            <tr>
                <td style="border-radius: 5px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                    <a href="{button_url}" style="display: inline-block; padding: 14px 28px; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: 600;">
                        {button_text}
                    </a>
                </td>
            </tr>
        </table>
        """
    
    return f"""
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{title}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
                <td align="center">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                                    {title}
                                </h1>
                            </td>
                        </tr>
                        
                        <!-- Content -->
                        <tr>
                            <td style="padding: 40px 30px;">
                                {content}
                                {button_html}
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="padding: 30px; background-color: #f9f9f9; text-align: center; border-top: 1px solid #e5e5e5;">
                                <p style="margin: 0; color: #666666; font-size: 12px; line-height: 1.6;">
                                    Cet email a été envoyé automatiquement par <strong>Yemma Solutions</strong>.<br>
                                    Merci de ne pas y répondre.
                                </p>
                                <p style="margin: 15px 0 0 0; color: #999999; font-size: 11px;">
                                    © {settings.APP_NAME or 'Yemma Solutions'} - Tous droits réservés
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """


def get_profile_validated_template(data: Dict[str, Any]) -> tuple[str, str, str]:
    """
    Template simple et professionnel pour 'Profil validé'
    """
    recipient_name = data.get("recipient_name", "Cher candidat")
    candidate_name = data.get("candidate_name", recipient_name)
    profile_url = data.get("profile_url", f"{settings.FRONTEND_URL}/candidate/profile")
    
    subject = "🎉 Votre profil a été validé !"
    
    content = f"""
    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
        Bonjour <strong>{recipient_name}</strong>,
    </p>
    
    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
        Excellente nouvelle ! Votre profil candidat <strong>{candidate_name}</strong> a été validé par notre équipe d'experts.
    </p>
    
    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
        Votre profil est maintenant <strong>visible par les recruteurs</strong> et vous pouvez commencer à recevoir des opportunités professionnelles adaptées à votre profil.
    </p>
    
    <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px; line-height: 1.6;">
        Nous vous souhaitons beaucoup de succès dans votre recherche d'emploi !
    </p>
    """
    
    html = get_base_template(
        title="Profil Validé",
        content=content,
        button_text="Voir mon profil",
        button_url=profile_url
    )
    
    text = f"""
    Bonjour {recipient_name},
    
    Excellente nouvelle ! Votre profil candidat {candidate_name} a été validé par notre équipe d'experts.
    
    Votre profil est maintenant visible par les recruteurs et vous pouvez commencer à recevoir des opportunités professionnelles adaptées à votre profil.
    
    Voir mon profil : {profile_url}
    
    Nous vous souhaitons beaucoup de succès dans votre recherche d'emploi !
    
    L'équipe Yemma Solutions
    """
    
    return subject, html, text


def get_profile_rejected_template(data: Dict[str, Any]) -> tuple[str, str, str]:
    """
    Template simple et professionnel pour 'Profil refusé'
    """
    recipient_name = data.get("recipient_name", "Cher candidat")
    candidate_name = data.get("candidate_name", recipient_name)
    rejection_reason = data.get("rejection_reason", "Votre profil ne correspond pas actuellement aux critères de notre plateforme.")
    profile_url = data.get("profile_url", f"{settings.FRONTEND_URL}/candidate/profile")
    
    subject = "Information concernant votre profil"
    
    content = f"""
    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
        Bonjour <strong>{recipient_name}</strong>,
    </p>
    
    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
        Nous avons examiné votre profil candidat <strong>{candidate_name}</strong> avec attention.
    </p>
    
    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0 0 10px 0; color: #856404; font-size: 14px; font-weight: 600;">
            Décision : Votre profil n'a pas pu être validé à ce jour.
        </p>
        <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
            <strong>Raison :</strong> {rejection_reason}
        </p>
    </div>
    
    <p style="margin: 20px 0 10px 0; color: #333333; font-size: 16px; font-weight: 600;">
        Nous vous encourageons à :
    </p>
    <ul style="margin: 10px 0 20px 0; padding-left: 20px; color: #333333; font-size: 16px; line-height: 1.8;">
        <li>Améliorer votre profil en ajoutant plus de détails sur vos expériences</li>
        <li>Mettre à jour vos compétences et certifications</li>
        <li>Compléter toutes les sections de votre profil</li>
    </ul>
    
    <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px; line-height: 1.6;">
        Vous pouvez soumettre à nouveau votre profil une fois les améliorations apportées.
    </p>
    """
    
    html = get_base_template(
        title="Décision sur votre profil",
        content=content,
        button_text="Mettre à jour mon profil",
        button_url=profile_url
    )
    
    text = f"""
    Bonjour {recipient_name},
    
    Nous avons examiné votre profil candidat {candidate_name} avec attention.
    
    Décision : Votre profil n'a pas pu être validé à ce jour.
    Raison : {rejection_reason}
    
    Nous vous encourageons à améliorer votre profil en ajoutant plus de détails sur vos expériences, mettre à jour vos compétences et compléter toutes les sections.
    
    Mettre à jour mon profil : {profile_url}
    
    Vous pouvez soumettre à nouveau votre profil une fois les améliorations apportées.
    
    L'équipe Yemma Solutions
    """
    
    return subject, html, text


def get_recruiter_invitation_template(data: Dict[str, Any]) -> tuple[str, str, str]:
    """
    Template simple et professionnel pour 'Invitation recruteur'
    """
    recipient_name = data.get("recipient_name", "Cher recruteur")
    company_name = data.get("company_name", "")
    invitation_url = data.get("invitation_url", f"{settings.FRONTEND_URL}/invitation/accept")
    
    subject = f"Invitation à rejoindre {company_name}"
    
    content = f"""
    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
        Bonjour <strong>{recipient_name}</strong>,
    </p>
    
    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
        Vous avez été invité(e) à rejoindre l'équipe de recrutement de <strong>{company_name}</strong> sur la plateforme <strong>Yemma Solutions</strong>.
    </p>
    
    <p style="margin: 0 0 15px 0; color: #333333; font-size: 16px; font-weight: 600;">
        En acceptant cette invitation, vous pourrez :
    </p>
    <ul style="margin: 10px 0 20px 0; padding-left: 20px; color: #333333; font-size: 16px; line-height: 1.8;">
        <li>Accéder aux profils de candidats validés</li>
        <li>Rechercher des talents selon vos critères</li>
        <li>Gérer vos candidatures et suivis</li>
        <li>Collaborer avec votre équipe</li>
    </ul>
    
    <div style="background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; color: #1565c0; font-size: 14px; line-height: 1.6;">
            ⏰ Cette invitation est valable pendant <strong>7 jours</strong>.
        </p>
    </div>
    """
    
    html = get_base_template(
        title="Invitation Recruteur",
        content=content,
        button_text="Accepter l'invitation",
        button_url=invitation_url
    )
    
    text = f"""
    Bonjour {recipient_name},
    
    Vous avez été invité(e) à rejoindre l'équipe de recrutement de {company_name} sur la plateforme Yemma Solutions.
    
    En acceptant cette invitation, vous pourrez :
    - Accéder aux profils de candidats validés
    - Rechercher des talents selon vos critères
    - Gérer vos candidatures et suivis
    - Collaborer avec votre équipe
    
    Accepter l'invitation : {invitation_url}
    
    Cette invitation est valable pendant 7 jours.
    
    L'équipe Yemma Solutions
    """
    
    return subject, html, text


def get_email_template_simple(notification_type: str, data: Dict[str, Any]) -> tuple[str, str, str]:
    """
    Récupère le template d'email selon le type (utilise les templates simples)
    """
    templates = {
        "profile_validated": get_profile_validated_template,
        "profile_rejected": get_profile_rejected_template,
        "recruiter_invitation": get_recruiter_invitation_template,
    }
    
    template_func = templates.get(notification_type)
    if not template_func:
        # Fallback vers les anciens templates si le type n'est pas trouvé
        from app.infrastructure.email_templates import get_email_template as get_old_template
        return get_old_template(notification_type, data)
    
    return template_func(data)

