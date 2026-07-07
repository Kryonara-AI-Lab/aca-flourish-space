-- Add pinning + public sharing to materials
ALTER TABLE public.materials
  ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pinned_at timestamptz;

CREATE INDEX IF NOT EXISTS materials_owner_pinned_idx
  ON public.materials (user_id, is_pinned DESC, pinned_at DESC NULLS LAST, created_at DESC);

-- Public read policy: anyone (incl. anon) can read materials marked public.
DROP POLICY IF EXISTS "Public materials are readable by anyone" ON public.materials;
CREATE POLICY "Public materials are readable by anyone"
  ON public.materials FOR SELECT
  USING (is_public = true);

-- Ensure anon can actually see the SELECT (RLS still filters to public rows).
GRANT SELECT ON public.materials TO anon;