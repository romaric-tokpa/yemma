"""
Templates d'emails simples et professionnels
"""
from typing import Dict, Any
from app.core.config import settings


def get_base_template(title: str, content: str, button_text: str = None, button_url: str = None, header_color: str = "#0B3C5D") -> str:
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
                <td style="border-radius: 8px; background-color: #1ABC9C;">
                    <a href="{button_url}" style="display: inline-block; padding: 14px 28px; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
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
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Inter', 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; background-color: #F4F6F8;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #F4F6F8; padding: 40px 20px;">
            <tr>
                <td align="center">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, {header_color} 0%, {header_color} 100%); padding: 40px 30px; text-align: center;">
                                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; font-family: 'Poppins', sans-serif;">
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
                            <td style="padding: 30px; background-color: #F4F6F8; text-align: center; border-top: 1px solid #e5e5e5;">
                                <p style="margin: 0; color: #2C2C2C; font-size: 12px; line-height: 1.6; font-family: 'Inter', 'Roboto', sans-serif;">
                                    Cet email a été envoyé automatiquement par <strong style="color: #0B3C5D;">Yemma Solutions</strong>.<br>
                                    Merci de ne pas y répondre.
                                </p>
                                <p style="margin: 15px 0 0 0; color: #666666; font-size: 11px; font-family: 'Inter', 'Roboto', sans-serif;">
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
    Avec identifiants de connexion selon la charte graphique
    """
    recipient_name = data.get("recipient_name", "Cher recruteur")
    company_name = data.get("company_name", "")
    invitation_url = data.get("invitation_url", f"{settings.FRONTEND_URL}/invitation/accept")
    recipient_email = data.get("recipient_email", "")
    temporary_password = data.get("temporary_password", "")
    
    subject = f"Invitation à rejoindre {company_name} - Vos identifiants Yemma Solutions"
    
    # Section lien d'activation - Design amélioré
    activation_section = f"""
        <div style="background: linear-gradient(135deg, #1ABC9C 0%, #0B3C5D 100%); border-radius: 16px; padding: 30px; margin: 30px 0; box-shadow: 0 4px 12px rgba(26, 188, 156, 0.3);">
            <div style="text-align: center; margin-bottom: 25px;">
                <div style="background-color: #ffffff; border-radius: 50%; width: 60px; height: 60px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 15px;">
                    <span style="font-size: 32px;">🎯</span>
                </div>
                <h2 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; font-family: 'Poppins', sans-serif; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                    Créez votre compte
                </h2>
                <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 14px; opacity: 0.95; font-family: 'Inter', 'Roboto', sans-serif;">
                    Cliquez sur le bouton ci-dessous pour créer votre compte et définir votre mot de passe
                </p>
            </div>
            
            <!-- Instructions -->
            <div style="background-color: rgba(255, 255, 255, 0.15); backdrop-filter: blur(10px); border-radius: 10px; padding: 20px; margin-top: 20px; border: 1px solid rgba(255, 255, 255, 0.3);">
                <h3 style="margin: 0 0 12px 0; color: #ffffff; font-size: 16px; font-weight: 600; font-family: 'Poppins', sans-serif;">
                    📝 Comment procéder :
                </h3>
                <ol style="margin: 0; padding-left: 20px; color: #ffffff; font-size: 14px; line-height: 1.8; font-family: 'Inter', 'Roboto', sans-serif;">
                    <li style="margin: 6px 0;">Cliquez sur le bouton "Créer mon compte" ci-dessous</li>
                    <li style="margin: 6px 0;">Remplissez le formulaire avec vos informations (prénom, nom)</li>
                    <li style="margin: 6px 0;">Définissez un mot de passe sécurisé (minimum 8 caractères)</li>
                    <li style="margin: 6px 0;">Vous serez automatiquement connecté et redirigé vers votre espace</li>
                </ol>
            </div>
            
            <!-- Avertissement -->
            <div style="background-color: rgba(255, 255, 255, 0.2); border-left: 4px solid #F2C94C; padding: 15px; margin: 20px 0 0 0; border-radius: 8px;">
                <p style="margin: 0; color: #ffffff; font-size: 13px; line-height: 1.6; font-family: 'Inter', 'Roboto', sans-serif;">
                    <strong>⏰ Important :</strong> Ce lien est valable pendant <strong>7 jours</strong>. Après expiration, vous devrez demander une nouvelle invitation.
                </p>
            </div>
        </div>
        """
    
    content = f"""
    <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="margin: 0 0 10px 0; color: #0B3C5D; font-size: 28px; font-weight: 700; font-family: 'Poppins', sans-serif;">
            Bienvenue sur Yemma Solutions ! 🎉
        </h1>
        <p style="margin: 0; color: #666666; font-size: 16px; font-family: 'Inter', 'Roboto', sans-serif;">
            Vous avez été invité(e) à rejoindre l'équipe de <strong style="color: #1ABC9C;">{company_name}</strong>
        </p>
    </div>
    
    <p style="margin: 0 0 25px 0; color: #2C2C2C; font-size: 16px; line-height: 1.6; font-family: 'Inter', 'Roboto', sans-serif;">
        Bonjour <strong style="color: #0B3C5D;">{recipient_name}</strong>,
    </p>
    
    <p style="margin: 0 0 25px 0; color: #2C2C2C; font-size: 16px; line-height: 1.6; font-family: 'Inter', 'Roboto', sans-serif;">
        Nous sommes ravis de vous accueillir sur la plateforme <strong style="color: #1ABC9C;">Yemma Solutions</strong> ! Votre compte recruteur a été créé et vous pouvez dès maintenant accéder à votre espace pour rechercher et consulter les profils de candidats validés.
    </p>
    
    {activation_section}
    
    <div style="background: linear-gradient(135deg, #F4F6F8 0%, #ffffff 100%); border-left: 4px solid #1ABC9C; border-radius: 12px; padding: 20px; margin: 30px 0;">
        <h3 style="margin: 0 0 15px 0; color: #0B3C5D; font-size: 18px; font-weight: 600; font-family: 'Poppins', sans-serif;">
            ✨ Ce que vous pourrez faire :
        </h3>
        <ul style="margin: 0; padding-left: 20px; color: #2C2C2C; font-size: 15px; line-height: 2; font-family: 'Inter', 'Roboto', sans-serif;">
            <li style="margin: 8px 0;">🔍 <strong>Rechercher</strong> des candidats selon vos critères (compétences, expérience, localisation...)</li>
            <li style="margin: 8px 0;">👤 <strong>Consulter</strong> les profils détaillés avec les avis d'experts</li>
            <li style="margin: 8px 0;">📊 <strong>Gérer</strong> vos candidatures et suivis de recrutement</li>
            <li style="margin: 8px 0;">👥 <strong>Collaborer</strong> avec votre équipe de recrutement</li>
        </ul>
    </div>
    
    <div style="background-color: #E3F2FD; border-left: 4px solid #1ABC9C; padding: 15px; margin: 25px 0; border-radius: 8px;">
        <p style="margin: 0; color: #0B3C5D; font-size: 14px; line-height: 1.6; font-family: 'Inter', 'Roboto', sans-serif;">
            <strong>⏰ Note importante :</strong> Votre compte est déjà actif et prêt à être utilisé. Vous pouvez vous connecter immédiatement avec les identifiants fournis ci-dessus.
        </p>
    </div>
    """
    
    html = get_base_template(
        title="Invitation Recruteur",
        content=content,
        button_text="🎯 Créer mon compte",
        button_url=invitation_url,  # Lien vers la page d'acceptation d'invitation
        header_color="#1ABC9C"  # Vert émeraude pour plus de visibilité
    )
    
    text = f"""
    ============================================
    BIENVENUE SUR YEMMA SOLUTIONS !
    ============================================
    
    Bonjour {recipient_name},
    
    Nous sommes ravis de vous accueillir sur la plateforme Yemma Solutions !
    Vous avez été invité(e) à rejoindre l'équipe de recrutement de {company_name}.
    
    ============================================
    CRÉEZ VOTRE COMPTE
    ============================================
    
    Pour activer votre compte et accéder à votre espace recruteur, 
    vous devez créer votre compte en suivant ce lien :
    
    {invitation_url}
    
    ============================================
    COMMENT PROCÉDER
    ============================================
    
    1. Cliquez sur le lien ci-dessus ou copiez-le dans votre navigateur
    2. Remplissez le formulaire avec vos informations :
       - Prénom
       - Nom
       - Mot de passe sécurisé (minimum 8 caractères)
    3. Vous serez automatiquement connecté et redirigé vers votre espace
    
    ============================================
    IMPORTANT
    ============================================
    
    ⏰ Ce lien est valable pendant 7 jours. Après expiration, 
    vous devrez demander une nouvelle invitation.
    
    ============================================
    CE QUE VOUS POURREZ FAIRE
    ============================================
    
    ✓ Rechercher des candidats selon vos critères
    ✓ Consulter les profils détaillés avec les avis d'experts
    ✓ Gérer vos candidatures et suivis de recrutement
    ✓ Collaborer avec votre équipe de recrutement
    
    ============================================
    
    Lien d'activation : {invitation_url}
    
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

