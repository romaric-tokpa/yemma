"""
Validation des fichiers par Magic Numbers
"""
from typing import Tuple
from fastapi import UploadFile

from app.core.config import settings
from app.core.exceptions import InvalidFileTypeError, FileTooLargeError


class FileValidator:
    """Classe pour valider les fichiers"""
    
    # Magic numbers pour les types de fichiers autorisés
    MAGIC_NUMBERS = {
        # PDF
        b'\x25\x50\x44\x46': 'application/pdf',  # %PDF
        # JPEG
        b'\xFF\xD8\xFF': 'image/jpeg',
        # PNG
        b'\x89\x50\x4E\x47\x0D\x0A\x1A\x0A': 'image/png',  # PNG signature
    }
    
    # Extensions autorisées
    ALLOWED_EXTENSIONS = settings.ALLOWED_EXTENSIONS
    ALLOWED_MIME_TYPES = settings.ALLOWED_MIME_TYPES
    MAX_FILE_SIZE = settings.MAX_FILE_SIZE
    
    @classmethod
    def validate_file_size(cls, file_size: int) -> None:
        """Valide la taille du fichier"""
        if file_size > cls.MAX_FILE_SIZE:
            raise FileTooLargeError(cls.MAX_FILE_SIZE)
        if file_size == 0:
            raise InvalidFileTypeError(cls.ALLOWED_EXTENSIONS)
    
    @classmethod
    def validate_file_extension(cls, filename: str) -> str:
        """Valide l'extension du fichier"""
        if not filename or '.' not in filename:
            raise InvalidFileTypeError(cls.ALLOWED_EXTENSIONS)
        
        extension = filename.rsplit('.', 1)[1].lower()
        if extension not in cls.ALLOWED_EXTENSIONS:
            raise InvalidFileTypeError(cls.ALLOWED_EXTENSIONS)
        
        return extension
    
    @classmethod
    async def validate_file_content(cls, file: UploadFile) -> Tuple[str, bytes]:
        """Valide le contenu du fichier par Magic Numbers"""
        # Lire le contenu du fichier
        content = await file.read()
        await file.seek(0)  # Remettre le curseur au début
        
        # Valider la taille
        file_size = len(content)
        cls.validate_file_size(file_size)
        
        # Valider l'extension
        extension = cls.validate_file_extension(file.filename)
        
        # Valider par Magic Numbers
        mime_type = cls._detect_mime_type(content)
        
        if mime_type not in cls.ALLOWED_MIME_TYPES:
            raise InvalidFileTypeError(cls.ALLOWED_EXTENSIONS)
        
        # Vérifier la cohérence entre extension et MIME type
        expected_mime = cls._get_expected_mime_for_extension(extension)
        if mime_type != expected_mime:
            raise InvalidFileTypeError(cls.ALLOWED_EXTENSIONS)
        
        return mime_type, content
    
    @classmethod
    def _detect_mime_type(cls, content: bytes) -> str:
        """Détecte le type MIME par Magic Numbers"""
        # Vérifier les magic numbers
        for magic_bytes, mime_type in cls.MAGIC_NUMBERS.items():
            if content.startswith(magic_bytes):
                return mime_type
        
        # Fallback: utiliser python-magic si disponible
        try:
            import magic
            mime = magic.Magic(mime=True)
            detected = mime.from_buffer(content)
            # Vérifier que le type détecté est autorisé
            if detected in cls.ALLOWED_MIME_TYPES:
                return detected
        except (ImportError, Exception):
            pass
        
        # Si python-magic n'est pas disponible ou n'a pas détecté, utiliser la détection basique
        if content.startswith(b'\x25\x50\x44\x46'):
            return 'application/pdf'
        elif content.startswith(b'\xFF\xD8\xFF'):
            return 'image/jpeg'
        elif content.startswith(b'\x89\x50\x4E\x47'):
            return 'image/png'
        else:
            raise InvalidFileTypeError(cls.ALLOWED_EXTENSIONS)
    
    @classmethod
    def _get_expected_mime_for_extension(cls, extension: str) -> str:
        """Retourne le type MIME attendu pour une extension"""
        mapping = {
            'pdf': 'application/pdf',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
        }
        return mapping.get(extension.lower(), 'application/octet-stream')

