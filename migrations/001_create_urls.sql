CREATE TABLE IF NOT EXISTS urls (
  id SERIAL PRIMARY KEY, -- unique internal ID
  slug TEXT UNIQUE NOT NULL, -- short code that would be in the url
  target TEXT NOT NULL, -- original long url
  visits INTEGER DEFAULT 0, -- total # times the link has been clicked
  created_at TIMESTAMPTZ DEFAULT NOW() -- timestamp of creation
);