"""
Validation des fichiers par Magic Numbers
"""
from typing import Tuple
from fastapi import UploadFile

from app.core.config import settings
from app.core.exceptions import InvalidFileTypeError, FileTooLargeError


class FileValidator:
    """Classe pour valider les fichiers"""
    
    # Magic numbers pour les types de fichiers autorisés (PDF et DOCX uniquement)
    MAGIC_NUMBERS = {
        # PDF
        b'\x25\x50\x44\x46': 'application/pdf',  # %PDF
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
        
        # Vérifier la cohérence entre extension et MIME type
        expected_mime = cls._get_expected_mime_for_extension(extension)
        if mime_type != expected_mime:
            logger.warning(f"MIME type mismatch: detected={mime_type}, expected={expected_mime} for extension={extension}")
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
            # DOCX détecté par python-magic
            if 'wordprocessingml' in str(detected) and 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' in cls.ALLOWED_MIME_TYPES:
                return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        except (ImportError, Exception) as e:
            logger.warning(f"python-magic not available or error: {e}")
        
        # Si python-magic n'est pas disponible ou n'a pas détecté, utiliser la détection basique
        if content.startswith(b'\x25\x50\x44\x46'):
            return 'application/pdf'
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
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        }
        return mapping.get(extension.lower(), 'application/octet-stream')

    # Validation spécifique pour les photos de profil (images uniquement)
    IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'jpe', 'jfif', 'png', 'webp', 'gif', 'bmp', 'heic', 'heif', 'tiff', 'tif']
    IMAGE_MIME_TYPES = [
        'image/jpeg', 'image/jpg', 'image/pjpeg', 'image/png', 'image/webp', 'image/gif',
        'image/bmp', 'image/x-ms-bmp', 'image/heic', 'image/heif', 'image/x-heic', 'image/x-heif',
        'image/tiff', 'image/x-tiff'
    ]
    IMAGE_MAX_SIZE = 5 * 1024 * 1024  # 5MB

    @classmethod
    async def validate_image_content(cls, file: UploadFile) -> Tuple[str, bytes]:
        """Valide une image (photo de profil). Accepte JPG, PNG, WebP, GIF, BMP, HEIC (max 5MB)."""
        import logging
        logger = logging.getLogger(__name__)

        content = await file.read()
        await file.seek(0)

        file_size = len(content)
        logger.info(f"Image validation: size={file_size}, filename={file.filename}")

        if file_size > cls.IMAGE_MAX_SIZE:
            raise FileTooLargeError(cls.IMAGE_MAX_SIZE)
        if file_size == 0:
            raise InvalidFileTypeError(cls.IMAGE_EXTENSIONS)

        if not file.filename or '.' not in file.filename:
            raise InvalidFileTypeError(cls.IMAGE_EXTENSIONS)
        extension = file.filename.rsplit('.', 1)[1].lower()
        if extension not in cls.IMAGE_EXTENSIONS:
            raise InvalidFileTypeError(cls.IMAGE_EXTENSIONS)

        mime_type = cls._detect_image_mime_type(content, getattr(file, 'content_type', None))
        logger.info(f"Detected image MIME type: {mime_type}")

        if mime_type not in cls.IMAGE_MIME_TYPES:
            raise InvalidFileTypeError(cls.IMAGE_EXTENSIONS)

        return mime_type, content

    @classmethod
    def _detect_image_mime_type(cls, content: bytes, content_type: str = None) -> str:
        """Détecte le type MIME d'une image."""
        # Magic numbers
        if content.startswith(b'\xFF\xD8\xFF'):
            return 'image/jpeg'
        if content.startswith(b'\x89\x50\x4E\x47'):
            return 'image/png'
        if len(content) >= 12 and content[:4] == b'RIFF' and content[8:12] == b'WEBP':
            return 'image/webp'
        if content.startswith(b'GIF87a') or content.startswith(b'GIF89a'):
            return 'image/gif'
        if content.startswith(b'BM'):
            return 'image/bmp'
        # TIFF (little-endian or big-endian)
        if len(content) >= 4 and (content[:4] == b'II*\x00' or content[:4] == b'MM\x00*'):
            return 'image/tiff'
        # HEIC/HEIF (ftyp box)
        if len(content) >= 12 and content[4:8] == b'ftyp':
            if b'heic' in content[:24] or b'heix' in content[:24] or b'mif1' in content[:24]:
                return 'image/heic'
        # python-magic fallback
        try:
            import magic
            mime = magic.Magic(mime=True)
            detected = mime.from_buffer(content)
            if detected and detected.startswith('image/'):
                if detected in ('image/jpg', 'image/pjpeg'):
                    return 'image/jpeg'
                if detected == 'image/x-ms-bmp':
                    return 'image/bmp'
                if detected in ('image/x-tiff', 'image/tiff'):
                    return 'image/tiff'
                return detected
        except (ImportError, Exception):
            pass
        # Fallback: content-type du header si image/*
        if content_type and content_type.startswith('image/'):
            return content_type.split(';')[0].strip()
        raise InvalidFileTypeError(cls.IMAGE_EXTENSIONS)

