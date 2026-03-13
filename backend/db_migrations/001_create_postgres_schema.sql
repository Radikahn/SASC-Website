-- migrate:statement
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'decay_time_enum') THEN
    CREATE TYPE decay_time_enum AS ENUM ('weekly', 'biweekly', 'monthly');
  END IF;
END
$$;

-- migrate:statement
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attempt_mode_enum') THEN
    CREATE TYPE attempt_mode_enum AS ENUM ('single', 'practice_exam');
  END IF;
END
$$;

-- migrate:statement
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'answer_choice_enum') THEN
    CREATE TYPE answer_choice_enum AS ENUM ('A', 'B', 'C', 'D', 'E');
  END IF;
END
$$;

-- migrate:statement
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  discord_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  stat_decay BOOLEAN NOT NULL DEFAULT TRUE,
  decay_time decay_time_enum NOT NULL DEFAULT 'biweekly',
  overall_elo NUMERIC(4, 2) NOT NULL DEFAULT 0 CHECK (overall_elo >= 0 AND overall_elo <= 10)
);

-- migrate:statement
CREATE TABLE IF NOT EXISTS exams (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  CHECK (code = UPPER(code))
);

-- migrate:statement
CREATE TABLE IF NOT EXISTS topics (
  id BIGSERIAL PRIMARY KEY,
  exam_id BIGINT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  UNIQUE (exam_id, name)
);

-- migrate:statement
CREATE TABLE IF NOT EXISTS questions (
  id BIGSERIAL PRIMARY KEY,
  exam_id BIGINT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL CHECK (question_number > 0),
  image_path TEXT NOT NULL,
  solution_text TEXT NOT NULL,
  correct_answer answer_choice_enum,
  UNIQUE (exam_id, question_number)
);

-- migrate:statement
CREATE TABLE IF NOT EXISTS question_topics (
  question_id BIGINT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  topic_id BIGINT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (question_id, topic_id)
);

-- migrate:statement
CREATE TABLE IF NOT EXISTS user_exam_ratings (
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exam_id BIGINT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  elo NUMERIC(4, 2) NOT NULL DEFAULT 0 CHECK (elo >= 0 AND elo <= 10),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, exam_id)
);

-- migrate:statement
CREATE TABLE IF NOT EXISTS practice_exams (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exam_id BIGINT NOT NULL REFERENCES exams(id) ON DELETE RESTRICT,
  difficulty NUMERIC(4, 2) NOT NULL CHECK (difficulty >= 0 AND difficulty <= 10),
  score NUMERIC(5, 2) CHECK (score >= 0 AND score <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- migrate:statement
CREATE TABLE IF NOT EXISTS practice_exam_questions (
  practice_exam_id BIGINT NOT NULL REFERENCES practice_exams(id) ON DELETE CASCADE,
  question_id BIGINT NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
  position INTEGER NOT NULL CHECK (position > 0),
  PRIMARY KEY (practice_exam_id, position),
  UNIQUE (practice_exam_id, question_id)
);

-- migrate:statement
CREATE TABLE IF NOT EXISTS question_attempts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id BIGINT NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
  practice_exam_id BIGINT REFERENCES practice_exams(id) ON DELETE SET NULL,
  mode attempt_mode_enum NOT NULL DEFAULT 'single',
  selected_answer answer_choice_enum NOT NULL,
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    (practice_exam_id IS NULL AND mode = 'single')
    OR (practice_exam_id IS NOT NULL AND mode = 'practice_exam')
  )
);

-- migrate:statement
CREATE TABLE IF NOT EXISTS recent_questions (
  question_id BIGINT PRIMARY KEY REFERENCES questions(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- migrate:statement
CREATE INDEX IF NOT EXISTS idx_questions_exam_number
  ON questions (exam_id, question_number);

-- migrate:statement
CREATE INDEX IF NOT EXISTS idx_topics_exam_name
  ON topics (exam_id, name);

-- migrate:statement
CREATE INDEX IF NOT EXISTS idx_question_topics_topic_question
  ON question_topics (topic_id, question_id);

-- migrate:statement
CREATE INDEX IF NOT EXISTS idx_question_attempts_user_created_at
  ON question_attempts (user_id, created_at DESC);

-- migrate:statement
CREATE INDEX IF NOT EXISTS idx_question_attempts_user_question
  ON question_attempts (user_id, question_id);

-- migrate:statement
CREATE INDEX IF NOT EXISTS idx_question_attempts_question_created_at
  ON question_attempts (question_id, created_at DESC);

-- migrate:statement
CREATE INDEX IF NOT EXISTS idx_practice_exams_user_created_at
  ON practice_exams (user_id, created_at DESC);

-- migrate:statement
CREATE INDEX IF NOT EXISTS idx_practice_exam_questions_question_id
  ON practice_exam_questions (question_id);

-- migrate:statement
CREATE OR REPLACE VIEW user_exam_stats AS
SELECT
  qa.user_id,
  q.exam_id,
  e.code AS exam_code,
  COUNT(*) AS total_attempts,
  COUNT(*) FILTER (WHERE qa.is_correct) AS correct_attempts,
  COUNT(DISTINCT qa.question_id) AS distinct_questions_attempted,
  COUNT(DISTINCT qa.question_id) FILTER (WHERE qa.is_correct) AS distinct_questions_correct,
  ROUND(
    COUNT(*) FILTER (WHERE qa.is_correct)::NUMERIC / NULLIF(COUNT(*), 0),
    4
  ) AS accuracy,
  MAX(qa.created_at) AS last_attempt_at
FROM question_attempts qa
JOIN questions q ON q.id = qa.question_id
JOIN exams e ON e.id = q.exam_id
GROUP BY qa.user_id, q.exam_id, e.code;

-- migrate:statement
CREATE OR REPLACE VIEW user_topic_stats AS
SELECT
  qa.user_id,
  q.exam_id,
  e.code AS exam_code,
  t.id AS topic_id,
  t.name AS topic_name,
  COUNT(*) AS total_attempts,
  COUNT(*) FILTER (WHERE qa.is_correct) AS correct_attempts,
  COUNT(DISTINCT qa.question_id) AS distinct_questions_attempted,
  COUNT(DISTINCT qa.question_id) FILTER (WHERE qa.is_correct) AS distinct_questions_correct,
  ROUND(
    COUNT(*) FILTER (WHERE qa.is_correct)::NUMERIC / NULLIF(COUNT(*), 0),
    4
  ) AS accuracy,
  MAX(qa.created_at) AS last_attempt_at
FROM question_attempts qa
JOIN questions q ON q.id = qa.question_id
JOIN exams e ON e.id = q.exam_id
JOIN question_topics qt ON qt.question_id = q.id
JOIN topics t ON t.id = qt.topic_id
GROUP BY qa.user_id, q.exam_id, e.code, t.id, t.name;

-- migrate:statement
CREATE OR REPLACE VIEW user_question_outcomes AS
SELECT
  qa.user_id,
  q.id AS question_id,
  q.exam_id,
  e.code AS exam_code,
  q.question_number,
  COUNT(*) AS total_attempts,
  COUNT(*) FILTER (WHERE qa.is_correct) AS correct_attempts,
  BOOL_OR(qa.is_correct) AS ever_correct,
  MAX(qa.created_at) AS last_attempt_at
FROM question_attempts qa
JOIN questions q ON q.id = qa.question_id
JOIN exams e ON e.id = q.exam_id
GROUP BY qa.user_id, q.id, q.exam_id, e.code, q.question_number;
