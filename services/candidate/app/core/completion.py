"""
Logique de calcul du pourcentage de complétion du profil
Algorithme pondéré : les sections obligatoires (Identité, CV, Expériences) pèsent plus lourd
"""
from typing import Optional
from app.domain.models import Profile, Experience, Education, Certification, Skill, JobPreference


def calculate_completion_percentage(profile: Profile, has_cv: bool = False) -> float:
    """
    Calcule le pourcentage de complétion du profil candidat avec algorithme pondéré
    
    Algorithme complexe de complétion :
    - Identité : 20%
    - Expériences : 30%
    - Formations : 15%
    - CV PDF : 25%
    - Préférences : 10%
    
    Total: 100%
    
    Args:
        profile: Le profil à évaluer
        has_cv: True si un CV PDF a été uploadé (vérifié via service Document)
    
    Returns:
        float: Pourcentage de complétion (0-100)
    """
    import logging
    logger = logging.getLogger(__name__)
    total_percentage = 0.0
    
    # ============================================
    # 1. IDENTITÉ : 20%
    # ============================================
    identity_points = 0
    identity_max = 0
    
    # Champs obligatoires d'identité
    if profile.first_name:
        identity_points += 1
    identity_max += 1
    
    if profile.last_name:
        identity_points += 1
    identity_max += 1
    
    if profile.email:
        identity_points += 1
    identity_max += 1
    
    if profile.date_of_birth:
        identity_points += 1
    identity_max += 1
    
    if profile.nationality:
        identity_points += 1
    identity_max += 1
    
    if profile.phone:
        identity_points += 1
    identity_max += 1
    
    # Adresse complète
    if profile.address:
        identity_points += 0.5
    identity_max += 0.5
    
    if profile.city:
        identity_points += 0.5
    identity_max += 0.5
    
    if profile.country:
        identity_points += 0.5
    identity_max += 0.5
    
    # Profil professionnel (partie identité)
    if profile.profile_title:
        identity_points += 1.5
    identity_max += 1.5
    
    if profile.professional_summary:
        # Résumé professionnel : minimum 300 caractères pour être considéré complet
        if len(profile.professional_summary) >= 300:
            identity_points += 2
        elif len(profile.professional_summary) >= 150:
            identity_points += 1
        identity_max += 2
    
    if profile.sector:
        identity_points += 1
    identity_max += 1
    
    if profile.main_job:
        identity_points += 1
    identity_max += 1
    
    if profile.total_experience is not None and profile.total_experience >= 0:
        identity_points += 1
    identity_max += 1
    
    # Consentements (nécessaires pour l'identité complète)
    if profile.accept_cgu:
        identity_points += 0.5
    identity_max += 0.5
    
    if profile.accept_rgpd:
        identity_points += 0.5
    identity_max += 0.5
    
    if profile.accept_verification:
        identity_points += 0.5
    identity_max += 0.5
    
    # Calcul du pourcentage pour l'identité
    if identity_max > 0:
        identity_percentage = (identity_points / identity_max) * 20.0
        total_percentage += identity_percentage
        logger.debug(f"Identité: {identity_points}/{identity_max} = {identity_percentage:.2f}%")
    
    # ============================================
    # 2. EXPÉRIENCES : 30% (minimum 1 avec document)
    # ============================================
    exp_score = 0.0  # Initialiser pour le logging
    if profile.experiences and len(profile.experiences) > 0:
        complete_experiences = 0
        experiences_with_doc = 0
        
        for exp in profile.experiences:
            # Une expérience est complète si elle a au minimum :
            # - Nom de l'entreprise
            # - Poste
            # - Date de début
            # - Date de fin OU is_current = True
            is_complete = (
                exp.company_name and
                exp.position and
                exp.start_date and
                (exp.end_date or exp.is_current)
            )
            
            if is_complete:
                complete_experiences += 1
                # Compter les expériences avec document justificatif
                if exp.has_document or exp.document_id:
                    experiences_with_doc += 1
        
        if complete_experiences > 0:
            # Score basé sur le nombre d'expériences complètes
            # - 1 expérience complète = 50% de la section (15% du total)
            # - 2 expériences complètes = 75% de la section (22.5% du total)
            # - 3+ expériences complètes = 100% de la section (30% du total)
            if complete_experiences >= 3:
                exp_score = 1.0
            elif complete_experiences == 2:
                exp_score = 0.75
            elif complete_experiences == 1:
                exp_score = 0.5
            else:
                exp_score = 0.0
            
            # Bonus si au moins 1 expérience a un document justificatif
            if experiences_with_doc >= 1:
                # Bonus de 10% si au moins 1 expérience a un document
                exp_score = min(exp_score + 0.1, 1.0)
            
            # Bonus pour expériences avec description détaillée
            detailed_experiences = sum(
                1 for exp in profile.experiences
                if exp.description and len(exp.description) >= 100
            )
            if detailed_experiences > 0 and complete_experiences >= 2:
                # Bonus de 5% si au moins 2 expériences ont une description détaillée
                exp_score = min(exp_score + 0.05, 1.0)
            
            total_percentage += exp_score * 30.0
            logger.debug(f"Expériences: {complete_experiences} complètes, {experiences_with_doc} avec doc, score={exp_score} = {exp_score * 30.0:.2f}%")
    # Si pas d'expériences, 0% pour cette section
    
    # ============================================
    # 3. FORMATIONS : 15%
    # ============================================
    edu_score = 0.0  # Initialiser pour le logging
    if profile.educations and len(profile.educations) > 0:
        complete_educations = 0
        total_educations = len(profile.educations)
        
        for edu in profile.educations:
            # Une formation est complète si elle a :
            # - Diplôme
            # - Institution
            # - Année d'obtention
            # - Niveau
            is_complete = (
                edu.diploma and
                edu.institution and
                edu.graduation_year and
                edu.level
            )
            
            if is_complete:
                complete_educations += 1
        
        if complete_educations > 0:
            # Score basé sur le nombre de formations complètes
            # - 1 formation complète = 60% de la section (9% du total)
            # - 2+ formations complètes = 100% de la section (15% du total)
            if complete_educations >= 2:
                edu_score = 1.0
            elif complete_educations == 1:
                edu_score = 0.6
            else:
                edu_score = 0.0
            
            total_percentage += edu_score * 15.0
            logger.debug(f"Formations: {complete_educations} complètes, score={edu_score} = {edu_score * 15.0:.2f}%")
    # Si pas de formations, 0% pour cette section
    
    # ============================================
    # 4. CV PDF : 25%
    # ============================================
    if has_cv:
        # Si un CV PDF existe, la section est complète à 100%
        total_percentage += 25.0
        logger.debug(f"CV PDF: présent = 25.0%")
    else:
        logger.debug(f"CV PDF: absent = 0.0%")
    # Si pas de CV, 0% pour cette section
    
    # ============================================
    # 5. PRÉFÉRENCES : 10%
    # ============================================
    pref_percentage = 0.0  # Initialiser pour le logging
    if profile.job_preferences:
        pref_points = 0
        pref_max = 0
        
        # Champs obligatoires
        if profile.job_preferences.contract_type:
            pref_points += 2
        pref_max += 2
        
        if profile.job_preferences.desired_location:
            pref_points += 2
        pref_max += 2
        
        if profile.job_preferences.availability:
            pref_points += 2
        pref_max += 2
        
        # Accepter salary_expectations (ancien format) ou salary_min/salary_max (nouveau format)
        if profile.job_preferences.salary_expectations is not None:
            pref_points += 2
            pref_max += 2
        elif (profile.job_preferences.salary_min is not None or 
              profile.job_preferences.salary_max is not None):
            # Si salary_min ou salary_max est défini, considérer comme complété
            pref_points += 2
            pref_max += 2
        
        # Champs optionnels (bonus)
        if profile.job_preferences.desired_positions and len(profile.job_preferences.desired_positions) > 0:
            pref_points += 1
        pref_max += 1
        
        if profile.job_preferences.target_sectors and len(profile.job_preferences.target_sectors) > 0:
            pref_points += 1
        pref_max += 1
        
        if profile.job_preferences.mobility:
            pref_points += 0.5
        pref_max += 0.5
        
        # Calcul du pourcentage pour les préférences
        if pref_max > 0:
            pref_percentage = (pref_points / pref_max) * 10.0
            total_percentage += pref_percentage
            logger.debug(f"Préférences: {pref_points}/{pref_max} = {pref_percentage:.2f}%")
    # Si pas de préférences, 0% pour cette section
    
    # Retourner le pourcentage total (max 100%)
    final_percentage = min(round(total_percentage, 2), 100.0)
    
    # Calculer les pourcentages pour le logging (même si les sections sont à 0)
    identity_pct = (identity_points / identity_max) * 20.0 if identity_max > 0 else 0.0
    exp_pct = exp_score * 30.0
    edu_pct = edu_score * 15.0
    cv_pct = 25.0 if has_cv else 0.0
    pref_pct = pref_percentage
    
    logger.info(f"Completion total calculé: {final_percentage}% (Identité: {identity_pct:.1f}%, Exp: {exp_pct:.1f}%, Form: {edu_pct:.1f}%, CV: {cv_pct:.1f}%, Préf: {pref_pct:.1f}%)")
    return final_percentage


