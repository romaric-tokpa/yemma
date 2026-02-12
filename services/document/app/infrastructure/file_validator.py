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
        # DOCX (Office Open XML = ZIP)
        b'PK\x03\x04': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    }
    
    # Extensions autorisées (utiliser la propriété pour convertir la string en liste)
    @classmethod
    def get_allowed_extensions(cls):
        """Retourne les extensions autorisées comme une liste"""
        return settings.allowed_extensions_list
    
    ALLOWED_MIME_TYPES = settings.ALLOWED_MIME_TYPES
    MAX_FILE_SIZE = settings.MAX_FILE_SIZE
    
    @classmethod
    def validate_file_size(cls, file_size: int) -> None:
        """Valide la taille du fichier"""
        if file_size > cls.MAX_FILE_SIZE:
            raise FileTooLargeError(cls.MAX_FILE_SIZE)
        if file_size == 0:
            raise InvalidFileTypeError(cls.get_allowed_extensions())
    
    @classmethod
    def validate_file_extension(cls, filename: str) -> str:
        """Valide l'extension du fichier"""
        allowed_exts = cls.get_allowed_extensions()
        if not filename or '.' not in filename:
            raise InvalidFileTypeError(allowed_exts)
        
        extension = filename.rsplit('.', 1)[1].lower()
        if extension not in allowed_exts:
            raise InvalidFileTypeError(allowed_exts)
        
        return extension
    
    @classmethod
    async def validate_file_content(cls, file: UploadFile) -> Tuple[str, bytes]:
        """Valide le contenu du fichier par Magic Numbers"""
        import logging
        logger = logging.getLogger(__name__)
        
        # Lire le contenu du fichier
        content = await file.read()
        await file.seek(0)  # Remettre le curseur au début
        
        # Valider la taille
        file_size = len(content)
        logger.info(f"File size: {file_size}, filename: {file.filename}")
        cls.validate_file_size(file_size)
        
        # Valider l'extension
        extension = cls.validate_file_extension(file.filename)
        logger.info(f"File extension validated: {extension}")
        
        # Valider par Magic Numbers
        mime_type = cls._detect_mime_type(content)
        logger.info(f"Detected MIME type: {mime_type}")
        
        if mime_type not in cls.ALLOWED_MIME_TYPES:
            logger.error(f"MIME type {mime_type} not in allowed types: {cls.ALLOWED_MIME_TYPES}")
            raise InvalidFileTypeError(cls.get_allowed_extensions())
        
        # Vérifier la cohérence entre extension et MIME type (plus permissif)
        expected_mime = cls._get_expected_mime_for_extension(extension)
        if mime_type != expected_mime:
            logger.warning(f"MIME type mismatch: detected={mime_type}, expected={expected_mime} for extension={extension}")
            # Pour les images, on accepte si le MIME type est valide même si l'extension ne correspond pas exactement
            if mime_type in ['image/jpeg', 'image/png'] and extension in ['jpg', 'jpeg', 'png']:
                logger.info(f"Accepting image despite extension mismatch")
            else:
                raise InvalidFileTypeError(cls.get_allowed_extensions())
        
        return mime_type, content
    
    @classmethod
    def _detect_mime_type(cls, content: bytes) -> str:
        """Détecte le type MIME par Magic Numbers"""
        import logging
        logger = logging.getLogger(__name__)
        
        # Vérifier les magic numbers
        for magic_bytes, mime_type in cls.MAGIC_NUMBERS.items():
            if content.startswith(magic_bytes):
                logger.info(f"Detected MIME type {mime_type} by magic number")
                return mime_type
        
        # Fallback: utiliser python-magic si disponible
        try:
            import magic
            mime = magic.Magic(mime=True)
            detected = mime.from_buffer(content)
            logger.info(f"python-magic detected: {detected}")
            # Vérifier que le type détecté est autorisé
            if detected in cls.ALLOWED_MIME_TYPES:
                return detected
            # Accepter aussi les variantes (ex: image/jpg au lieu de image/jpeg)
            if detected == 'image/jpg' and 'image/jpeg' in cls.ALLOWED_MIME_TYPES:
                return 'image/jpeg'
            # DOCX détecté par python-magic
            if 'wordprocessingml' in str(detected) and 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' in cls.ALLOWED_MIME_TYPES:
                return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        except (ImportError, Exception) as e:
            logger.warning(f"python-magic not available or error: {e}")
        
        # Si python-magic n'est pas disponible ou n'a pas détecté, utiliser la détection basique
        if content.startswith(b'\x25\x50\x44\x46'):
            return 'application/pdf'
        elif content.startswith(b'\xFF\xD8\xFF'):
            return 'image/jpeg'
        elif content.startswith(b'\x89\x50\x4E\x47'):
            return 'image/png'
        elif content.startswith(b'PK\x03\x04'):
            return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        else:
            logger.error(f"Could not detect MIME type. First bytes: {content[:20]}")
            raise InvalidFileTypeError(cls.get_allowed_extensions())
    
    @classmethod
    def _get_expected_mime_for_extension(cls, extension: str) -> str:
        """Retourne le type MIME attendu pour une extension"""
        mapping = {
            'pdf': 'application/pdf',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        }
        return mapping.get(extension.lower(), 'application/octet-stream')

