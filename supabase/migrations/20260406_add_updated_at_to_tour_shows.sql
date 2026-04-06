ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS updated_at timestamptz default now();
