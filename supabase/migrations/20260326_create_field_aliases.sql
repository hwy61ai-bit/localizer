CREATE TABLE IF NOT EXISTS field_aliases (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  scope text NOT NULL DEFAULT 'account', -- account, agency, global
  org_id uuid REFERENCES orgs(id), -- NULL for global scope
  agency_name text, -- NULL unless agency scope
  header_normalized text NOT NULL, -- lowercase, trimmed, no punctuation
  header_original text NOT NULL, -- original header text for display
  field_key text NOT NULL, -- TourRouter field key (e.g. "offer", "city", "doors")
  confirmed_count integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_field_aliases_lookup ON field_aliases(header_normalized, scope);
CREATE INDEX IF NOT EXISTS idx_field_aliases_org ON field_aliases(org_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_field_aliases_unique ON field_aliases(header_normalized, scope, COALESCE(org_id, '00000000-0000-0000-0000-000000000000'), COALESCE(agency_name, ''));
