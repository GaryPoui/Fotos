-- Explicit additive extension for existing private rincon deployments.
-- Existing rows remain NULL; no dates, titles, notes or file references are rewritten.
BEGIN;
ALTER TABLE rincon.media ADD COLUMN IF NOT EXISTS "capturedAt" text;
ALTER TABLE rincon.media ADD COLUMN IF NOT EXISTS "captureOffset" text;
ALTER TABLE rincon.media ADD COLUMN IF NOT EXISTS "dateSource" text;
COMMIT;
