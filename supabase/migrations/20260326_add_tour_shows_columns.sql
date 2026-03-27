-- Hotel fields (14)
ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS is_load_in boolean default false;
ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS hotel_name text;
ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS hotel_address text;
ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS hotel_checkin text;
ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS hotel_checkout text;
ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS hotel_rooms integer;
ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS hotel_rate numeric;
ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS hotel_currency text;
ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS hotel_confirmation text;
ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS hotel_notes text;
ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS hotel_block boolean default false;
ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS hotel_block_size integer;
ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS hotel_block_rate numeric;
ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS hotel_cutoff_date text;
ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS hotel_attrition_pct numeric;

-- Advance fields (11)
ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS advance_status text default 'not_started';
ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS advance_notes text;
ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS advance_sent_at timestamptz;
ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS advance_confirmed_at timestamptz;
ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS advance_confirmed_by text;
ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS advance_escalated boolean default false;
ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS advance_auto_stop boolean default false;
ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS advance_form_token text unique;
ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS advance_form_submitted_at timestamptz;
ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS load_in_time text;
ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS load_in_location text;

-- Venue advance response fields (8)
ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS venue_wifi_name text;
ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS venue_wifi_password text;
ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS venue_notes text;
ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS venue_socials jsonb;
ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS settlement_contact text;
ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS settlement_contact_phone text;
ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS settlement_contact_email text;

-- Deal, settlement, co-headliner JSONB
ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS deal jsonb;
ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS settlement jsonb;
ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS co_headliner jsonb;

-- Guest list, deposit, production
ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS guest_list_cutoff timestamptz;
ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS deposit_amount numeric;
ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS deposit_currency text;
ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS deposit_collected_by text;
ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS deposit_status text;
ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS deposit_notes text;
ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS production_contact text;
ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS production_contact_phone text;
ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS production_contact_email text;
