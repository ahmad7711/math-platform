/*
# Normalize existing questions into the first curriculum lesson

1. Modified Data
- Existing questions that still use the original generic defaults are moved to the named first unit and its preparation lesson.

2. Data Safety
- No rows are deleted and no columns are removed or changed.
- Only rows with the exact original defaults are updated, preserving teacher-assigned classifications.

3. Important Notes
- This keeps old questions visible in the same named curriculum structure as new questions.
*/

UPDATE public.quiz_questions
SET
  unit_name = 'الفصل الأول: تحليل الدوال',
  lesson_name = 'التهيئة للفصل الأول',
  unit_order = 1,
  lesson_order = 1,
  updated_at = now()
WHERE unit_name = 'الفصل الأول'
  AND lesson_name = 'عام';
