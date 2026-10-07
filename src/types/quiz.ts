export interface QuizQuestion {
  id: string;
  question_text: string;
  answers: string[];
  correct_answer: number;
  category: string;
  explanation: string;
  is_published: boolean;
  term: string;
  unit_name: string;
  lesson_name: string;
  unit_order: number;
  lesson_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface QuizQuestionInput {
  question_text: string;
  answers: string[];
  correct_answer: number;
  category: string;
  explanation: string;
  is_published: boolean;
  term: string;
  unit_name: string;
  lesson_name: string;
  unit_order: number;
  lesson_order: number;
}

export interface QuizAttempt {
  id: string;
  total_questions: number;
  answered_questions: number;
  correct_answers: number;
  score: number;
  duration_seconds: number;
  created_at: string;
}
