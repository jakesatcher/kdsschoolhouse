-- Favorites and the Print Later queue. A row is either a pinned worksheet URL (re-built from its seed) or stored
-- content (AI-written / teacher-edited reading sheets, which cannot be re-built).
CREATE TABLE saved_items (
  id          bigserial PRIMARY KEY,
  user_id     bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject     text NOT NULL CHECK (subject IN ('math', 'reading', 'writing')),
  kind        text NOT NULL,
  title       text NOT NULL,
  subtitle    text,
  url         text,
  content     jsonb,
  favorite    boolean NOT NULL DEFAULT false,
  print_later boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CHECK (url IS NOT NULL OR content IS NOT NULL)
);
CREATE INDEX saved_items_user_idx ON saved_items (user_id, subject, created_at DESC);
CREATE UNIQUE INDEX saved_items_user_url_idx ON saved_items (user_id, url) WHERE url IS NOT NULL;
