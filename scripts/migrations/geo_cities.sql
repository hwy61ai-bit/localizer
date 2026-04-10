-- geo_cities: structured city lookup table for three-tier geocoding
-- Run manually in Supabase SQL Editor. Do NOT use an automated migration runner.

-- Create the geo_cities lookup table
CREATE TABLE IF NOT EXISTS geo_cities (
  id              uuid primary key default gen_random_uuid(),
  geoname_id      integer,
  name            text not null,
  name_ascii      text,
  name_lower      text not null,
  state_province  text,
  state_code      text,
  country         text not null,           -- ISO 3166-1 alpha-2 (US, CA, GB, etc.)
  lat             numeric not null,
  lng             numeric not null,
  population      integer default 0,
  timezone        text,
  iata_code       text,                    -- airport code (JFK, LAX, LHR, etc.) — null for most cities
  source          text default 'geonames', -- 'geonames' | 'geocode_api' | 'manual' | 'airport_seed'
  created_at      timestamptz default now()
);

-- Indexes
CREATE INDEX idx_geo_cities_name_country ON geo_cities(name_lower, country);
CREATE INDEX idx_geo_cities_country_state ON geo_cities(country, state_province);
CREATE INDEX idx_geo_cities_coords ON geo_cities USING gist (
  point(lng::float8, lat::float8)
);
CREATE INDEX idx_geo_cities_population ON geo_cities(country, population DESC);
CREATE INDEX idx_geo_cities_geoname_id ON geo_cities(geoname_id);
CREATE INDEX idx_geo_cities_iata ON geo_cities(iata_code) WHERE iata_code IS NOT NULL;

-- RLS
ALTER TABLE geo_cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read" ON geo_cities
  FOR SELECT USING (true);

CREATE POLICY "authenticated_insert" ON geo_cities
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "service_role_all" ON geo_cities
  FOR ALL USING (true) WITH CHECK (true);

-- Nearest airport lookup function
CREATE OR REPLACE FUNCTION nearest_airport(
  search_lat float8,
  search_lng float8,
  max_distance_km float8 DEFAULT 150
)
RETURNS TABLE(
  name text,
  iata_code text,
  lat numeric,
  lng numeric,
  distance_km float8
)
LANGUAGE sql STABLE
AS $$
  SELECT
    name,
    iata_code,
    lat,
    lng,
    (point(search_lng, search_lat) <-> point(lng::float8, lat::float8)) * 111.32 AS distance_km
  FROM geo_cities
  WHERE iata_code IS NOT NULL
    AND (point(search_lng, search_lat) <-> point(lng::float8, lat::float8)) * 111.32 <= max_distance_km
  ORDER BY point(search_lng, search_lat) <-> point(lng::float8, lat::float8)
  LIMIT 1;
$$;
