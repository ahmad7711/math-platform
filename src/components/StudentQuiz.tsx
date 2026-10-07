import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  GraduationCap,
  History,
  Home,
  ListChecks,
  Loader2,
  Lock,
  RefreshCw,
  Send,
  XCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { MATH_CURRICULUM } from '@/lib/curriculum';
import type { QuizAttempt, QuizQuestion } from '@/types/quiz';

type Phase = 'home' | 'unit' | 'taking' | 'review';

export default function StudentQuiz({ onTeacherAccess }: { onTeacherAccess: () => void }) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<Phase>('home');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [quizTitle, setQuizTitle] = useState('');
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [elapsed, setElapsed] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('quiz_questions')
        .select('id, question_text, answers, correct_answer, category, explanation, is_published, term, unit_name, lesson_name, unit_order, lesson_order')
        .eq('is_published', true)
        .order('unit_order', { ascending: true })
        .order('lesson_order', { ascending: true })
        .order('created_at', { ascending: true });
      setQuestions((data ?? []) as QuizQuestion[]);
      setLoading(false);
    })();

    supabase
      .from('quiz_attempts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(8)
      .then(({ data }) => setAttempts((data ?? []) as QuizAttempt[]));
  }, []);

  useEffect(() => {
    if (phase !== 'taking') return;
    const id = setInterval(() => setElapsed((seconds) => seconds + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  const score = useMemo(() => activeQuestions.reduce(
    (total, question, index) => total + (answers[index] === question.correct_answer ? 1 : 0),
    0,
  ), [activeQuestions, answers]);

  const terms = MATH_CURRICULUM.map((item) => item.term);
  const curriculumUnits = useMemo(
    () => MATH_CURRICULUM.find((item) => item.term === selectedTerm)?.units ?? [],
    [selectedTerm],
  );
  const selectedUnitQuestions = questions.filter(
    (q) => (q.term || 'الفصل الدراسي الأول') === selectedTerm && (q.unit_name || 'الفصل الأول: تحليل الدوال') === selectedUnit,
  );
  const selectedCurriculumUnit = curriculumUnits.find((unit) => unit.name === selectedUnit);
  const lessons = useMemo(() => {
    if (!selectedCurriculumUnit) return [];
    return selectedCurriculumUnit.lessons.map((name) => ({
      name,
      questions: selectedUnitQuestions.filter((q) => (q.lesson_name || 'التهيئة للفصل الأول') === name),
    }));
  }, [selectedCurriculumUnit, selectedUnitQuestions]);

  const startQuiz = (quizQuestions: QuizQuestion[], title: string) => {
    if (quizQuestions.length === 0) return;
    setActiveQuestions(quizQuestions);
    setQuizTitle(title);
    setPhase('taking');
    setCurrent(0);
    setAnswers({});
    setElapsed(0);
    setShowFeedback(false);
  };

  const openUnit = (term: string, unit: string) => {
    setSelectedTerm(term);
    setSelectedUnit(unit);
    setPhase('unit');
  };

  const pick = (answerIndex: number) => {
    if (showFeedback) return;
    setAnswers((currentAnswers) => ({ ...currentAnswers, [current]: answerIndex }));
    setShowFeedback(true);
  };

  const finishAttempt = async () => {
    const answeredQuestions = Object.keys(answers).length;
    const correctAnswers = activeQuestions.reduce(
      (total, question, index) => total + (answers[index] === question.correct_answer ? 1 : 0),
      0,
    );
    const attempt = {
      total_questions: activeQuestions.length,
      answered_questions: answeredQuestions,
      correct_answers: correctAnswers,
      score: Math.round((correctAnswers / activeQuestions.length) * 100),
      duration_seconds: elapsed,
    };
    const { data } = await supabase.from('quiz_attempts').insert(attempt).select().maybeSingle();
    if (data) setAttempts((items) => [data as QuizAttempt, ...items].slice(0, 8));
    setPhase('review');
  };

  const next = () => {
    setShowFeedback(false);
    if (current < activeQuestions.length - 1) setCurrent((value) => value + 1);
    else void finishAttempt();
  };

  const goHome = () => {
    setPhase('home');
    setActiveQuestions([]);
    setCurrent(0);
    setAnswers({});
    setElapsed(0);
    setShowFeedback(false);
  };

  const fmtTime = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  if (loading) return <LoadingScreen />;

  if (phase === 'home') {
    return (
      <div className="min-h-screen bg-slate-50 py-6 sm:py-8 px-4" dir="rtl">
        <div className="max-w-5xl mx-auto">
          <header className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-600 text-white mb-3 sm:mb-4 shadow-lg shadow-emerald-600/20">
              <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <p className="text-xs sm:text-sm text-emerald-700 font-semibold mb-1">الهيئة الملكية</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">رياضيات الصف الثالث الثانوي</h1>
            <p className="text-slate-500 mt-2 text-sm sm:text-base">اختر الفصل والوحدة لبدء التدريب</p>
          </header>

          {terms.map((term) => {
            const termUnits = MATH_CURRICULUM.find((item) => item.term === term)?.units ?? [];
            return (
            <section key={term} className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-1.5 h-6 sm:h-7 rounded-full bg-emerald-500" />
                <h2 className="text-lg sm:text-xl font-bold text-slate-800">{term}</h2>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {termUnits.map((unit, unitIndex) => {
                    const unitData = questions.filter(
                      (question) => (question.term || 'الفصل الدراسي الأول') === term && (question.unit_name || 'الفصل الأول: تحليل الدوال') === unit.name,
                    );
                    const lessonCount = unit.lessons.length;
                    return (
                      <button
                        key={`${term}-${unit.name}`}
                        onClick={() => openUnit(term, unit.name)}
                        className="text-right bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-100/60 transition-all group"
                      >
                        <div className="flex items-start justify-between gap-3 mb-4 sm:mb-6">
                          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <BookOpen className="w-5 h-5" />
                          </div>
                          <ChevronLeft className="w-5 h-5 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                        </div>
                        <h3 className="font-bold text-slate-800 text-base sm:text-lg leading-snug">{unit.name}</h3>
                        <p className="text-xs sm:text-sm text-slate-400 mt-1">{lessonCount} دروس • {unitData.length} سؤال</p>
                        <div className="mt-4 sm:mt-5 flex items-center gap-2 text-xs sm:text-sm font-semibold text-emerald-600">
                          عرض الدروس <ArrowRight className="w-4 h-4" />
                        </div>
                      </button>
                    );
                  })}
              </div>
            </section>
            );
          })}

          <HistorySection attempts={attempts} fmtTime={fmtTime} />
          <div className="flex justify-center mt-6 sm:mt-8">
            <button
              onClick={onTeacherAccess}
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs sm:text-sm font-semibold transition-all shadow-md"
            >
              <Lock className="w-4 h-4" />
              دخول المعلم
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'unit') {
    return (
      <div className="min-h-screen bg-slate-50 py-6 sm:py-8 px-4" dir="rtl">
        <div className="max-w-4xl mx-auto">
          <button onClick={goHome} className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 hover:text-emerald-600 mb-4 sm:mb-5 transition-colors"><ArrowRight className="w-4 h-4" /> العودة للفصول</button>
          <div className="bg-gradient-to-l from-emerald-700 to-emerald-600 rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-white mb-5 sm:mb-6 shadow-lg shadow-emerald-600/15">
            <p className="text-emerald-100 text-xs sm:text-sm mb-2">{selectedTerm}</p>
            <h1 className="text-xl sm:text-2xl font-bold">{selectedUnit}</h1>
            <p className="text-emerald-50 text-xs sm:text-sm mt-2">اختر درسًا للتدرب أو ابدأ اختبارًا شاملًا للوحدة</p>
            <button
              onClick={() => startQuiz(selectedUnitQuestions, `اختبار شامل — ${selectedUnit}`)}
              disabled={selectedUnitQuestions.length === 0}
              className="mt-4 sm:mt-6 inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-white text-emerald-700 hover:bg-emerald-50 font-bold text-sm sm:text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ListChecks className="w-5 h-5" /> اختبار شامل للوحدة ({selectedUnitQuestions.length} سؤال)
            </button>
          </div>

          <div className="grid gap-3">
            {lessons.map((lesson, index) => (
              <div key={lesson.name} className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 hover:border-emerald-200 transition-colors">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold shrink-0 text-sm">{index + 1}</div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800 text-sm sm:text-base">{lesson.name}</p>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">{lesson.questions.length} سؤال تدريبي</p>
                </div>
                {lesson.questions.length > 0 ? (
                <button
                  onClick={() => startQuiz(lesson.questions, lesson.name)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-bold transition-colors w-full sm:w-auto"
                >
                  <ListChecks className="w-4 h-4" /> اختبر نفسك
                </button>
                ) : (
                <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 text-slate-400 text-sm font-medium w-full sm:w-auto text-center justify-center">
                  لا توجد أسئلة بعد
                </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'review') {
    const percentage = Math.round((score / activeQuestions.length) * 100);
    return (
      <div className="min-h-screen bg-slate-50 py-6 sm:py-8 px-4" dir="rtl">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden mb-5 sm:mb-6">
            <div className={`px-5 sm:px-8 py-8 sm:py-10 text-center text-white ${percentage >= 60 ? 'bg-gradient-to-l from-emerald-700 to-emerald-600' : 'bg-gradient-to-l from-amber-600 to-orange-600'}`}>
              <p className="text-xs sm:text-sm opacity-90 mb-2">{quizTitle}</p>
              <p className="text-4xl sm:text-5xl font-bold mb-2">{percentage}%</p>
              <p className="text-xs sm:text-sm opacity-90">أجبت بشكل صحيح على {score} من {activeQuestions.length} أسئلة</p>
            </div>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-3 sm:mb-4">مراجعة الإجابات</h3>
          <div className="space-y-3 sm:space-y-4">
            {activeQuestions.map((question, index) => {
              const chosen = answers[index];
              const correct = chosen === question.correct_answer;
              return (
                <div key={question.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6">
                  <div className="flex items-start gap-3 mb-3 sm:mb-4">
                    <span className="shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-100 text-slate-600 text-xs sm:text-sm font-bold flex items-center justify-center">{index + 1}</span>
                    <p className="text-slate-800 font-medium pt-1 flex-1 text-sm sm:text-base">{question.question_text}</p>
                    {correct ? <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-1 shrink-0" /> : <XCircle className="w-5 h-5 text-red-500 mt-1 shrink-0" />}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {question.answers.map((answer, answerIndex) => {
                      const isChosen = chosen === answerIndex;
                      const isCorrect = answerIndex === question.correct_answer;
                      const color = isCorrect ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : isChosen ? 'border-red-300 bg-red-50 text-red-700' : 'border-slate-200 bg-slate-50 text-slate-600';
                      return <div key={answerIndex} className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl border text-xs sm:text-sm ${color}`}><span className="w-6 h-6 rounded-md bg-white/70 flex items-center justify-center text-xs font-bold shrink-0">{String.fromCharCode(1571 + answerIndex)}</span>{answer}</div>;
                    })}
                  </div>
                  {question.explanation && <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-slate-500 bg-slate-50 rounded-lg p-3 border border-slate-100"><span className="font-semibold text-slate-700">التفسير: </span>{question.explanation}</p>}
                </div>
              );
            })}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-5 sm:mt-6">
            <button onClick={() => startQuiz(activeQuestions, quizTitle)} className="flex-1 py-3 sm:py-3.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold transition-all flex items-center justify-center gap-2 text-sm sm:text-base"><RefreshCw className="w-5 h-5" /> إعادة الاختبار</button>
            <button onClick={goHome} className="flex-1 py-3 sm:py-3.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold transition-all flex items-center justify-center gap-2 text-sm sm:text-base"><Home className="w-5 h-5" /> الصفحة الرئيسية</button>
          </div>
        </div>
      </div>
    );
  }

  const question = activeQuestions[current];
  const chosen = answers[current];
  const answered = chosen !== undefined;
  const isCorrect = answered && chosen === question.correct_answer;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" dir="rtl">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-2.5 sm:py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0"><div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0"><GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" /></div><div className="min-w-0"><p className="text-xs sm:text-sm font-bold text-slate-800 leading-tight truncate">{quizTitle}</p><p className="text-xs text-slate-400 leading-tight">رياضيات ثالث ثانوي</p></div></div>
          <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-sm font-mono shrink-0"><Clock className="w-4 h-4 text-slate-400" />{fmtTime(elapsed)}</div>
        </div>
        <div className="h-1 bg-slate-100"><div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${((current + (answered ? 1 : 0)) / activeQuestions.length) * 100}%` }} /></div>
      </header>

      <div className="max-w-3xl w-full mx-auto px-4 pt-4 sm:pt-5">
        <div className="flex items-center justify-between mb-3 sm:mb-4"><span className="text-xs sm:text-sm font-semibold text-slate-700">السؤال {current + 1} من {activeQuestions.length}</span><span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-medium">أجبت على {Object.keys(answers).length}</span></div>
        <div className="flex flex-wrap gap-1.5">{activeQuestions.map((_, index) => <button key={index} onClick={() => { setCurrent(index); setShowFeedback(answers[index] !== undefined); }} className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs font-bold transition-all ${index === current ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-110' : answers[index] !== undefined ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-white text-slate-400 border border-slate-200'}`}>{index + 1}</button>)}</div>
      </div>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-4 sm:py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6 sm:p-8">
          <p className="text-base sm:text-lg font-semibold text-slate-900 mb-5 sm:mb-6 leading-relaxed">{question.question_text}</p>
          <div className="space-y-2.5 sm:space-y-3">{question.answers.map((answer, answerIndex) => {
            const isChosen = chosen === answerIndex;
            const correctAnswer = answerIndex === question.correct_answer;
            const box = showFeedback && correctAnswer ? 'border-emerald-400 bg-emerald-50' : showFeedback && isChosen ? 'border-red-400 bg-red-50' : isChosen ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40';
            const badge = showFeedback && correctAnswer ? 'bg-emerald-600 text-white' : showFeedback && isChosen ? 'bg-red-500 text-white' : isChosen ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500';
            return <button key={answerIndex} onClick={() => pick(answerIndex)} disabled={showFeedback} className={`w-full flex items-center gap-3 p-3 sm:p-4 rounded-xl border-2 transition-all text-right ${box}`}><span className={`shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-sm font-bold ${badge}`}>{String.fromCharCode(1571 + answerIndex)}</span><span className="text-slate-800 font-medium flex-1 text-sm sm:text-base">{answer}</span>{showFeedback && correctAnswer && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}{showFeedback && isChosen && !correctAnswer && <XCircle className="w-5 h-5 text-red-500 shrink-0" />}</button>;
          })}</div>
          {showFeedback && <div className={`mt-4 sm:mt-5 p-3 sm:p-4 rounded-xl border ${isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}><div className="flex items-center gap-2 mb-1.5">{isCorrect ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <XCircle className="w-5 h-5 text-red-500" />}<p className={`font-bold text-sm ${isCorrect ? 'text-emerald-700' : 'text-red-700'}`}>{isCorrect ? 'إجابة صحيحة' : 'إجابة خاطئة'}</p></div>{question.explanation && <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{question.explanation}</p>}</div>}
        </div>
        <div className="flex items-center justify-between mt-5 sm:mt-6 gap-3"><button onClick={() => { if (current > 0) { setCurrent((value) => value - 1); setShowFeedback(answers[current - 1] !== undefined); } }} disabled={current === 0} className="flex items-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 disabled:opacity-40 transition-all text-xs sm:text-sm font-medium"><ChevronRight className="w-4 h-4" /> السابق</button>{current < activeQuestions.length - 1 ? <button onClick={next} disabled={!answered} className="flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl bg-emerald-600 text-white disabled:opacity-40 transition-all text-xs sm:text-sm font-semibold">التالي <ChevronLeft className="w-4 h-4" /></button> : <button onClick={() => void finishAttempt()} disabled={!answered} className="flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl bg-slate-800 text-white disabled:opacity-40 transition-all text-xs sm:text-sm font-semibold"><Send className="w-4 h-4" /> إنهاء الاختبار</button>}</div>
      </main>
    </div>
  );
}

function HistorySection({ attempts, fmtTime }: { attempts: QuizAttempt[]; fmtTime: (seconds: number) => string }) {
  if (attempts.length === 0) return null;
  return <section className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm p-4 sm:p-6 mt-6 sm:mt-8"><h2 className="text-sm sm:text-base font-bold text-slate-800 mb-3 sm:mb-4 flex items-center gap-2"><History className="w-5 h-5 text-emerald-600" /> سجل الاختبارات السابقة</h2><div className="space-y-2">{attempts.map((attempt) => <div key={attempt.id} className="flex items-center gap-3 p-2.5 sm:p-3 rounded-xl bg-slate-50 border border-slate-100"><div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-xs sm:text-sm font-bold ${attempt.score >= 60 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{attempt.score}%</div><div><p className="text-xs sm:text-sm font-medium text-slate-700">{attempt.correct_answers} / {attempt.total_questions} إجابة صحيحة</p><p className="text-xs text-slate-400">{new Date(attempt.created_at).toLocaleDateString('ar-SA')} • {fmtTime(attempt.duration_seconds)} • {attempt.answered_questions} مجاب</p></div></div>)}</div></section>;
}

function LoadingScreen() {
  return <div className="min-h-screen bg-slate-50 flex items-center justify-center" dir="rtl"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>;
}
