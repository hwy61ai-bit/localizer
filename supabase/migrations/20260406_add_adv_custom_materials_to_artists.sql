ALTER TABLE artists ADD COLUMN IF NOT EXISTS adv_custom_materials jsonb DEFAULT '[]'::jsonb;
