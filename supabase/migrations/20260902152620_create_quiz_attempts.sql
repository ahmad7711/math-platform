/*
# Create student quiz attempt history

1. New Tables
- `quiz_attempts`: stores each completed student attempt for the public math quiz.
- `id`: unique attempt identifier.
- `total_questions`: number of questions in the attempt.
- `answered_questions`: number of questions answered.
- `correct_answers`: number of correct answers.
- `score`: percentage score from 0 to 100.
- `duration_seconds`: time spent in the attempt.
- `created_at`: completion timestamp.

2. Security
- Row level security is enabled.
- Anonymous and authenticated visitors can read and create shared public attempt history.
- Update and delete access is intentionally disabled so completed results cannot be changed from the student page.

3. Important Notes
- This is a no-account student experience, so the history is shared for the public assessment page.
- The frontend displays the latest attempts with date, score, duration, and answered/correct counts.
*/

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  total_questions integer NOT NULL CHECK (total_questions >= 0),
  answered_questions integer NOT NULL CHECK (answered_questions >= 0),
  correct_answers integer NOT NULL CHECK (correct_answers >= 0),
  score integer NOT NULL CHECK (score >= 0 AND score <= 100),
  duration_seconds integer NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read quiz attempts" ON public.quiz_attempts;
CREATE POLICY "Public can read quiz attempts"
  ON public.quiz_attempts FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public can create quiz attempts" ON public.quiz_attempts;
CREATE POLICY "Public can create quiz attempts"
  ON public.quiz_attempts FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public cannot update quiz attempts" ON public.quiz_attempts;
CREATE POLICY "Public cannot update quiz attempts"
  ON public.quiz_attempts FOR UPDATE
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "Public cannot delete quiz attempts" ON public.quiz_attempts;
CREATE POLICY "Public cannot delete quiz attempts"
  ON public.quiz_attempts FOR DELETE
  TO anon, authenticated
  USING (false);

CREATE INDEX IF NOT EXISTS quiz_attempts_created_at_idx ON public.quiz_attempts (created_at DESC);
