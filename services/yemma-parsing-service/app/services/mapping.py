"""
Mapper HRFlow.ai Profile -> Format Yemma

Ce module convertit les données parsées par HRFlow au format
attendu par le dashboard Yemma (profil + expériences + formations + compétences).

La structure HRFlow peut varier selon les CV, on gère plusieurs formats possibles.
"""
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from app.models.schemas import (
    ProfileOutput,
    ExperienceOutput,
    EducationOutput,
    SkillOutput,
    CertificationOutput,
    ParsedCVResponse,
    SkillLevel,
    SkillType,
)

logger = logging.getLogger(__name__)


def _get(obj: dict, *keys: str, default=None) -> Any:
    """Récupère une valeur en essayant plusieurs clés (snake_case et camelCase)."""
    if not isinstance(obj, dict):
        return default
    for k in keys:
        if k in obj and obj[k] is not None and obj[k] != "":
            return obj[k]
    return default


def _parse_date(s: Any) -> Optional[datetime]:
    """Parse une date string (YYYY-MM-DD ou ISO) en datetime."""
    if s is None:
        return None
    if isinstance(s, datetime):
        return s
    if not isinstance(s, str) or not s.strip():
        return None
    s = s.strip()[:10]
    try:
        return datetime.strptime(s, "%Y-%m-%d")
    except ValueError:
        try:
            return datetime.strptime(s, "%d/%m/%Y")
        except ValueError:
            return None


def _parse_year(s: Any) -> Optional[int]:
    """Extrait une année d'une chaîne ou int."""
    if s is None:
        return None
    if isinstance(s, int) and 1900 <= s <= 2100:
        return s
    if isinstance(s, str):
        for part in s.replace(",", " ").split():
            if part.isdigit() and len(part) == 4:
                return int(part)
    return None


def _normalize_skill_level(level: Any) -> Optional[SkillLevel]:
    """Normalise le niveau de compétence vers l'enum Yemma."""
    if not level:
        return None
    if isinstance(level, dict):
        level = level.get("name") or level.get("value") or level.get("label")
    if not isinstance(level, str):
        return None

    level = level.upper().strip()
    level_mapping = {
        "BEGINNER": SkillLevel.BEGINNER,
        "DEBUTANT": SkillLevel.BEGINNER,
        "NOVICE": SkillLevel.BEGINNER,
        "JUNIOR": SkillLevel.BEGINNER,
        "INTERMEDIATE": SkillLevel.INTERMEDIATE,
        "INTERMEDIAIRE": SkillLevel.INTERMEDIATE,
        "MID": SkillLevel.INTERMEDIATE,
        "ADVANCED": SkillLevel.ADVANCED,
        "AVANCE": SkillLevel.ADVANCED,
        "SENIOR": SkillLevel.ADVANCED,
        "EXPERT": SkillLevel.EXPERT,
        "MASTER": SkillLevel.EXPERT,
    }
    return level_mapping.get(level, SkillLevel.INTERMEDIATE)


def _detect_skill_type(skill_data: dict) -> SkillType:
    """Détecte le type de compétence depuis les données HRFlow."""
    skill_type_raw = _get(skill_data, "type", "category", "skill_type")
    if skill_type_raw and isinstance(skill_type_raw, str):
        skill_type_lower = skill_type_raw.lower()
        if "soft" in skill_type_lower or "behavioral" in skill_type_lower or "interpersonal" in skill_type_lower:
            return SkillType.SOFT
        if "tool" in skill_type_lower or "software" in skill_type_lower:
            return SkillType.TOOL
    return SkillType.TECHNICAL


