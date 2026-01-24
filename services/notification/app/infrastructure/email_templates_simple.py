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
                                    Cet email a été envoyé automatiquement par <strong style="color: #226D68;">Yemma Solutions</strong>.<br>
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
    
    subject = f"Votre compte recruteur {company_name} - Définissez votre mot de passe"
    
    # Section lien de réinitialisation de mot de passe - Design amélioré sans emojis
    password_reset_section = f"""
        <div style="background: linear-gradient(135deg, #1ABC9C 0%, #0B3C5D 100%); border-radius: 16px; padding: 30px; margin: 30px 0; box-shadow: 0 4px 12px rgba(26, 188, 156, 0.3);">
            <div style="text-align: center; margin-bottom: 25px;">
                <div style="background-color: #ffffff; border-radius: 50%; width: 60px; height: 60px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 1L3 5V11C3 16.55 6.16 21.74 12 23C17.84 21.74 21 16.55 21 11V5L12 1ZM12 7C13.4 7 14.8 7.56 15.71 8.29L16.71 7.29C15.56 6.11 13.8 5.5 12 5.5C10.2 5.5 8.44 6.11 7.29 7.29L8.29 8.29C9.2 7.56 10.6 7 12 7ZM12 12.5C11.2 12.5 10.5 12.8 10 13.29L9 12.29C9.8 11.5 10.8 11 12 11C13.2 11 14.2 11.5 15 12.29L14 13.29C13.5 12.8 12.8 12.5 12 12.5Z" fill="#1ABC9C"/>
                    </svg>
                </div>
                <h2 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; font-family: 'Poppins', sans-serif; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                    Définissez votre mot de passe
                </h2>
                <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 14px; opacity: 0.95; font-family: 'Inter', 'Roboto', sans-serif;">
                    Votre compte a été créé. Cliquez sur le bouton ci-dessous pour définir votre mot de passe personnel
                </p>
            </div>
            
            <!-- Instructions -->
            <div style="background-color: rgba(255, 255, 255, 0.15); backdrop-filter: blur(10px); border-radius: 10px; padding: 20px; margin-top: 20px; border: 1px solid rgba(255, 255, 255, 0.3);">
                <h3 style="margin: 0 0 12px 0; color: #ffffff; font-size: 16px; font-weight: 600; font-family: 'Poppins', sans-serif;">
                    Comment procéder :
                </h3>
                <ol style="margin: 0; padding-left: 20px; color: #ffffff; font-size: 14px; line-height: 1.8; font-family: 'Inter', 'Roboto', sans-serif;">
                    <li style="margin: 6px 0;">Cliquez sur le bouton "Définir mon mot de passe" ci-dessous</li>
                    <li style="margin: 6px 0;">Entrez votre nouveau mot de passe sécurisé (minimum 8 caractères)</li>
                    <li style="margin: 6px 0;">Confirmez votre mot de passe</li>
                    <li style="margin: 6px 0;">Vous pourrez ensuite vous connecter avec votre email et votre nouveau mot de passe</li>
                </ol>
            </div>
            
            <!-- Avertissement -->
            <div style="background-color: rgba(255, 255, 255, 0.2); border-left: 4px solid #F2C94C; padding: 15px; margin: 20px 0 0 0; border-radius: 8px;">
                <p style="margin: 0; color: #ffffff; font-size: 13px; line-height: 1.6; font-family: 'Inter', 'Roboto', sans-serif;">
                    <strong>Important :</strong> Ce lien est valable pendant <strong>24 heures</strong>. Après expiration, vous devrez demander une nouvelle réinitialisation de mot de passe.
                </p>
            </div>
        </div>
        """
    
    content = f"""
    <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="margin: 0 0 10px 0; color: #0B3C5D; font-size: 28px; font-weight: 700; font-family: 'Poppins', sans-serif;">
            Bienvenue sur Yemma Solutions
        </h1>
        <p style="margin: 0; color: #666666; font-size: 16px; font-family: 'Inter', 'Roboto', sans-serif;">
            Votre compte recruteur pour <strong style="color: #1ABC9C;">{company_name}</strong> a été créé
        </p>
    </div>
    
    <p style="margin: 0 0 25px 0; color: #2C2C2C; font-size: 16px; line-height: 1.6; font-family: 'Inter', 'Roboto', sans-serif;">
        Bonjour <strong style="color: #0B3C5D;">{recipient_name}</strong>,
    </p>
    
    <p style="margin: 0 0 25px 0; color: #2C2C2C; font-size: 16px; line-height: 1.6; font-family: 'Inter', 'Roboto', sans-serif;">
        Nous sommes ravis de vous accueillir sur la plateforme <strong style="color: #1ABC9C;">Yemma Solutions</strong> ! Votre compte recruteur a été créé avec succès. Pour finaliser votre inscription, vous devez définir votre mot de passe personnel.
    </p>
    
    {password_reset_section}
    
    <div style="background: linear-gradient(135deg, #F4F6F8 0%, #ffffff 100%); border-left: 4px solid #1ABC9C; border-radius: 12px; padding: 25px; margin: 30px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
        <h3 style="margin: 0 0 20px 0; color: #0B3C5D; font-size: 18px; font-weight: 600; font-family: 'Poppins', sans-serif; border-bottom: 2px solid #1ABC9C; padding-bottom: 10px;">
            Fonctionnalités disponibles
        </h3>
        <ul style="margin: 0; padding-left: 20px; color: #2C2C2C; font-size: 15px; line-height: 2.2; font-family: 'Inter', 'Roboto', sans-serif; list-style: none;">
            <li style="margin: 12px 0; padding-left: 25px; position: relative;">
                <span style="position: absolute; left: 0; color: #1ABC9C; font-weight: bold;">•</span>
                <strong style="color: #0B3C5D;">Rechercher</strong> des candidats selon vos critères (compétences, expérience, localisation...)
            </li>
            <li style="margin: 12px 0; padding-left: 25px; position: relative;">
                <span style="position: absolute; left: 0; color: #1ABC9C; font-weight: bold;">•</span>
                <strong style="color: #0B3C5D;">Consulter</strong> les profils détaillés avec les avis d'experts
            </li>
            <li style="margin: 12px 0; padding-left: 25px; position: relative;">
                <span style="position: absolute; left: 0; color: #1ABC9C; font-weight: bold;">•</span>
                <strong style="color: #0B3C5D;">Gérer</strong> vos candidatures et suivis de recrutement
            </li>
            <li style="margin: 12px 0; padding-left: 25px; position: relative;">
                <span style="position: absolute; left: 0; color: #1ABC9C; font-weight: bold;">•</span>
                <strong style="color: #0B3C5D;">Collaborer</strong> avec votre équipe de recrutement
            </li>
    </ul>
    </div>
    
    <div style="background-color: #E3F2FD; border-left: 4px solid #1ABC9C; padding: 20px; margin: 25px 0; border-radius: 8px;">
        <h3 style="margin: 0 0 15px 0; color: #0B3C5D; font-size: 16px; font-weight: 600; font-family: 'Poppins', sans-serif;">
            Vos identifiants de connexion
        </h3>
        <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; margin: 10px 0; border: 1px solid #E0E0E0;">
            <div style="margin-bottom: 15px;">
                <p style="margin: 0 0 5px 0; color: #666666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; font-family: 'Inter', 'Roboto', sans-serif;">
                    Adresse email
                </p>
                <p style="margin: 0; color: #1ABC9C; font-size: 16px; font-weight: 600; font-family: 'Inter', 'Roboto', sans-serif;">
                    {recipient_email}
                </p>
            </div>
            {f'''<div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #E0E0E0;">
                <p style="margin: 0 0 5px 0; color: #666666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; font-family: 'Inter', 'Roboto', sans-serif;">
                    Mot de passe temporaire
                </p>
                <p style="margin: 0; color: #2C2C2C; font-size: 16px; font-weight: 600; font-family: 'Courier New', monospace; background-color: #F4F6F8; padding: 8px 12px; border-radius: 4px; display: inline-block; border: 1px solid #E0E0E0;">
                    {temporary_password}
                </p>
            </div>
            <div style="background-color: #FFF3CD; border-left: 4px solid #F2C94C; padding: 12px; margin: 15px 0 0 0; border-radius: 6px;">
                <p style="margin: 0; color: #856404; font-size: 13px; line-height: 1.5; font-family: 'Inter', 'Roboto', sans-serif;">
                    <strong>Important :</strong> Ce mot de passe est temporaire. Nous vous recommandons fortement de le changer dès votre première connexion en utilisant le lien ci-dessus.
                </p>
            </div>''' if temporary_password else ''}
        </div>
    </div>
    """
    
    html = get_base_template(
        title="Votre compte recruteur",
        content=content,
        button_text="Définir mon mot de passe",
        button_url=invitation_url,  # Lien vers la page de réinitialisation de mot de passe
        header_color="#1ABC9C"  # Vert émeraude pour plus de visibilité
    )
    
    text = f"""
    ============================================
    BIENVENUE SUR YEMMA SOLUTIONS
    ============================================
    
    Bonjour {recipient_name},
    
    Nous sommes ravis de vous accueillir sur la plateforme Yemma Solutions !
    Votre compte recruteur pour {company_name} a été créé avec succès.
    
    ============================================
    DÉFINISSEZ VOTRE MOT DE PASSE
    ============================================
    
    Pour finaliser votre inscription et accéder à votre espace recruteur, 
    vous devez définir votre mot de passe personnel en suivant ce lien :
    
    {invitation_url}
    
    ============================================
    COMMENT PROCÉDER
    ============================================
    
    1. Cliquez sur le lien ci-dessus ou copiez-le dans votre navigateur
    2. Entrez votre nouveau mot de passe sécurisé (minimum 8 caractères)
    3. Confirmez votre mot de passe
    4. Vous pourrez ensuite vous connecter avec votre email et votre nouveau mot de passe
    
    ============================================
    IMPORTANT
    ============================================
    
    Ce lien est valable pendant 24 heures. Après expiration, 
    vous devrez demander une nouvelle réinitialisation de mot de passe.
    
    ============================================
    VOS IDENTIFIANTS DE CONNEXION
    ============================================
    
    Email : {recipient_email}
    {f'Mot de passe temporaire : {temporary_password}' if temporary_password else ''}
    
    {f'''
    IMPORTANT : Ce mot de passe est temporaire. 
    Nous vous recommandons fortement de le changer dès votre première connexion 
    en utilisant le lien de réinitialisation ci-dessus.
    ''' if temporary_password else ''}
    
    ============================================
    FONCTIONNALITÉS DISPONIBLES
    ============================================
    
    - Rechercher des candidats selon vos critères
    - Consulter les profils détaillés avec les avis d'experts
    - Gérer vos candidatures et suivis de recrutement
    - Collaborer avec votre équipe de recrutement
    
    ============================================
    
    Lien de réinitialisation : {invitation_url}
    
    L'équipe Yemma Solutions
    """
    
    return subject, html, text


