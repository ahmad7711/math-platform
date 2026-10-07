/*
# Add curriculum structure to math questions

1. Modified Tables
- `quiz_questions.term`: school term label, such as الفصل الدراسي الأول.
- `quiz_questions.unit_name`: chapter/unit name shown on the student curriculum page.
- `quiz_questions.lesson_name`: lesson name shown inside a unit.
- `quiz_questions.unit_order`: ordering for units.
- `quiz_questions.lesson_order`: ordering for lessons inside a unit.

2. Data Safety
- All columns are added with safe defaults so existing questions remain available.
- Existing questions are placed in الفصل الدراسي الأول / الفصل الأول / عام until the teacher edits their classification.

3. Important Notes
- Students see published questions grouped by term, unit, and lesson.
- A unit exam is generated from every published question assigned to that unit.
*/

ALTER TABLE public.quiz_questions
  ADD COLUMN IF NOT EXISTS term text NOT NULL DEFAULT 'الفصل الدراسي الأول',
  ADD COLUMN IF NOT EXISTS unit_name text NOT NULL DEFAULT 'الفصل الأول',
  ADD COLUMN IF NOT EXISTS lesson_name text NOT NULL DEFAULT 'عام',
  ADD COLUMN IF NOT EXISTS unit_order integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS lesson_order integer NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS quiz_questions_curriculum_idx
  ON public.quiz_questions (is_published, term, unit_order, lesson_order, created_at);
