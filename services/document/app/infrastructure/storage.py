"""
Gestion du stockage S3/MinIO avec Boto3
"""
import boto3
from botocore.client import Config
from botocore.exceptions import ClientError
from typing import Optional

from app.core.config import settings
from app.core.exceptions import DocumentError


class S3Storage:
    """Classe pour gérer le stockage S3/MinIO"""
    
    def __init__(self):
        self.client = None
        self.bucket_name = settings.S3_BUCKET_NAME
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialise le client S3"""
        self.client = boto3.client(
            's3',
            endpoint_url=settings.S3_ENDPOINT,
            aws_access_key_id=settings.S3_ACCESS_KEY,
            aws_secret_access_key=settings.S3_SECRET_KEY,
            region_name=settings.S3_REGION,
            use_ssl=settings.S3_USE_SSL,
            config=Config(signature_version='s3v4', s3={'addressing_style': 'path' if settings.S3_FORCE_PATH_STYLE else 'auto'})
        )
    
    async def create_bucket_if_not_exists(self):
        """Crée le bucket s'il n'existe pas et configure l'encryption par défaut"""
        try:
            self.client.head_bucket(Bucket=self.bucket_name)
            # Vérifier et configurer l'encryption si nécessaire
            await self._configure_bucket_encryption()
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == '404':
                # Bucket n'existe pas, le créer
                try:
                    self.client.create_bucket(Bucket=self.bucket_name)
                    # Configurer l'encryption par défaut
                    await self._configure_bucket_encryption()
                except ClientError as create_error:
                    raise DocumentError(f"Failed to create bucket: {str(create_error)}")
            else:
                raise DocumentError(f"Failed to check bucket: {str(e)}")
    
    async def _configure_bucket_encryption(self):
        """Configure l'encryption Server-Side pour le bucket"""
        try:
            encryption_config = {
                'Rules': [{
                    'ApplyServerSideEncryptionByDefault': {
                        'SSEAlgorithm': settings.S3_SERVER_SIDE_ENCRYPTION
                    }
                }]
            }
            
            # Si KMS est utilisé, ajouter la clé KMS
            if settings.S3_SERVER_SIDE_ENCRYPTION == 'aws:kms' and settings.S3_KMS_KEY_ID:
                encryption_config['Rules'][0]['ApplyServerSideEncryptionByDefault']['KMSMasterKeyID'] = settings.S3_KMS_KEY_ID
            
            self.client.put_bucket_encryption(
                Bucket=self.bucket_name,
                ServerSideEncryptionConfiguration=encryption_config
            )
        except ClientError as e:
            # MinIO peut ne pas supporter toutes les options d'encryption
            # On continue sans erreur si c'est le cas
            if 'NotImplemented' not in str(e):
                print(f"Warning: Could not configure bucket encryption: {str(e)}")
    
    async def upload_file(self, file_content: bytes, s3_key: str, content_type: str) -> bool:
        """Upload un fichier vers S3 avec Server-Side Encryption"""
        try:
            put_params = {
                'Bucket': self.bucket_name,
                'Key': s3_key,
                'Body': file_content,
                'ContentType': content_type,
                'ServerSideEncryption': settings.S3_SERVER_SIDE_ENCRYPTION
            }
            
            # Si KMS est utilisé, ajouter la clé KMS
            if settings.S3_SERVER_SIDE_ENCRYPTION == 'aws:kms' and settings.S3_KMS_KEY_ID:
                put_params['SSEKMSKeyId'] = settings.S3_KMS_KEY_ID
            
            self.client.put_object(**put_params)
            return True
        except ClientError as e:
            raise DocumentError(f"Failed to upload file: {str(e)}")
    
    async def generate_presigned_url(self, s3_key: str, expiration: int = 3600) -> str:
        """Génère une URL présignée temporaire"""
        try:
            url = self.client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': s3_key},
                ExpiresIn=expiration
            )
            return url
        except ClientError as e:
            raise DocumentError(f"Failed to generate presigned URL: {str(e)}")
    
    async def delete_file(self, s3_key: str) -> bool:
        """Supprime un fichier de S3"""
        try:
            self.client.delete_object(Bucket=self.bucket_name, Key=s3_key)
            return True
        except ClientError as e:
            raise DocumentError(f"Failed to delete file: {str(e)}")
    
    async def file_exists(self, s3_key: str) -> bool:
        """Vérifie si un fichier existe"""
        try:
            self.client.head_object(Bucket=self.bucket_name, Key=s3_key)
            return True
        except ClientError:
            return False


# Instance globale
s3_storage = S3Storage()


async def init_storage():
    """Initialise le stockage (crée le bucket si nécessaire)"""
    await s3_storage.create_bucket_if_not_exists()

