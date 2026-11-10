-- PLATA LIFE / Neon PostgreSQL schema. Run once in the Neon SQL Editor.
-- Application access is scoped in every server route by the authenticated user's UUID.
-- Keep DATABASE_URL server-only. Do not enable unauthenticated database access.
BEGIN;
CREATE TABLE IF NOT EXISTS app_users (
  auth_user_id uuid PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('income','expense')),
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  category text NOT NULL CHECK (length(category) BETWEEN 1 AND 40),
  note varchar(160),
  occurred_on date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS transactions_user_date_idx ON transactions (user_id, occurred_on DESC, created_at DESC);
CREATE TABLE IF NOT EXISTS workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title varchar(80) NOT NULL CHECK (length(title) BETWEEN 2 AND 80),
  duration_minutes integer NOT NULL CHECK (duration_minutes BETWEEN 1 AND 600),
  notes varchar(500),
  completed_on date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS workouts_user_date_idx ON workouts (user_id, completed_on DESC, created_at DESC);
CREATE TABLE IF NOT EXISTS wellness_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title varchar(100) NOT NULL,
  domain text NOT NULL CHECK (domain IN ('finance','fitness','wellbeing')),
  target_amount numeric(14,2),
  current_amount numeric(14,2) NOT NULL DEFAULT 0,
  target_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (target_amount IS NULL OR target_amount > 0),
  CHECK (current_amount >= 0)
);
CREATE INDEX IF NOT EXISTS wellness_goals_user_idx ON wellness_goals (user_id, created_at DESC);
COMMIT;