def calculate_completion_score(profile: Profile, has_cv: bool = False) -> float:
    """
    Alias pour calculate_completion_percentage
    
    Calcule le score de complétion du profil (0-100)
    
    Args:
        profile: Le profil à évaluer
        has_cv: True si un CV PDF a été uploadé
    
    Returns:
        float: Score de complétion (0-100)
    """
    return calculate_completion_percentage(profile, has_cv)


async def check_cv_exists(profile_id: int) -> bool:
    """
    Vérifie si un CV PDF existe pour le profil via le service Document
    
    Args:
        profile_id: ID du profil
    
    Returns:
        True si un CV PDF existe, False sinon
    """
    import logging
    logger = logging.getLogger(__name__)
    try:
        import httpx
        import sys
        import os
        
        # Ajouter le chemin du module shared au PYTHONPATH
        shared_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
            "shared"
        )
        if shared_path not in sys.path:
            sys.path.insert(0, shared_path)
        
        # Importer depuis /shared
        import sys
        import os
        import importlib.util
        shared_path = "/shared"
        if shared_path not in sys.path:
            sys.path.insert(0, shared_path)
        internal_auth_path = os.path.join(shared_path, "internal_auth.py")
        if os.path.exists(internal_auth_path):
            spec = importlib.util.spec_from_file_location("shared.internal_auth", internal_auth_path)
            if spec and spec.loader:
                internal_auth_module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(internal_auth_module)
                get_service_token_header = internal_auth_module.get_service_token_header
            else:
                from shared.internal_auth import get_service_token_header
        else:
            from shared.internal_auth import get_service_token_header
        from app.core.config import settings
        
        # Générer les headers avec le token de service
        headers = get_service_token_header("candidate-service")
        
        # Appeler le service Document pour vérifier la présence d'un CV
        document_url = f"{settings.DOCUMENT_SERVICE_URL}/api/v1/documents/candidate/{profile_id}"
        logger.debug(f"Vérification CV pour profil {profile_id}: GET {document_url}")
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(document_url, headers=headers)
            
            if response.status_code == 200:
                documents = response.json()
                cv_documents = [doc for doc in documents if doc.get("document_type") == "CV"]
                has_cv = len(cv_documents) > 0
                logger.info(f"Vérification CV pour profil {profile_id}: {len(cv_documents)} CV trouvé(s), has_cv={has_cv}")
                return has_cv
            else:
                logger.warning(f"Erreur lors de la vérification du CV pour profil {profile_id}: status_code={response.status_code}")
                return False
    except Exception as e:
        # En cas d'erreur, on considère qu'il n'y a pas de CV
        logger.warning(f"Erreur lors de la vérification du CV pour profil {profile_id}: {str(e)}", exc_info=True)
        return False
    
    return False


