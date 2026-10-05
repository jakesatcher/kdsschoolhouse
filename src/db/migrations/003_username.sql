-- Accounts are now identified by a username; email is no longer collected.
ALTER TABLE users ADD COLUMN username text;
UPDATE users SET username = lower(email);
ALTER TABLE users ALTER COLUMN username SET NOT NULL;
CREATE UNIQUE INDEX users_username_lower_idx ON users (lower(username));
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
