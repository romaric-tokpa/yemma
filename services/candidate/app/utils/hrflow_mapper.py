"""
Mapper Hrflow.ai Profile -> Modèle Yemma (profil + expériences + formations + compétences).

La structure Hrflow peut varier (info.name.first_name / info.full_name, etc.).
On gère plusieurs formats possibles.
"""
from datetime import datetime
from typing import Any, List, Optional

from app.domain.schemas import ProfileCreate


def _get(obj: dict, *keys: str, default=None):
    """Récupère une valeur en essayant plusieurs clés (snake_case et camelCase)."""
    for k in keys:
        if k in obj and obj[k] is not None and obj[k] != "":
            return obj[k]
    return default


def _date_parse(s: Any) -> Optional[datetime]:
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


def _year_parse(s: Any) -> Optional[int]:
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


def map_hrflow_to_profile_create(hrflow_profile: dict, email_override: str) -> ProfileCreate:
    """
    Construit ProfileCreate à partir du profil Hrflow.
    email_override: email du compte (auth) pour garantir cohérence.
    """
    info = hrflow_profile.get("info") or hrflow_profile.get("Information") or {}
    if isinstance(info, list):
        info = info[0] if info else {}

    # Nom : name.first_name / name.last_name ou full_name split
    first = _get(info, "first_name", "firstName")
    last = _get(info, "last_name", "lastName")
    if not first and not last:
        full = _get(info, "full_name", "fullName") or _get(hrflow_profile, "name")
        if isinstance(full, str):
            parts = full.strip().split(None, 1)
            first = parts[0] if parts else ""
            last = parts[1] if len(parts) > 1 else ""

    # Email : priorité à l'email du compte
    email = email_override or _get(info, "email", "emails")
    if isinstance(email, list):
        email = email[0] if email else ""
    if not isinstance(email, str):
        email = ""

    return ProfileCreate(
        email=email or email_override,
        first_name=(first or "").strip() or None,
        last_name=(last or "").strip() or None,
        profile_title=_get(info, "profile_title", "profileTitle", "headline") or None,
        professional_summary=_get(info, "summary", "summary_additional", "professional_summary") or None,
    )