def map_hrflow_profile(hrflow_data: dict, email_override: Optional[str] = None) -> ProfileOutput:
    """
    Construit ProfileOutput à partir du profil HRFlow.

    Args:
        hrflow_data: Données brutes du profil HRFlow
        email_override: Email du compte (auth) pour garantir cohérence

    Returns:
        ProfileOutput au format Yemma
    """
    # Naviguer dans la structure HRFlow
    profile = hrflow_data.get("profile") or hrflow_data
    info = profile.get("info") or profile.get("Information") or profile.get("information") or {}
    if isinstance(info, list):
        info = info[0] if info else {}
    if not isinstance(info, dict):
        info = {}

    # Nom : essayer plusieurs formats
    name_obj = info.get("name") or {}
    if isinstance(name_obj, dict):
        first = _get(name_obj, "first_name", "firstName", "first") or _get(info, "first_name", "firstName")
        last = _get(name_obj, "last_name", "lastName", "last") or _get(info, "last_name", "lastName")
    else:
        first = _get(info, "first_name", "firstName")
        last = _get(info, "last_name", "lastName")

    if not first and not last:
        full = _get(info, "full_name", "fullName") or _get(profile, "name") or (name_obj if isinstance(name_obj, str) else None)
        if isinstance(full, str):
            parts = full.strip().split(None, 1)
            first = parts[0] if parts else None
            last = parts[1] if len(parts) > 1 else None

    # Email : priorité à l'email du compte
    email = email_override
    if not email:
        email = _get(info, "email", "emails")
        if isinstance(email, list):
            email = email[0] if email else None

    # Téléphone
    phone = _get(info, "phone", "phones", "phone_number", "phoneNumber", "mobile", "tel")
    if isinstance(phone, list):
        phone = phone[0] if phone else None
    if phone and isinstance(phone, str):
        phone = "".join(c for c in phone if c.isdigit() or c in "+()")

    # Localisation
    location = info.get("location") or info.get("locations") or info.get("address") or {}
    if isinstance(location, list):
        location = location[0] if location else {}
    if not isinstance(location, dict):
        location = {}

    address = _get(location, "address", "street", "full", "text", "formatted") or _get(info, "address", "street")
    if isinstance(address, dict):
        address = address.get("text") or address.get("formatted")

    city = _get(location, "city", "city_name", "cityName") or _get(info, "city")
    if isinstance(city, dict):
        city = city.get("name")

    country = _get(location, "country", "country_code", "countryCode") or _get(info, "country")
    if isinstance(country, dict):
        country = country.get("name") or country.get("code")

    # Profil professionnel
    profile_title = (
        _get(info, "profile_title", "profileTitle", "headline", "title", "job_title") or
        _get(profile, "headline", "title")
    )
    if isinstance(profile_title, dict):
        profile_title = profile_title.get("name") or profile_title.get("label")

    professional_summary = (
        _get(info, "summary", "summary_additional", "professional_summary", "bio", "about", "description") or
        _get(profile, "summary", "description")
    )
    if isinstance(professional_summary, list):
        professional_summary = "\n".join(str(s) for s in professional_summary if s)

    sector = _get(info, "sector", "industry", "industry_sector", "field")
    if isinstance(sector, dict):
        sector = sector.get("name") or sector.get("label")

    main_job = _get(info, "main_job", "current_job", "position") or _get(profile, "title", "position")
    if isinstance(main_job, dict):
        main_job = main_job.get("name") or main_job.get("label")

    # Date de naissance
    date_birth_raw = _get(info, "date_of_birth", "dateOfBirth", "birth_date", "birthDate", "birthday")
    date_birth = _parse_date(date_birth_raw)

    # Nationalité
    nationality = _get(info, "nationality", "nationality_code", "citizenship")
    if isinstance(nationality, dict):
        nationality = nationality.get("name") or nationality.get("code")

    # Années d'expérience totale
    total_exp = _get(info, "total_years_experience", "years_of_experience", "experience_years")

    # Photo de profil
    photo_url = (
        _get(info, "picture", "photo", "photo_url", "picture_url", "avatar", "image") or
        _get(profile, "picture", "photo", "photo_url", "picture_url", "avatar")
    )
    if isinstance(photo_url, dict):
        photo_url = photo_url.get("url") or photo_url.get("src")

    return ProfileOutput(
        first_name=(first or "").strip() or None,
        last_name=(last or "").strip() or None,
        email=email,
        phone=phone,
        photo_url=photo_url,
        address=address,
        city=city,
        country=country,
        profile_title=profile_title,
        professional_summary=professional_summary,
        sector=sector,
        main_job=main_job,
        date_of_birth=date_birth,
        nationality=nationality,
        total_experience=int(total_exp) if total_exp else None,
    )