def get_candidate_welcome_template(data: Dict[str, Any]) -> tuple[str, str, str]:
    """
    Template d'email de bienvenue pour les candidats après complétion de l'onboarding
    Avec la charte graphique (#226D68 et #e76f51)
    """
    recipient_name = data.get("recipient_name", "Cher candidat")
    candidate_name = data.get("candidate_name", recipient_name)
    dashboard_url = data.get("dashboard_url", f"{settings.FRONTEND_URL}/candidate/dashboard")
    
    # Couleurs de la charte graphique
    primary_color = "#226D68"  # Vert principal
    secondary_color = "#e76f51"  # Orange secondaire
    primary_light = "#E8F4F3"
    secondary_light = "#FDF2F0"
    
    subject = "🎉 Bienvenue sur Yemma Solutions !"
    
    content = f"""
    <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 80px; height: 80px; margin: 0 auto 20px; background: linear-gradient(135deg, {primary_color} 0%, {secondary_color} 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(34, 109, 104, 0.3);">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white"/>
                <path d="M2 17L12 22L22 17" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </div>
        <h1 style="margin: 0 0 10px 0; color: {primary_color}; font-size: 28px; font-weight: 700; font-family: 'Poppins', sans-serif;">
            Bienvenue sur Yemma Solutions !
        </h1>
        <p style="margin: 0; color: #666666; font-size: 16px; font-family: 'Inter', 'Roboto', sans-serif;">
            Votre profil a été créé avec succès
        </p>
    </div>
    
    <p style="margin: 0 0 20px 0; color: #2C2C2C; font-size: 16px; line-height: 1.6; font-family: 'Inter', 'Roboto', sans-serif;">
        Bonjour <strong style="color: {primary_color};">{recipient_name}</strong>,
    </p>
    
    <p style="margin: 0 0 20px 0; color: #2C2C2C; font-size: 16px; line-height: 1.6; font-family: 'Inter', 'Roboto', sans-serif;">
        Félicitations ! Vous avez complété avec succès votre inscription sur <strong style="color: {primary_color};">Yemma Solutions</strong>. Votre profil candidat <strong>{candidate_name}</strong> est maintenant créé et prêt à être soumis pour validation.
    </p>
    
    <div style="background: linear-gradient(135deg, {primary_light} 0%, {secondary_light} 100%); border-left: 4px solid {primary_color}; border-radius: 12px; padding: 25px; margin: 25px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
        <h3 style="margin: 0 0 20px 0; color: {primary_color}; font-size: 18px; font-weight: 600; font-family: 'Poppins', sans-serif; border-bottom: 2px solid {primary_color}; padding-bottom: 10px;">
            Prochaines étapes
        </h3>
        <ul style="margin: 0; padding-left: 20px; color: #2C2C2C; font-size: 15px; line-height: 2.2; font-family: 'Inter', 'Roboto', sans-serif; list-style: none;">
            <li style="margin: 12px 0; padding-left: 25px; position: relative;">
                <span style="position: absolute; left: 0; color: {primary_color}; font-weight: bold; font-size: 20px;">✓</span>
                <strong style="color: {primary_color};">Soumettez votre profil</strong> pour validation par nos experts RH
            </li>
            <li style="margin: 12px 0; padding-left: 25px; position: relative;">
                <span style="position: absolute; left: 0; color: {primary_color}; font-weight: bold; font-size: 20px;">✓</span>
                <strong style="color: {primary_color};">Participez à un entretien</strong> de validation (si demandé)
            </li>
            <li style="margin: 12px 0; padding-left: 25px; position: relative;">
                <span style="position: absolute; left: 0; color: {primary_color}; font-weight: bold; font-size: 20px;">✓</span>
                <strong style="color: {primary_color};">Recevez des offres</strong> adaptées à votre profil
            </li>
            <li style="margin: 12px 0; padding-left: 25px; position: relative;">
                <span style="position: absolute; left: 0; color: {primary_color}; font-weight: bold; font-size: 20px;">✓</span>
                <strong style="color: {primary_color};">Connectez-vous</strong> avec des recruteurs de qualité
            </li>
        </ul>
    </div>
    
    <div style="background-color: #E3F2FD; border-left: 4px solid {secondary_color}; padding: 20px; margin: 25px 0; border-radius: 8px;">
        <h3 style="margin: 0 0 15px 0; color: {secondary_color}; font-size: 16px; font-weight: 600; font-family: 'Poppins', sans-serif;">
            💡 Astuce
        </h3>
        <p style="margin: 0; color: #2C2C2C; font-size: 14px; line-height: 1.6; font-family: 'Inter', 'Roboto', sans-serif;">
            Assurez-vous que votre profil est complet et à jour pour maximiser vos chances d'être contacté par les recruteurs. Un profil bien rempli augmente votre visibilité de <strong style="color: {secondary_color};">300%</strong> !
        </p>
    </div>
    
    <p style="margin: 30px 0 10px 0; color: #666666; font-size: 14px; line-height: 1.6; font-family: 'Inter', 'Roboto', sans-serif; text-align: center;">
        Nous sommes ravis de vous accompagner dans votre recherche d'emploi. Bonne chance !
    </p>
    """
    
    html = get_base_template(
        title="Bienvenue sur Yemma Solutions",
        content=content,
        button_text="Accéder à mon tableau de bord",
        button_url=dashboard_url,
        header_color=primary_color
    )
    
    text = f"""
    ============================================
    BIENVENUE SUR YEMMA SOLUTIONS
    ============================================
    
    Bonjour {recipient_name},
    
    Félicitations ! Vous avez complété avec succès votre inscription sur Yemma Solutions. 
    Votre profil candidat {candidate_name} est maintenant créé et prêt à être soumis pour validation.
    
    ============================================
    PROCHAINES ÉTAPES
    ============================================
    
    ✓ Soumettez votre profil pour validation par nos experts RH
    ✓ Participez à un entretien de validation (si demandé)
    ✓ Recevez des offres adaptées à votre profil
    ✓ Connectez-vous avec des recruteurs de qualité
    
    ============================================
    ASTUCE
    ============================================
    
    Assurez-vous que votre profil est complet et à jour pour maximiser vos chances 
    d'être contacté par les recruteurs. Un profil bien rempli augmente votre visibilité de 300% !
    
    ============================================
    
    Accéder à mon tableau de bord : {dashboard_url}
    
    Nous sommes ravis de vous accompagner dans votre recherche d'emploi. Bonne chance !
    
    L'équipe Yemma Solutions
    """
    
    return subject, html, text