def can_submit_profile(profile: Profile, has_cv: bool = False, min_completion: float = 80.0) -> tuple:
    """
    Vérifie si un profil peut être soumis pour validation
    
    Vérifie uniquement les champs obligatoires (marqués avec *) :
    - Étape 0 : Consentements (CGU, RGPD, vérification)
    - Étape 1 : Identité complète (prénom, nom, email, date de naissance, nationalité, téléphone, adresse, titre, résumé, secteur, métier, expérience)
    - Étape 2 : Au moins une expérience professionnelle complète
    - Étape 6 : CV PDF obligatoire
    - Étape 7 : Préférences (type de contrat, localisation, disponibilité, prétentions salariales)
    
    Args:
        profile: Le profil à vérifier
        has_cv: True si un CV PDF a été uploadé (vérifié via service Document)
        min_completion: Paramètre ignoré (conservé pour compatibilité)
    
    Returns:
        Tuple (can_submit: bool, reason: str)
    """
    # Vérification obligatoire : CV PDF doit être présent
    if not has_cv:
        return False, "Un CV PDF est obligatoire pour soumettre le profil"
    
    # Vérifications obligatoires - Étape 0 (Consentements)
    if not profile.accept_cgu or not profile.accept_rgpd or not profile.accept_verification:
        return False, "Les consentements (CGU, RGPD, vérification) doivent être acceptés"
    
    # Vérifications obligatoires - Étape 1 (Identité/Profil général)
    if not profile.first_name or not profile.last_name:
        return False, "Le prénom et le nom sont obligatoires"
    
    if not profile.email:
        return False, "L'email est obligatoire"
    
    if not profile.date_of_birth:
        return False, "La date de naissance est obligatoire"
    
    if not profile.nationality:
        return False, "La nationalité est obligatoire"
    
    if not profile.phone:
        return False, "Le téléphone est obligatoire"
    
    if not profile.address or not profile.city or not profile.country:
        return False, "L'adresse complète (adresse, ville, pays) est obligatoire"
    
    if not profile.profile_title:
        return False, "Le titre du profil est obligatoire"
    
    if not profile.professional_summary or len(profile.professional_summary) < 300:
        return False, "Le résumé professionnel (minimum 300 caractères) est obligatoire (Étape 1)"
    
    if not profile.sector:
        return False, "Le secteur d'activité est obligatoire"
    
    if not profile.main_job:
        return False, "Le métier principal est obligatoire"
    
    if profile.total_experience is None:
        return False, "Les années d'expérience totale sont obligatoires (Étape 1)"
    
    # Vérifications obligatoires - Étape 2 (Expériences)
    if not profile.experiences or len(profile.experiences) == 0:
        return False, "Au moins une expérience professionnelle est requise"
    
    # Vérifier que les expériences sont complètes (champs obligatoires uniquement)
    for exp in profile.experiences:
        if not exp.company_name or not exp.position or not exp.start_date:
            return False, "Toutes les expériences doivent avoir au minimum : entreprise, poste et date de début"
        if not exp.is_current and not exp.end_date:
            return False, "Les expériences terminées doivent avoir une date de fin"
    
    # Vérifications obligatoires - Étape 3 (Formations)
    if not profile.educations or len(profile.educations) == 0:
        return False, "Au moins une formation est requise (Étape 3)"
    
    # Vérifier que les formations sont complètes
    for edu in profile.educations:
        if not edu.diploma or not edu.institution or not edu.graduation_year or not edu.level:
            return False, "Toutes les formations doivent avoir : diplôme, établissement, année d'obtention et niveau (Étape 3)"
    
    # Vérifications obligatoires - Étape 5 (Compétences)
    if not profile.skills or len(profile.skills) == 0:
        return False, "Au moins une compétence technique est requise (Étape 5)"
    
    # Vérifier que les compétences sont complètes
    for skill in profile.skills:
        if not skill.name or not skill.level:
            return False, "Toutes les compétences doivent avoir un nom et un niveau (Étape 5)"
    
    # Vérifications obligatoires - Étape 7 (Préférences)
    if not profile.job_preferences:
        return False, "Les préférences de recherche d'emploi sont requises (Étape 7)"
    
    if not profile.job_preferences.contract_type:
        return False, "Le type de contrat souhaité est obligatoire (Étape 7)"
    
    if not profile.job_preferences.desired_location:
        return False, "La localisation souhaitée est obligatoire (Étape 7)"
    
    if not profile.job_preferences.availability:
        return False, "La disponibilité est obligatoire (Étape 7)"
    
    # Vérifier les postes recherchés (au moins 1 requis selon le schéma frontend)
    if not profile.job_preferences.desired_positions or len(profile.job_preferences.desired_positions) == 0:
        return False, "Au moins un poste recherché est obligatoire (Étape 7)"
    
    # Accepter salary_expectations (ancien format) ou salary_min/salary_max (nouveau format)
    has_salary = (
        profile.job_preferences.salary_expectations is not None or
        profile.job_preferences.salary_min is not None or
        profile.job_preferences.salary_max is not None
    )
    if not has_salary:
        return False, "Les prétentions salariales (min ou max) sont obligatoires (Étape 7)"
    
    return True, "Le profil peut être soumis"

