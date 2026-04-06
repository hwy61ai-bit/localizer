ALTER TABLE artists ADD COLUMN IF NOT EXISTS manager_phone text;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS booking_agent_phone text;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS publicist_phone text;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS agent_phone text;