def map_hrflow_experiences(hrflow_data: dict) -> List[ExperienceOutput]:
    """
    Construit la liste des expériences au format Yemma.

    Args:
        hrflow_data: Données brutes du profil HRFlow

    Returns:
        Liste d'ExperienceOutput
    """
    profile = hrflow_data.get("profile") or hrflow_data
    experiences = profile.get("experiences") or profile.get("experience") or profile.get("work_experience") or []

    if not isinstance(experiences, list):
        return []

    result = []
    for exp in experiences:
        if not isinstance(exp, dict):
            continue

        # Entreprise
        company = exp.get("company") or exp.get("company_name") or exp.get("employer") or exp.get("organization") or {}
        if isinstance(company, dict):
            company_name = company.get("name") or company.get("label") or company.get("value") or ""
        else:
            company_name = str(company) if company else ""

        # Poste
        position = _get(exp, "title", "position", "job_title", "role", "jobTitle", "position_title", "name", "label")
        if isinstance(position, dict):
            position = position.get("name") or position.get("label") or position.get("value")

        if not company_name and not position:
            continue

        # Dates (HRFlow peut retourner {iso8601, text, timestamp} ou une chaîne)
        start_raw = _get(exp, "start_date", "startDate", "date_start", "start", "from", "begin_date")
        end_raw = _get(exp, "end_date", "endDate", "date_end", "end", "to", "until")
        if isinstance(start_raw, dict):
            start_raw = start_raw.get("iso8601") or start_raw.get("text")
        if isinstance(end_raw, dict):
            end_raw = end_raw.get("iso8601") or end_raw.get("text")
        start_date = _parse_date(start_raw)
        end_date = _parse_date(end_raw)
        is_current = bool(_get(exp, "current", "is_current", "isCurrent", "ongoing", "present"))

        if is_current:
            end_date = None

        if not start_date:
            start_date = datetime.now()

        # Description
        desc = _get(exp, "description", "summary", "responsibilities", "duties", "tasks") or ""
        if isinstance(desc, list):
            desc = "\n".join(str(d) for d in desc if d)

        # Réalisations
        achievements = _get(exp, "achievements", "highlights", "accomplishments", "key_achievements")
        if isinstance(achievements, list):
            achievements = "\n".join(str(a) for a in achievements if a)
        elif isinstance(achievements, str):
            achievements = achievements.strip() or None
        else:
            achievements = None

        # Secteur
        company_sector = _get(exp, "sector", "industry", "company_sector")
        if isinstance(company_sector, dict):
            company_sector = company_sector.get("name")

        result.append(ExperienceOutput(
            company_name=company_name or "Entreprise",
            position=position or "Poste",
            start_date=start_date,
            end_date=end_date,
            is_current=is_current,
            description=desc or None,
            achievements=achievements,
            company_sector=company_sector,
        ))

    return result


def map_hrflow_educations(hrflow_data: dict) -> List[EducationOutput]:
    """
    Construit la liste des formations au format Yemma.

    Args:
        hrflow_data: Données brutes du profil HRFlow

    Returns:
        Liste d'EducationOutput
    """
    profile = hrflow_data.get("profile") or hrflow_data
    educations = profile.get("educations") or profile.get("education") or []

    if not isinstance(educations, list):
        return []

    result = []
    for edu in educations:
        if not isinstance(edu, dict):
            continue

        # Établissement
        school = edu.get("school") or edu.get("institution") or edu.get("establishment") or {}
        if isinstance(school, dict):
            institution = school.get("name") or school.get("label") or ""
        else:
            institution = str(school) if school else ""

        # Diplôme
        diploma = _get(edu, "title", "degree", "diploma", "field")
        if isinstance(diploma, dict):
            diploma = diploma.get("name") or diploma.get("label") or ""

        if not institution and not diploma:
            continue

        # Années (HRFlow utilise date_start/date_end avec objet {iso8601, text, timestamp})
        date_start_raw = _get(edu, "start_date", "startDate", "date_start")
        date_end_raw = _get(edu, "end_date", "endDate", "graduation_date", "graduation_year", "date_end")
        if isinstance(date_start_raw, dict):
            date_start_raw = date_start_raw.get("iso8601") or date_start_raw.get("text")
        if isinstance(date_end_raw, dict):
            date_end_raw = date_end_raw.get("iso8601") or date_end_raw.get("text")
        start_year = _parse_year(date_start_raw)
        end_year = _parse_year(date_end_raw)

        if not end_year and start_year:
            end_year = start_year
        if not end_year:
            end_year = datetime.now().year

        # Niveau
        level = _get(edu, "level", "grade", "degree_level")
        if isinstance(level, dict):
            level = level.get("name") or level.get("label") or ""
        if not level:
            level = "Non spécifié"

        # Pays
        country = edu.get("location") or edu.get("country")
        if isinstance(country, dict):
            country = country.get("name") or country.get("country_code")

        result.append(EducationOutput(
            diploma=diploma or "Formation",
            institution=institution or "Établissement",
            country=country,
            start_year=start_year,
            graduation_year=end_year,
            level=str(level).strip(),
        ))

    return result


def map_hrflow_skills(hrflow_data: dict) -> List[SkillOutput]:
    """
    Construit la liste des compétences au format Yemma.

    Args:
        hrflow_data: Données brutes du profil HRFlow

    Returns:
        Liste de SkillOutput
    """
    profile = hrflow_data.get("profile") or hrflow_data
    skills = (
        profile.get("skills") or profile.get("skill") or
        profile.get("technical_skills") or profile.get("competences") or []
    )

    if not isinstance(skills, list):
        return []

    result = []
    seen = set()

    for s in skills:
        if isinstance(s, dict):
            name = s.get("name") or s.get("label") or s.get("value") or s.get("text") or s.get("skill")
        elif isinstance(s, str):
            name = s.strip()
            s = {}
        else:
            continue

        if not name or name.lower() in seen:
            continue
        seen.add(name.lower())

        level = _normalize_skill_level(_get(s, "level", "proficiency", "expertise", "rating") if isinstance(s, dict) else None)
        skill_type = _detect_skill_type(s) if isinstance(s, dict) else SkillType.TECHNICAL

        result.append(SkillOutput(
            name=name,
            skill_type=skill_type,
            level=level,
            years_of_practice=None,
        ))

    return result


