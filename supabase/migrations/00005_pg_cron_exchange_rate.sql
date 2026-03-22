-- Extensiones necesarias (ya habilitadas)
CREATE EXTENSION IF NOT EXISTS pg_cron SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

-- Job diario a las 8:00 AM Chile (UTC-3 → 11:00 UTC)
-- Invoca la Edge Function exchange-rate-daily
SELECT cron.schedule(
  'exchange-rate-daily',
  '0 11 * * *',
  $$
  SELECT net.http_post(
    url := 'https://aksnnfqcoywrqxiqnemo.supabase.co/functions/v1/exchange-rate-daily',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrc25uZnFjb3l3cnF4aXFuZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzg4MDQ0NCwiZXhwIjoyMDg5NDU2NDQ0fQ.ldc4nynbjLDas9GyeEymb-lvog0wBZxigpdVqQA1sTA", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
