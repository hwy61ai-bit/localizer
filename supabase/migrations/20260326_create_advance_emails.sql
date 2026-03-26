CREATE TABLE IF NOT EXISTS advance_emails (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES orgs(id),
  tour_id uuid NOT NULL,
  show_id uuid NOT NULL,
  email_type text NOT NULL, -- initial, followup_1, followup_2, final_nudge
  recipient_email text NOT NULL,
  resend_id text,
  status text DEFAULT 'sent', -- sent, delivered, opened, clicked, bounced, complained
  sent_at timestamptz DEFAULT now(),
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  bounced_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_advance_emails_show ON advance_emails(show_id);
CREATE INDEX IF NOT EXISTS idx_advance_emails_tour ON advance_emails(tour_id);

-- Also add advance_followup_date and advance_recipient_name if missing
ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS advance_followup_date text;
ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS advance_recipient_name text;
ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS advance_recipient_email text;
ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS load_in_notes text;