def get_company_welcome_template(data: Dict[str, Any]) -> tuple[str, str, str]:
    """
    Template d'email de bienvenue pour les entreprises/recruteurs après création du compte
    Avec la charte graphique (#226D68 et #e76f51)
    """
    recipient_name = data.get("recipient_name", "Cher recruteur")
    company_name = data.get("company_name", "")
    dashboard_url = data.get("dashboard_url", f"{settings.FRONTEND_URL}/company/dashboard")
    
    # Couleurs de la charte graphique
    primary_color = "#226D68"  # Vert principal
    secondary_color = "#e76f51"  # Orange secondaire
    primary_light = "#E8F4F3"
    secondary_light = "#FDF2F0"
    
    subject = "🎉 Bienvenue sur Yemma Solutions !"
    
    content = f"""
    <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 80px; height: 80px; margin: 0 auto 20px; background: linear-gradient(135deg, {primary_color} 0%, {secondary_color} 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(34, 109, 104, 0.3);">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 7H4C2.9 7 2 7.9 2 9V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V9C22 7.9 21.1 7 20 7Z" fill="white"/>
                <path d="M12 13C13.1 13 14 12.1 14 11C14 9.9 13.1 9 12 9C10.9 9 10 9.9 10 11C10 12.1 10.9 13 12 13Z" fill="{primary_color}"/>
            </svg>
        </div>
        <h1 style="margin: 0 0 10px 0; color: {primary_color}; font-size: 28px; font-weight: 700; font-family: 'Poppins', sans-serif;">
            Bienvenue sur Yemma Solutions !
        </h1>
        <p style="margin: 0; color: #666666; font-size: 16px; font-family: 'Inter', 'Roboto', sans-serif;">
            Votre compte entreprise <strong style="color: {primary_color};">{company_name}</strong> a été créé avec succès
        </p>
    </div>
    
    <p style="margin: 0 0 20px 0; color: #2C2C2C; font-size: 16px; line-height: 1.6; font-family: 'Inter', 'Roboto', sans-serif;">
        Bonjour <strong style="color: {primary_color};">{recipient_name}</strong>,
    </p>
    
    <p style="margin: 0 0 20px 0; color: #2C2C2C; font-size: 16px; line-height: 1.6; font-family: 'Inter', 'Roboto', sans-serif;">
        Nous sommes ravis de vous accueillir sur <strong style="color: {primary_color};">Yemma Solutions</strong> ! Votre compte entreprise <strong>{company_name}</strong> a été créé avec succès. Vous pouvez maintenant accéder à notre plateforme de recrutement nouvelle génération.
    </p>
    
    <div style="background: linear-gradient(135deg, {primary_light} 0%, {secondary_light} 100%); border-left: 4px solid {primary_color}; border-radius: 12px; padding: 25px; margin: 25px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
        <h3 style="margin: 0 0 20px 0; color: {primary_color}; font-size: 18px; font-weight: 600; font-family: 'Poppins', sans-serif; border-bottom: 2px solid {primary_color}; padding-bottom: 10px;">
            Fonctionnalités disponibles
        </h3>
        <ul style="margin: 0; padding-left: 20px; color: #2C2C2C; font-size: 15px; line-height: 2.2; font-family: 'Inter', 'Roboto', sans-serif; list-style: none;">
            <li style="margin: 12px 0; padding-left: 25px; position: relative;">
                <span style="position: absolute; left: 0; color: {primary_color}; font-weight: bold; font-size: 20px;">✓</span>
                <strong style="color: {primary_color};">Recherchez</strong> des candidats selon vos critères (compétences, expérience, localisation...)
            </li>
            <li style="margin: 12px 0; padding-left: 25px; position: relative;">
                <span style="position: absolute; left: 0; color: {primary_color}; font-weight: bold; font-size: 20px;">✓</span>
                <strong style="color: {primary_color};">Consultez</strong> les profils détaillés avec les avis d'experts RH
            </li>
            <li style="margin: 12px 0; padding-left: 25px; position: relative;">
                <span style="position: absolute; left: 0; color: {primary_color}; font-weight: bold; font-size: 20px;">✓</span>
                <strong style="color: {primary_color};">Gérez</strong> vos candidatures et suivis de recrutement
            </li>
            <li style="margin: 12px 0; padding-left: 25px; position: relative;">
                <span style="position: absolute; left: 0; color: {primary_color}; font-weight: bold; font-size: 20px;">✓</span>
                <strong style="color: {primary_color};">Collaborez</strong> avec votre équipe de recrutement
            </li>
        </ul>
    </div>
    
    <div style="background-color: #E3F2FD; border-left: 4px solid {secondary_color}; padding: 20px; margin: 25px 0; border-radius: 8px;">
        <h3 style="margin: 0 0 15px 0; color: {secondary_color}; font-size: 16px; font-weight: 600; font-family: 'Poppins', sans-serif;">
            💡 Pourquoi choisir Yemma ?
        </h3>
        <ul style="margin: 0; padding-left: 20px; color: #2C2C2C; font-size: 14px; line-height: 1.8; font-family: 'Inter', 'Roboto', sans-serif;">
            <li style="margin: 8px 0;"><strong style="color: {secondary_color};">100% des profils vérifiés</strong> par nos experts RH</li>
            <li style="margin: 8px 0;"><strong style="color: {secondary_color};">Économisez jusqu'à 60%</strong> sur vos coûts de recrutement</li>
            <li style="margin: 8px 0;"><strong style="color: {secondary_color};">Temps de recrutement réduit</strong> de 3x par rapport aux méthodes classiques</li>
            <li style="margin: 8px 0;"><strong style="color: {secondary_color};">Matching intelligent</strong> par IA pour trouver les meilleurs profils</li>
        </ul>
    </div>
    
    <p style="margin: 30px 0 10px 0; color: #666666; font-size: 14px; line-height: 1.6; font-family: 'Inter', 'Roboto', sans-serif; text-align: center;">
        Nous sommes là pour vous accompagner dans votre recrutement. N'hésitez pas à nous contacter si vous avez des questions !
    </p>
    """
    
    html = get_base_template(
        title="Bienvenue sur Yemma Solutions",
        content=content,
        button_text="Accéder à mon tableau de bord",
        button_url=dashboard_url,
        header_color=primary_color
    )
    
    text = f"""
    ============================================
    BIENVENUE SUR YEMMA SOLUTIONS
    ============================================
    
    Bonjour {recipient_name},
    
    Nous sommes ravis de vous accueillir sur Yemma Solutions ! 
    Votre compte entreprise {company_name} a été créé avec succès. 
    Vous pouvez maintenant accéder à notre plateforme de recrutement nouvelle génération.
    
    ============================================
    FONCTIONNALITÉS DISPONIBLES
    ============================================
    
    ✓ Recherchez des candidats selon vos critères (compétences, expérience, localisation...)
    ✓ Consultez les profils détaillés avec les avis d'experts RH
    ✓ Gérez vos candidatures et suivis de recrutement
    ✓ Collaborez avec votre équipe de recrutement
    
    ============================================
    POURQUOI CHOISIR YEMMA ?
    ============================================
    
    • 100% des profils vérifiés par nos experts RH
    • Économisez jusqu'à 60% sur vos coûts de recrutement
    • Temps de recrutement réduit de 3x par rapport aux méthodes classiques
    • Matching intelligent par IA pour trouver les meilleurs profils
    
    ============================================
    
    Accéder à mon tableau de bord : {dashboard_url}
    
    Nous sommes là pour vous accompagner dans votre recrutement. 
    N'hésitez pas à nous contacter si vous avez des questions !
    
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
        "candidate_welcome": get_candidate_welcome_template,
        "company_welcome": get_company_welcome_template,
    }
    
    template_func = templates.get(notification_type)
    if not template_func:
        # Fallback vers les anciens templates si le type n'est pas trouvé
        from app.infrastructure.email_templates import get_email_template as get_old_template
        return get_old_template(notification_type, data)
    
    return template_func(data)

