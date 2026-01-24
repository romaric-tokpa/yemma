"""
Endpoints d'indexation
"""
from fastapi import APIRouter, HTTPException, status
from app.domain.schemas import IndexRequest, CandidateDocument
from app.infrastructure.elasticsearch import es_client
from datetime import datetime

router = APIRouter()


@router.post("/index", status_code=status.HTTP_201_CREATED)
async def index_candidate(request: IndexRequest):
    """
    Indexe un profil candidat validé
    
    Cet endpoint peut être appelé :
    - Directement par l'admin-service après validation
    - Par un consommateur RabbitMQ (à implémenter)
    """
    try:
        profile_data = request.profile_data
        
        # Extraire les données de base
        step1 = profile_data.get("step1", {})
        step2 = profile_data.get("step2", {})
        step3 = profile_data.get("step3", {})
        step5 = profile_data.get("step5", {})
        step7 = profile_data.get("step7", {})
        
        first_name = step1.get("firstName", "")
        last_name = step1.get("lastName", "")
        full_name = f"{first_name} {last_name}".strip()
        
        # Construire le document complet pour ElasticSearch avec TOUS les champs
        document_data = {
            "candidate_id": request.candidate_id,
            "full_name": full_name,
            "first_name": first_name,
            "last_name": last_name,
            "email": step1.get("email", ""),
            "title": step1.get("profileTitle", ""),
            "profile_title": step1.get("profileTitle", ""),  # Alias
            "summary": step1.get("professionalSummary", ""),
            "professional_summary": step1.get("professionalSummary", ""),  # Alias
            "photo_url": profile_data.get("photo_url") or step1.get("photoUrl"),
            "sector": step1.get("sector", ""),
            "main_job": step1.get("mainJob", ""),
            "years_of_experience": step1.get("totalExperience", 0),
            "total_experience": step1.get("totalExperience", 0),  # Alias
            "admin_score": profile_data.get("admin_score"),
            "admin_report": profile_data.get("admin_report"),
            "is_verified": profile_data.get("is_verified", False),
            "status": "VALIDATED",
            "created_at": profile_data.get("created_at", datetime.utcnow().isoformat()),
            "validated_at": datetime.utcnow().isoformat(),
            "skills": [
                {
                    "name": skill.get("name", ""),
                    "level": skill.get("level", ""),
                    "years_of_practice": skill.get("yearsOfPractice"),
                }
                for skill in step5.get("technicalSkills", [])
            ],
            "experiences": [
                {
                    "position": exp.get("position", ""),
                    "company_name": exp.get("companyName", ""),
                    "start_date": exp.get("startDate"),
                    "end_date": exp.get("endDate"),
                    "is_current": exp.get("isCurrent", False),
                }
                for exp in step2.get("experiences", [])
            ],
            "educations": [
                {
                    "diploma": edu.get("diploma", ""),
                    "institution": edu.get("institution", ""),
                    "level": edu.get("level", ""),
                    "graduation_year": edu.get("graduationYear"),
                }
                for edu in step3.get("educations", [])
            ],
            "desired_positions": step7.get("desiredPositions", []),
            "contract_type": step7.get("contractType"),
            "desired_location": step7.get("desiredLocation"),
            "availability": step7.get("availability"),
            "salary_expectations": step7.get("salaryExpectations"),
            "location": step1.get("city", "") or step1.get("address", ""),  # Utiliser city ou address comme location
        }
        
        # Utiliser la fonction d'indexation améliorée
        from app.infrastructure.candidate_indexer import index_candidate
        document = index_candidate(document_data)
        
        # Indexer le document (document est déjà un dict depuis index_candidate)
        await es_client.index_document(
            document=document,
            document_id=str(request.candidate_id)
        )
        
        return {
            "message": "Candidate profile indexed successfully",
            "candidate_id": request.candidate_id,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to index candidate: {str(e)}"
        )


@router.delete("/index/{candidate_id}", status_code=status.HTTP_200_OK)
async def remove_candidate_from_index(candidate_id: int):
    """
    Supprime un profil de l'index (lors d'un rejet ou d'une suppression)
    """
    try:
        await es_client.delete_document(str(candidate_id))
        return {
            "message": "Candidate profile removed from index",
            "candidate_id": candidate_id,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to remove candidate from index: {str(e)}"
        )