def map_hrflow_to_step1_update(hrflow_profile: dict, email_override: str) -> dict:
    """
    Construit les champs step1 (profil général) pour PATCH /me.
    Extrait toutes les données possibles depuis le profil Hrflow.
    """
    # Essayer plusieurs structures possibles pour "info"
    info = hrflow_profile.get("info") or hrflow_profile.get("Information") or hrflow_profile.get("information") or {}
    if isinstance(info, list):
        info = info[0] if info else {}
    if not isinstance(info, dict):
        info = {}

    # Nom : essayer plusieurs formats (name.first_name, name.last_name, full_name, etc.)
    name_obj = info.get("name") or {}
    if isinstance(name_obj, dict):
        first = _get(name_obj, "first_name", "firstName", "first") or _get(info, "first_name", "firstName")
        last = _get(name_obj, "last_name", "lastName", "last") or _get(info, "last_name", "lastName")
    else:
        first = _get(info, "first_name", "firstName")
        last = _get(info, "last_name", "lastName")
    
    if not first and not last:
        full = _get(info, "full_name", "fullName") or _get(hrflow_profile, "name") or _get(name_obj, "full")
        if isinstance(full, str):
            parts = full.strip().split(None, 1)
            first = parts[0] if parts else ""
            last = parts[1] if len(parts) > 1 else ""

    # Téléphone : essayer plusieurs formats
    phone = _get(info, "phone", "phones", "phone_number", "phoneNumber", "mobile", "tel")
    if isinstance(phone, list):
        phone = phone[0] if phone else None
    if not isinstance(phone, str):
        phone = None
    if phone:
        # Nettoyer le numéro de téléphone (enlever espaces, tirets, etc.)
        phone = "".join(c for c in phone if c.isdigit() or c in "+()")

    # Adresse / localisation : essayer plusieurs structures
    location = info.get("location") or info.get("locations") or info.get("address") or {}
    if isinstance(location, list):
        location = location[0] if location else {}
    if not isinstance(location, dict):
        location = {}
    
    # Adresse complète
    address = (
        _get(location, "address", "street", "full", "text", "formatted") or 
        _get(info, "address", "street", "full_address")
    )
    if isinstance(address, dict):
        address = address.get("text") or address.get("formatted") or str(address)
    
    # Pays
    country = (
        _get(location, "country", "country_code", "countryCode", "country_name") or 
        _get(info, "country", "country_code", "countryCode")
    )
    if isinstance(country, dict):
        country = country.get("name") or country.get("code") or str(country)
    
    # Ville
    city = _get(location, "city", "city_name", "cityName") or _get(info, "city", "city_name")
    if isinstance(city, dict):
        city = city.get("name") or str(city)

    # Date de naissance : essayer plusieurs formats
    date_birth = _get(info, "date_of_birth", "dateOfBirth", "birth_date", "birthDate", "birthday")
    if date_birth:
        if isinstance(date_birth, str):
            dt = _date_parse(date_birth)
            date_birth = dt.isoformat() if dt else None
        elif isinstance(date_birth, datetime):
            date_birth = date_birth.isoformat()
        else:
            date_birth = None

    # Nationalité
    nationality = _get(info, "nationality", "nationality_code", "citizenship")
    if isinstance(nationality, dict):
        nationality = nationality.get("name") or nationality.get("code") or str(nationality)

    # Titre du profil / Headline
    profile_title = (
        _get(info, "profile_title", "profileTitle", "headline", "title", "job_title", "current_title") or
        _get(hrflow_profile, "headline", "title")
    )
    if isinstance(profile_title, dict):
        profile_title = profile_title.get("name") or profile_title.get("label") or str(profile_title)

    # Résumé professionnel : essayer plusieurs champs
    professional_summary = (
        _get(info, "summary", "summary_additional", "professional_summary", "professionalSummary", 
             "bio", "biography", "about", "description", "resume_summary") or
        _get(hrflow_profile, "summary", "description")
    )
    if isinstance(professional_summary, list):
        professional_summary = "\n".join(str(s) for s in professional_summary if s)

    # Secteur d'activité
    sector = _get(info, "sector", "industry", "industry_sector", "field")
    if isinstance(sector, dict):
        sector = sector.get("name") or sector.get("label") or str(sector)

    # Métier principal / Poste actuel
    main_job = (
        _get(info, "main_job", "current_job", "title", "current_title", "job_title", "position") or
        _get(hrflow_profile, "title", "position")
    )
    if isinstance(main_job, dict):
        main_job = main_job.get("name") or main_job.get("label") or str(main_job)

    # Années d'expérience totale : calculer depuis les expériences si non fourni
    total_experience = _get(info, "total_years_experience", "years_of_experience", "experience_years", "total_experience")
    if total_experience is None:
        # Essayer de calculer depuis les expériences
        experiences = hrflow_profile.get("experiences") or hrflow_profile.get("experience") or []
        if isinstance(experiences, list) and len(experiences) > 0:
            try:
                from datetime import datetime
                total_months = 0
                for exp in experiences:
                    if isinstance(exp, dict):
                        start = _get(exp, "start_date", "startDate", "date_start")
                        end = _get(exp, "end_date", "endDate", "date_end") if not exp.get("current") else None
                        if start:
                            start_dt = _date_parse(start)
                            end_dt = _date_parse(end) if end else datetime.now()
                            if start_dt and end_dt:
                                delta = end_dt - start_dt
                                total_months += max(0, delta.days // 30)
                total_experience = total_months // 12 if total_months > 0 else None
            except Exception:
                total_experience = None

    return {
        "first_name": (first or "").strip() or None,
        "last_name": (last or "").strip() or None,
        "phone": phone,
        "address": address,
        "city": city,
        "country": country,
        "date_of_birth": date_birth,
        "nationality": nationality,
        "profile_title": profile_title,
        "professional_summary": professional_summary,
        "sector": sector,
        "main_job": main_job,
        "total_experience": total_experience,
    }


def map_hrflow_experiences(hrflow_profile: dict) -> List[dict]:
    """Construit la liste des expériences pour création (format backend)."""
    experiences = hrflow_profile.get("experiences") or hrflow_profile.get("experience") or hrflow_profile.get("work_experience") or []
    if not isinstance(experiences, list):
        return []
    out = []
    for exp in experiences:
        if not isinstance(exp, dict):
            continue
        
        # Nom de l'entreprise : essayer plusieurs formats
        company = exp.get("company") or exp.get("company_name") or exp.get("employer") or exp.get("organization") or {}
        if isinstance(company, dict):
            company_name = (
                company.get("name") or company.get("label") or company.get("value") or 
                company.get("text") or str(company)
            )
        else:
            company_name = str(company) if company else ""
        
        # Poste : essayer plusieurs formats
        position = (
            _get(exp, "title", "position", "job_title", "role", "jobTitle", "position_title") or
            _get(exp, "name", "label")
        )
        if isinstance(position, dict):
            position = position.get("name") or position.get("label") or position.get("value") or str(position)
        
        if not company_name and not position:
            continue
        
        # Dates : essayer plusieurs formats
        start_date = _get(exp, "start_date", "startDate", "date_start", "start", "from", "begin_date")
        end_date = _get(exp, "end_date", "endDate", "date_end", "end", "to", "until")
        is_current = bool(_get(exp, "current", "is_current", "isCurrent", "ongoing", "present"))
        
        # Description : essayer plusieurs champs
        desc = (
            _get(exp, "description", "summary", "responsibilities", "duties", "tasks") or ""
        )
        if isinstance(desc, list):
            desc = "\n".join(str(d) for d in desc if d)
        
        # Réalisations / Accomplissements
        achievements = _get(exp, "achievements", "highlights", "accomplishments", "key_achievements")
        if isinstance(achievements, list):
            achievements = "\n".join(str(a) for a in achievements if a)
        elif isinstance(achievements, str):
            achievements = achievements.strip() or None
        else:
            achievements = None
        
        # Parser les dates
        start_dt = _date_parse(start_date) if start_date else datetime.now()
        end_dt = _date_parse(end_date) if end_date and not is_current else None
        
        out.append({
            "company_name": company_name or "Entreprise",
            "position": position or "Poste",
            "start_date": start_dt,
            "end_date": end_dt,
            "is_current": is_current,
            "description": desc or "Description non renseignée.",
            "achievements": achievements,
        })
    return out


def map_hrflow_educations(hrflow_profile: dict) -> List[dict]:
    """Construit la liste des formations pour création (format backend)."""
    educations = hrflow_profile.get("education") or hrflow_profile.get("educations") or []
    if not isinstance(educations, list):
        return []
    out = []
    for edu in educations:
        if not isinstance(edu, dict):
            continue
        school = edu.get("school") or edu.get("institution") or edu.get("establishment") or {}
        if isinstance(school, dict):
            institution = school.get("name") or school.get("label") or ""
        else:
            institution = str(school) if school else ""
        diploma = _get(edu, "degree", "diploma", "title", "field")
        if isinstance(diploma, dict):
            diploma = diploma.get("name") or diploma.get("label") or ""
        if not institution and not diploma:
            continue
        start_year = _year_parse(_get(edu, "start_date", "startDate", "year"))
        end_year = _year_parse(_get(edu, "end_date", "endDate", "graduation_date", "graduation_year"))
        if not end_year and start_year:
            end_year = start_year
        if not end_year:
            end_year = datetime.now().year
        level = _get(edu, "level", "grade")
        if isinstance(level, dict):
            level = level.get("name") or level.get("label") or ""
        country = edu.get("location") or edu.get("country")
        if isinstance(country, dict):
            country = country.get("name") or country.get("country_code")
        out.append({
            "diploma": diploma or "Formation",
            "institution": institution or "Établissement",
            "country": country,
            "start_year": start_year,
            "graduation_year": end_year,
            "level": (level or "Non spécifié").strip(),
        })
    return out


def map_hrflow_skills(hrflow_profile: dict) -> List[dict]:
    """Construit la liste des compétences pour création (format backend: skill_type, name, level)."""
    skills = (
        hrflow_profile.get("skills") or hrflow_profile.get("skill") or 
        hrflow_profile.get("technical_skills") or hrflow_profile.get("competences") or []
    )
    if not isinstance(skills, list):
        return []
    out = []
    seen = set()
    for s in skills:
        if isinstance(s, dict):
            name = s.get("name") or s.get("label") or s.get("value") or s.get("text") or s.get("skill")
        elif isinstance(s, str):
            name = s.strip()
        else:
            continue
        if not name or name.lower() in seen:
            continue
        seen.add(name.lower())
        
        # Niveau : essayer plusieurs formats
        level = _get(s, "level", "proficiency", "expertise", "rating") if isinstance(s, dict) else None
        if isinstance(level, dict):
            level = level.get("name") or level.get("value") or level.get("label")
        if isinstance(level, str):
            level = level.upper().strip()
            # Normaliser les niveaux
            if level in ["BEGINNER", "DEBUTANT", "NOVICE", "JUNIOR"]:
                level = "BEGINNER"
            elif level in ["INTERMEDIATE", "INTERMEDIAIRE", "MID"]:
                level = "INTERMEDIATE"
            elif level in ["ADVANCED", "AVANCE", "SENIOR"]:
                level = "ADVANCED"
            elif level in ["EXPERT", "MASTER"]:
                level = "EXPERT"
            else:
                level = "INTERMEDIATE"  # Par défaut
        
        # Type de compétence : essayer de détecter si c'est technique ou soft skill
        skill_type = "TECHNICAL"  # Par défaut
        if isinstance(s, dict):
            skill_type_raw = _get(s, "type", "category", "skill_type")
            if skill_type_raw and isinstance(skill_type_raw, str):
                skill_type_lower = skill_type_raw.lower()
                if "soft" in skill_type_lower or "behavioral" in skill_type_lower or "interpersonal" in skill_type_lower:
                    skill_type = "SOFT"
        
        out.append({
            "skill_type": skill_type,
            "name": name,
            "level": level if level else None,
        })
    return out
