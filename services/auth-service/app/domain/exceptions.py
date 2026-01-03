"""
Exceptions du domaine métier
"""


class AuthError(Exception):
    """Exception de base pour les erreurs d'authentification"""
    def __init__(self, message: str = "Authentication error"):
        self.message = message
        super().__init__(self.message)


class InvalidCredentialsError(AuthError):
    """Identifiants invalides"""
    def __init__(self, message: str = "Invalid email or password"):
        super().__init__(message)


class UserNotFoundError(Exception):
    """Utilisateur non trouvé"""
    def __init__(self, user_id: str, message: str = "User not found"):
        self.user_id = user_id
        self.message = message
        super().__init__(self.message)


class UserAlreadyExistsError(Exception):
    """Utilisateur déjà existant"""
    def __init__(self, email: str, message: str = "User already exists"):
        self.email = email
        self.message = message
        super().__init__(self.message)


class TokenError(AuthError):
    """Erreur liée aux tokens JWT"""
    def __init__(self, message: str = "Token error"):
        super().__init__(message)


class PermissionDeniedError(Exception):
    """Permission refusée"""
    def __init__(self, required_role: str, message: str = "Permission denied"):
        self.required_role = required_role
        self.message = message
        super().__init__(self.message)

