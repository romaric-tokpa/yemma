"""
Exceptions personnalisées pour le service Candidate
"""
from fastapi import HTTPException, status


class CandidateError(HTTPException):
    """Exception de base pour les erreurs candidat"""
    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        super().__init__(status_code=status_code, detail=message)
        self.message = message


class ProfileNotFoundError(CandidateError):
    """Profil non trouvé"""
    def __init__(self, profile_id: str):
        super().__init__(
            "Profil non trouvé",
            status_code=status.HTTP_404_NOT_FOUND
        )


class ProfileAlreadyExistsError(CandidateError):
    """Profil déjà existant pour cet utilisateur"""
    def __init__(self, user_id: str):
        super().__init__(
            "Un profil existe déjà pour ce compte.",
            status_code=status.HTTP_409_CONFLICT
        )


class InvalidProfileStatusError(CandidateError):
    """Transition de statut invalide"""
    def __init__(self, current_status: str, target_status: str):
        super().__init__(
            f"Transition impossible : {current_status} → {target_status}",
            status_code=status.HTTP_400_BAD_REQUEST
        )


class ProfileNotCompleteError(CandidateError):
    """Profil incomplet pour soumission"""
    def __init__(self, message: str = "Le profil n'est pas assez complet pour être soumis."):
        super().__init__(message, status_code=status.HTTP_400_BAD_REQUEST)