def map_hrflow_certifications(hrflow_data: dict) -> List[CertificationOutput]:
    """
    Construit la liste des certifications au format Yemma.

    Args:
        hrflow_data: Données brutes du profil HRFlow

    Returns:
        Liste de CertificationOutput
    """
    profile = hrflow_data.get("profile") or hrflow_data
    certifications = (
        profile.get("certifications") or profile.get("certificates") or
        profile.get("certification") or profile.get("licenses") or []
    )

    if not isinstance(certifications, list):
        return []

    result = []
    for cert in certifications:
        if not isinstance(cert, dict):
            continue

        # Titre de la certification
        title = _get(cert, "name", "title", "label", "certification_name", "certificate_name")
        if isinstance(title, dict):
            title = title.get("name") or title.get("label")

        if not title:
            continue

        # Organisme délivreur
        issuer = _get(cert, "issuer", "issuing_organization", "organization", "provider", "authority")
        if isinstance(issuer, dict):
            issuer = issuer.get("name") or issuer.get("label")

        # Année d'obtention
        year = _parse_year(_get(cert, "date", "issue_date", "date_obtained", "year", "obtained_date"))
        if not year:
            year = datetime.now().year

        # Date d'expiration
        expiration_date = _parse_date(_get(cert, "expiration_date", "expiry_date", "valid_until", "end_date"))

        # URL de vérification
        verification_url = _get(cert, "url", "verification_url", "credential_url", "link")

        # ID de certification
        certification_id = _get(cert, "id", "credential_id", "certification_id", "certificate_id", "license_number")

        result.append(CertificationOutput(
            title=title,
            issuer=issuer or "Non spécifié",
            year=year,
            expiration_date=expiration_date,
            verification_url=verification_url,
            certification_id=certification_id,
        ))

    return result


def map_hrflow_to_yemma(hrflow_data: dict, email_override: Optional[str] = None) -> ParsedCVResponse:
    """
    Convertit les données HRFlow complètes au format Yemma.

    Args:
        hrflow_data: Données brutes du profil HRFlow
        email_override: Email du compte (auth) pour garantir cohérence

    Returns:
        ParsedCVResponse avec profil, expériences, formations, et compétences
    """
    logger.info("[Mapper] Converting HRFlow data to Yemma format")

    profile = map_hrflow_profile(hrflow_data, email_override)
    experiences = map_hrflow_experiences(hrflow_data)
    educations = map_hrflow_educations(hrflow_data)
    skills = map_hrflow_skills(hrflow_data)
    certifications = map_hrflow_certifications(hrflow_data)

    # Calculer les années d'expérience si non fourni
    if profile.total_experience is None and experiences:
        total_months = 0
        for exp in experiences:
            if exp.start_date:
                end_dt = exp.end_date or datetime.now()
                delta = end_dt - exp.start_date
                total_months += max(0, delta.days // 30)
        profile.total_experience = total_months // 12 if total_months > 0 else None

    # Extraire le titre du profil depuis la dernière expérience si non renseigné
    if not profile.profile_title and experiences:
        # Prendre le poste de l'expérience la plus récente (en cours ou plus récente)
        current_exp = next((e for e in experiences if e.is_current), None)
        if current_exp:
            profile.profile_title = current_exp.position
        elif experiences:
            # Trier par date de début décroissante et prendre le premier
            sorted_exps = sorted(experiences, key=lambda x: x.start_date or datetime.min, reverse=True)
            profile.profile_title = sorted_exps[0].position

    # Extraire le main_job si non renseigné
    if not profile.main_job and profile.profile_title:
        profile.main_job = profile.profile_title

    # Métadonnées
    hrflow_profile = hrflow_data.get("profile") or hrflow_data
    profile_key = hrflow_profile.get("key")
    text = hrflow_profile.get("text") or ""
    text_preview = text[:500] if isinstance(text, str) else None

    logger.info(f"[Mapper] Mapped: {len(experiences)} experiences, {len(educations)} educations, {len(skills)} skills, {len(certifications)} certifications")

    return ParsedCVResponse(
        profile=profile,
        experiences=experiences,
        educations=educations,
        certifications=certifications,
        skills=skills,
        hrflow_profile_key=profile_key,
        raw_text_preview=text_preview,
    )
