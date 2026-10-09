-- Private schema: not exposed through the public Data API.
CREATE SCHEMA IF NOT EXISTS rincon;
REVOKE ALL ON SCHEMA rincon FROM PUBLIC;
CREATE TABLE IF NOT EXISTS rincon.meta (key text PRIMARY KEY, value text NOT NULL);
CREATE TABLE IF NOT EXISTS rincon.sessions (token text PRIMARY KEY, expires bigint NOT NULL, version text NOT NULL);
CREATE TABLE IF NOT EXISTS rincon.media (
  id text PRIMARY KEY, kind text NOT NULL, filename text NOT NULL, mime text NOT NULL,
  size integer NOT NULL CHECK(size > 0), title text NOT NULL, date text NOT NULL,
  album text NOT NULL DEFAULT '', tags text NOT NULL DEFAULT '[]', favorite integer NOT NULL DEFAULT 0,
  artist text NOT NULL DEFAULT '', "createdAt" text NOT NULL,
  "storedBytes" integer NOT NULL CHECK("storedBytes" >= size)
);
CREATE TABLE IF NOT EXISTS rincon.notes (
  id text PRIMARY KEY, type text NOT NULL, title text NOT NULL, body text NOT NULL,
  author text NOT NULL, date text NOT NULL, favorite integer NOT NULL DEFAULT 0, "createdAt" text NOT NULL
);
CREATE INDEX IF NOT EXISTS media_date ON rincon.media(date);
CREATE INDEX IF NOT EXISTS sessions_expiry ON rincon.sessions(expires);
ALTER TABLE rincon.meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE rincon.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rincon.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE rincon.notes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA rincon FROM PUBLIC;
-- No anonymous/authenticated policies: application connects through its backend only.
