-- ═══════════════════════════════════════════════════════════
-- Chat leads — potenciales clientes que interactuaron con el chatbot
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS chat_lead (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT,
  interes     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: solo el service_role (Edge Functions) puede insertar/leer
ALTER TABLE chat_lead ENABLE ROW LEVEL SECURITY;

-- Policy: no public access (solo via Edge Functions con service_role)
-- Los administradores autenticados pueden leer los leads
CREATE POLICY "Admins can read chat leads"
  ON chat_lead FOR SELECT
  TO authenticated
  USING (true);
