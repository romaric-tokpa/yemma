"""
Utilitaire pour mapper les données d'onboarding du frontend vers les modèles backend
"""
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.domain.models import (
    ProfileStatus, ContractType, SkillLevel, SkillType
)


def map_step0_to_profile(step0_data: Dict[str, Any]) -> Dict[str, Any]:
    """Map Step 0 (Consentements) vers Profile"""
    return {
        "accept_cgu": step0_data.get("acceptCgu", False),
        "accept_rgpd": step0_data.get("acceptRgpd", False),
        "accept_verification": step0_data.get("acceptVerification", False),
    }


def map_step1_to_profile(step1_data: Dict[str, Any]) -> Dict[str, Any]:
    """Map Step 1 (Profil Général) vers Profile"""
    profile_data = {}
    
    if "firstName" in step1_data:
        profile_data["first_name"] = step1_data["firstName"]
    if "lastName" in step1_data:
        profile_data["last_name"] = step1_data["lastName"]
    if "email" in step1_data:
        profile_data["email"] = step1_data["email"]
    if "phone" in step1_data:
        profile_data["phone"] = step1_data["phone"]
    if "dateOfBirth" in step1_data:
        profile_data["date_of_birth"] = datetime.fromisoformat(step1_data["dateOfBirth"].replace('Z', '+00:00'))
    if "nationality" in step1_data:
        profile_data["nationality"] = step1_data["nationality"]
    if "address" in step1_data:
        profile_data["address"] = step1_data["address"]
    if "city" in step1_data:
        profile_data["city"] = step1_data["city"]
    if "country" in step1_data:
        profile_data["country"] = step1_data["country"]
    if "profileTitle" in step1_data:
        profile_data["profile_title"] = step1_data["profileTitle"]
    if "professionalSummary" in step1_data:
        profile_data["professional_summary"] = step1_data["professionalSummary"]
    if "sector" in step1_data:
        profile_data["sector"] = step1_data["sector"]
    if "mainJob" in step1_data:
        profile_data["main_job"] = step1_data["mainJob"]
    if "totalExperience" in step1_data:
        profile_data["total_experience"] = step1_data["totalExperience"]
    
    return profile_data


def map_step2_to_experiences(step2_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Map Step 2 (Expériences) vers liste d'Experience"""
    experiences = step2_data.get("experiences", [])
    result = []
    
    for exp in experiences:
        exp_data = {
            "company_name": exp.get("companyName", ""),
            "position": exp.get("position", ""),
        }
        
        if "companySector" in exp:
            exp_data["company_sector"] = exp["companySector"]
        if "contractType" in exp:
            try:
                exp_data["contract_type"] = ContractType[exp["contractType"]]
            except KeyError:
                pass
        if "startDate" in exp:
            exp_data["start_date"] = datetime.fromisoformat(exp["startDate"].replace('Z', '+00:00'))
        if "endDate" in exp:
            exp_data["end_date"] = datetime.fromisoformat(exp["endDate"].replace('Z', '+00:00'))
        if "isCurrent" in exp:
            exp_data["is_current"] = exp["isCurrent"]
        if "description" in exp:
            exp_data["description"] = exp["description"]
        if "achievements" in exp:
            exp_data["achievements"] = exp["achievements"]
        if "hasDocument" in exp:
            exp_data["has_document"] = exp["hasDocument"]
        if "documentId" in exp:
            exp_data["document_id"] = exp["documentId"]
        
        result.append(exp_data)
    
    return result


def map_step3_to_educations(step3_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Map Step 3 (Formations) vers liste d'Education"""
    educations = step3_data.get("educations", [])
    result = []
    
    for edu in educations:
        edu_data = {
            "diploma": edu.get("diploma", ""),
            "institution": edu.get("institution", ""),
            "graduation_year": edu.get("graduationYear", 0),
            "level": edu.get("level", ""),
        }
        
        if "country" in edu:
            edu_data["country"] = edu["country"]
        if "startYear" in edu:
            edu_data["start_year"] = edu["startYear"]
        
        result.append(edu_data)
    
    return result


def map_step4_to_certifications(step4_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Map Step 4 (Certifications) vers liste de Certification"""
    certifications = step4_data.get("certifications", [])
    result = []
    
    for cert in certifications:
        cert_data = {
            "title": cert.get("title", ""),
            "issuer": cert.get("issuer", ""),
            "year": cert.get("year", 0),
        }
        
        if "expirationDate" in cert:
            cert_data["expiration_date"] = datetime.fromisoformat(cert["expirationDate"].replace('Z', '+00:00'))
        if "verificationUrl" in cert:
            cert_data["verification_url"] = cert["verificationUrl"]
        if "certificationId" in cert:
            cert_data["certification_id"] = cert["certificationId"]
        
        result.append(cert_data)
    
    return result


def map_step5_to_skills(step5_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Map Step 5 (Compétences) vers liste de Skill"""
    skills = step5_data.get("skills", [])
    result = []
    
    for skill in skills:
        skill_data = {
            "name": skill.get("name", ""),
        }
        
        if "type" in skill:
            try:
                skill_data["skill_type"] = SkillType[skill["type"]]
            except KeyError:
                skill_data["skill_type"] = SkillType.TECHNICAL
        
        if "level" in skill:
            try:
                skill_data["level"] = SkillLevel[skill["level"]]
            except KeyError:
                pass
        
        if "yearsOfPractice" in skill:
            skill_data["years_of_practice"] = skill["yearsOfPractice"]
        
        result.append(skill_data)
    
    return result


def map_step7_to_job_preferences(step7_data: Dict[str, Any]) -> Dict[str, Any]:
    """Map Step 7 (Préférences) vers JobPreference"""
    pref_data = {}
    
    if "desiredPositions" in step7_data:
        pref_data["desired_positions"] = step7_data["desiredPositions"][:5]  # Max 5
    if "contractType" in step7_data:
        try:
            pref_data["contract_type"] = ContractType[step7_data["contractType"]]
        except KeyError:
            pass
    if "targetSectors" in step7_data:
        pref_data["target_sectors"] = step7_data["targetSectors"]
    if "desiredLocation" in step7_data:
        pref_data["desired_location"] = step7_data["desiredLocation"]
    if "mobility" in step7_data:
        pref_data["mobility"] = step7_data["mobility"]
    if "availability" in step7_data:
        pref_data["availability"] = step7_data["availability"]
    if "salaryExpectations" in step7_data:
        pref_data["salary_expectations"] = step7_data["salaryExpectations"]
    
    return pref_data

