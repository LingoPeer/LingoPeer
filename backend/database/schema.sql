-- AI English Platform — PostgreSQL schema
-- Run once: psql $DATABASE_URL -f database/schema.sql
--
-- Uses UUID primary keys. If you already have a `users` table with SERIAL ids,
-- do not run this blindly; plan a migration instead.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username   VARCHAR(120) NOT NULL,
  email      VARCHAR(255) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_lower ON users (LOWER(username));

-- ---------------------------------------------------------------------------
-- placement exams (questions include correctIndex for server-side scoring;
-- API responses strip sensitive fields)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS exams (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL DEFAULT 'AI Placement Exam',
  questions   JSONB NOT NULL DEFAULT '[]'::jsonb,
  status      VARCHAR(32) NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'completed', 'expired')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_exams_user_status ON exams (user_id, status);

-- ---------------------------------------------------------------------------
-- exam_answers — one row per submitted placement (answers array in JSONB)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS exam_answers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id    UUID NOT NULL REFERENCES exams (id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  answers    JSONB NOT NULL,
  raw_score  NUMERIC(5, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (exam_id)
);

CREATE INDEX IF NOT EXISTS idx_exam_answers_user ON exam_answers (user_id);

-- ---------------------------------------------------------------------------
-- user_levels — CEFR level after placement (history: multiple rows per user)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_levels (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  exam_id     UUID REFERENCES exams (id) ON DELETE SET NULL,
  level       VARCHAR(8) NOT NULL CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  weak_areas  JSONB NOT NULL DEFAULT '[]'::jsonb,
  ai_summary  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_levels_user_created ON user_levels (user_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- roadmaps — predefined CEFR-aligned learning plan
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roadmaps (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  level      VARCHAR(8) NOT NULL CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  content    JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_roadmaps_user_created ON roadmaps (user_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- lessons — roadmap-backed lesson units
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lessons (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  roadmap_id  UUID REFERENCES roadmaps (id) ON DELETE SET NULL,
  week_index  INT NOT NULL DEFAULT 1,
  sort_index  INT NOT NULL DEFAULT 0,
  title       VARCHAR(500) NOT NULL,
  content     JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lessons_user ON lessons (user_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- progress — completed lessons, scores, weak areas
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS progress (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  lesson_id   UUID REFERENCES lessons (id) ON DELETE SET NULL,
  score       NUMERIC(5, 2),
  weak_areas  JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_progress_user ON progress (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_progress_lesson ON progress (lesson_id);

-- ---------------------------------------------------------------------------
-- notes — user notepad
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  title      VARCHAR(500),
  body       TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notes_user ON notes (user_id, updated_at DESC);

-- ---------------------------------------------------------------------------
-- community_messages — public chat history (text + voice)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS community_messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  sender_name  VARCHAR(120) NOT NULL DEFAULT 'Learner',
  sender_avatar VARCHAR(500),
  type         VARCHAR(16) NOT NULL DEFAULT 'text'
               CHECK (type IN ('text', 'voice')),
  text         TEXT NOT NULL DEFAULT '',
  audio_url    VARCHAR(800),
  duration     INT CHECK (duration >= 0),
  room         VARCHAR(120) NOT NULL DEFAULT 'global',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_messages_room_created ON community_messages (room, created_at DESC);
