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
        
        # Construire le document pour ElasticSearch
        document = CandidateDocument(
            candidate_id=request.candidate_id,
            profile_title=profile_data.get("step1", {}).get("profileTitle", ""),
            professional_summary=profile_data.get("step1", {}).get("professionalSummary", ""),
            first_name=profile_data.get("step1", {}).get("firstName", ""),
            last_name=profile_data.get("step1", {}).get("lastName", ""),
            email=profile_data.get("step1", {}).get("email", ""),
            sector=profile_data.get("step1", {}).get("sector", ""),
            main_job=profile_data.get("step1", {}).get("mainJob", ""),
            total_experience=profile_data.get("step1", {}).get("totalExperience", 0),
            admin_score=profile_data.get("admin_score"),
            skills=[
                {
                    "name": skill.get("name", ""),
                    "level": skill.get("level", ""),
                    "years_of_practice": skill.get("yearsOfPractice"),
                }
                for skill in profile_data.get("step5", {}).get("technicalSkills", [])
            ],
            experiences=[
                {
                    "position": exp.get("position", ""),
                    "company_name": exp.get("companyName", ""),
                    "start_date": exp.get("startDate"),
                    "end_date": exp.get("endDate"),
                    "is_current": exp.get("isCurrent", False),
                }
                for exp in profile_data.get("step2", {}).get("experiences", [])
            ],
            educations=[
                {
                    "diploma": edu.get("diploma", ""),
                    "institution": edu.get("institution", ""),
                    "level": edu.get("level", ""),
                    "graduation_year": edu.get("graduationYear"),
                }
                for edu in profile_data.get("step3", {}).get("educations", [])
            ],
            desired_positions=profile_data.get("step7", {}).get("desiredPositions", []),
            contract_type=profile_data.get("step7", {}).get("contractType"),
            desired_location=profile_data.get("step7", {}).get("desiredLocation"),
            availability=profile_data.get("step7", {}).get("availability"),
            salary_expectations=profile_data.get("step7", {}).get("salaryExpectations"),
            status="VALIDATED",
            created_at=profile_data.get("created_at", datetime.utcnow().isoformat()),
            validated_at=datetime.utcnow().isoformat(),
        )
        
        # Indexer le document
        await es_client.index_document(
            document=document.dict(),
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

