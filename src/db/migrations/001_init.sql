CREATE TABLE users (
  id                   bigserial PRIMARY KEY,
  email                text NOT NULL,
  name                 text NOT NULL,
  password_hash        text NOT NULL,
  role                 text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  status               text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'disabled')),
  request_note         text,
  failed_attempts      integer NOT NULL DEFAULT 0,
  locked_until         timestamptz,
  must_change_password boolean NOT NULL DEFAULT false,
  last_login_at        timestamptz,
  approved_at          timestamptz,
  approved_by          bigint REFERENCES users(id) ON DELETE SET NULL,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX users_email_lower_idx ON users (lower(email));

-- connect-pg-simple session store
CREATE TABLE user_sessions (
  sid    varchar NOT NULL PRIMARY KEY,
  sess   json NOT NULL,
  expire timestamp(6) NOT NULL
);
CREATE INDEX user_sessions_expire_idx ON user_sessions (expire);

CREATE TABLE audit_log (
  id          bigserial PRIMARY KEY,
  user_id     bigint REFERENCES users(id) ON DELETE SET NULL,
  action      text NOT NULL,
  target_type text,
  target_id   text,
  detail      jsonb,
  ip          text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_log_created_idx ON audit_log (created_at DESC);
