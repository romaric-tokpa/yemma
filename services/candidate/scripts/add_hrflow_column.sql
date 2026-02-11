-- Migration manuelle : ajout de hrflow_profile_key (Profile Asking / CvGPT)
-- À exécuter si Alembic n'est pas disponible dans le conteneur.
-- Usage: voir README ou DEMARRAGE_LOCAL.md

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hrflow_profile_key VARCHAR(255);
