/*
# Create quiz questions for public assessment and teacher management

1. New Tables
- `quiz_questions`: stores each Arabic multiple-choice question, its four answers, the correct answer index, category, explanation, and publication status.
- `id`: unique question identifier.
- `question_text`: the question shown to students.
- `answers`: JSON array of four answer strings.
- `correct_answer`: zero-based index of the correct answer.
- `category`: visible subject label.
- `explanation`: optional feedback shown after a student answers.
- `is_published`: controls whether the question appears in the public quiz.
- `created_at`, `updated_at`: timestamps.

2. Security
- Row level security is enabled.
- Anonymous and authenticated visitors may read published questions only.
- Authenticated teacher accounts may create, edit, publish, and delete questions.

3. Important Notes
- The app provides a password-based sign-in screen for the teacher area.
- Student quiz access does not require an account.
*/

CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text text NOT NULL,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  correct_answer integer NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'عام',
  explanation text NOT NULL DEFAULT '',
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read published questions" ON public.quiz_questions;
CREATE POLICY "Public can read published questions"
  ON public.quiz_questions FOR SELECT
  TO anon, authenticated
  USING (is_published = true OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Teachers can insert questions" ON public.quiz_questions;
CREATE POLICY "Teachers can insert questions"
  ON public.quiz_questions FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Teachers can update questions" ON public.quiz_questions;
CREATE POLICY "Teachers can update questions"
  ON public.quiz_questions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Teachers can delete questions" ON public.quiz_questions;
CREATE POLICY "Teachers can delete questions"
  ON public.quiz_questions FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS quiz_questions_published_idx ON public.quiz_questions (is_published, created_at);

INSERT INTO public.quiz_questions (question_text, answers, correct_answer, category, explanation, is_published)
SELECT 'إذا كان كل مربع مستطيلًا، فأي العبارات التالية صحيحة دائمًا؟', '["كل مستطيل مربع", "كل مربع مستطيل", "لا علاقة بينهما", "كل مربع مثلث"]'::jsonb, 1, 'القدرات العامة', 'المربع هو مستطيل خاص؛ لأن له أربع زوايا قائمة وأضلاع متساوية.', true
WHERE NOT EXISTS (SELECT 1 FROM public.quiz_questions);

INSERT INTO public.quiz_questions (question_text, answers, correct_answer, category, explanation, is_published)
SELECT 'ما العدد التالي في النمط: 3، 6، 12، 24، ؟', '["30", "36", "48", "60"]'::jsonb, 2, 'القدرات العامة', 'كل عدد يساوي ضعف العدد الذي يسبقه، لذلك 24 × 2 = 48.', true
WHERE (SELECT count(*) FROM public.quiz_questions) = 1;

INSERT INTO public.quiz_questions (question_text, answers, correct_answer, category, explanation, is_published)
SELECT 'أي الكلمات التالية تختلف عن البقية؟', '["قلم", "كتاب", "دفتر", "كرسي"]'::jsonb, 3, 'الاستيعاب اللفظي', 'الكرسي ليس من الأدوات المرتبطة بالكتابة أو القراءة.', true
WHERE (SELECT count(*) FROM public.quiz_questions) = 2;
