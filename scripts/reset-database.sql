-- Réinitialisation des données (comptes, profils, entreprises, etc.)
-- Conserve la structure des tables et les migrations (alembic_version non touché).
-- Seules les tables qui existent sont vidées.

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'access_logs', 'notifications', 'documents', 'quotas', 'invoices', 'payments',
    'subscriptions', 'plans', 'invitations', 'team_members', 'companies',
    'job_preferences', 'skills', 'certifications', 'educations', 'experiences', 'profiles',
    'refresh_tokens', 'user_roles', 'users', 'roles'
  ];
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
      EXECUTE format('TRUNCATE TABLE %I RESTART IDENTITY CASCADE', t);
      RAISE NOTICE 'Truncated: %', t;
    END IF;
  END LOOP;
END $$;
