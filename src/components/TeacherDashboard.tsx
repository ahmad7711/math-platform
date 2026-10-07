import { useEffect, useState } from 'react';
import {
  Check,
  Copy,
  Edit3,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LogOut,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  Trash2,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { MATH_CURRICULUM } from '@/lib/curriculum';
import type { QuizQuestion, QuizQuestionInput } from '@/types/quiz';

const EMPTY: QuizQuestionInput = {
  question_text: '',
  answers: ['', '', '', ''],
  correct_answer: 0,
  category: 'القدرات العامة',
  explanation: '',
  is_published: true,
  term: 'الفصل الدراسي الأول',
  unit_name: 'الفصل الأول: تحليل الدوال',
  lesson_name: 'التهيئة للفصل الأول',
  unit_order: 1,
  lesson_order: 1,
};

export default function TeacherDashboard({ onSignOut }: { onSignOut: () => void }) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<QuizQuestion | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<QuizQuestionInput>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [filterUnit, setFilterUnit] = useState('');
  const [filterLesson, setFilterLesson] = useState('');

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('quiz_questions')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      setError(error.message);
    } else {
      setQuestions((data ?? []) as QuizQuestion[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    supabase
      .rpc('get_active_invite_code')
      .then(({ data }: { data: string | null }) => {
        if (data) setInviteCode(data);
      });
  }, []);

  const filtered = questions.filter(
    (q) =>
      q.question_text.includes(search) ||
      q.category.includes(search) ||
      (q.unit_name || '').includes(search) ||
      (q.lesson_name || '').includes(search),
  ).filter((q) => !filterUnit || (q.unit_name || '') === filterUnit)
   .filter((q) => !filterLesson || (q.lesson_name || '') === filterLesson);
  const filterUnits = MATH_CURRICULUM.flatMap((term) => term.units.map((unit) => unit.name));
  const filterLessons = MATH_CURRICULUM.flatMap((term) => term.units).find((unit) => unit.name === filterUnit)?.lessons ?? [];

  const openCreate = () => {
    setForm(EMPTY);
    setCreating(true);
    setEditing(null);
    setError(null);
  };

  const openEdit = (q: QuizQuestion) => {
    setForm({
      question_text: q.question_text,
      answers: [...q.answers],
      correct_answer: q.correct_answer,
      category: q.category,
      explanation: q.explanation,
      is_published: q.is_published,
      term: q.term || 'الفصل الدراسي الأول',
      unit_name: q.unit_name || 'الفصل الأول: تحليل الدوال',
      lesson_name: q.lesson_name || 'التهيئة للفصل الأول',
      unit_order: q.unit_order || 1,
      lesson_order: q.lesson_order || 1,
    });
    setEditing(q);
    setCreating(false);
    setError(null);
  };

  const closePanel = () => {
    setEditing(null);
    setCreating(false);
    setForm(EMPTY);
    setError(null);
  };

  const save = async () => {
    if (!form.question_text.trim()) {
      setError('نص السؤال مطلوب');
      return;
    }
    if (form.answers.filter((a) => a.trim()).length < 2) {
      setError('يجب إدخال إجابتين على الأقل');
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      question_text: form.question_text.trim(),
      answers: form.answers.map((a) => a.trim()),
      correct_answer: form.correct_answer,
      category: form.category.trim() || 'عام',
      explanation: form.explanation.trim(),
      is_published: form.is_published,
      term: form.term.trim() || 'الفصل الدراسي الأول',
      unit_name: form.unit_name.trim() || 'الفصل الأول: تحليل الدوال',
      lesson_name: form.lesson_name.trim() || 'التهيئة للفصل الأول',
      unit_order: Number(form.unit_order) || 1,
      lesson_order: Number(form.lesson_order) || 1,
    };

    try {
      if (editing) {
        const { error } = await supabase
          .from('quiz_questions')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('quiz_questions').insert(payload);
        if (error) throw error;
      }
      await load();
      closePanel();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'فشل الحفظ';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (q: QuizQuestion) => {
    if (!confirm(`حذف السؤال: "${q.question_text.slice(0, 40)}..."؟`)) return;
    const { error } = await supabase.from('quiz_questions').delete().eq('id', q.id);
    if (error) {
      setError(error.message);
      return;
    }
    await load();
  };

  const togglePublish = async (q: QuizQuestion) => {
    const { error } = await supabase
      .from('quiz_questions')
      .update({ is_published: !q.is_published, updated_at: new Date().toISOString() })
      .eq('id', q.id);
    if (error) {
      setError(error.message);
      return;
    }
    await load();
  };

  const updateAnswer = (idx: number, val: string) => {
    setForm((f) => {
      const answers = [...f.answers];
      answers[idx] = val;
      return { ...f, answers };
    });
  };

  const addAnswer = () => {
    if (form.answers.length >= 6) return;
    setForm((f) => ({ ...f, answers: [...f.answers, ''] }));
  };

  const removeAnswer = (idx: number) => {
    if (form.answers.length <= 2) return;
    setForm((f) => {
      const answers = f.answers.filter((_, i) => i !== idx);
      const correct = f.correct_answer >= answers.length ? 0 : f.correct_answer > idx ? f.correct_answer - 1 : f.correct_answer;
      return { ...f, answers, correct_answer: correct };
    });
  };

  const panelOpen = creating || editing !== null;
  const curriculumUnits = MATH_CURRICULUM.find((item) => item.term === form.term)?.units ?? MATH_CURRICULUM[0].units;
  const selectedCurriculumUnit = curriculumUnits.find((unit) => unit.name === form.unit_name) ?? curriculumUnits[0];

  const generateInviteCode = async () => {
    setGenerating(true);
    setError(null);
    try {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let code = '';
      for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
      const { data: userData } = await supabase.auth.getUser();
      const { error: insertError } = await supabase
        .from('invite_codes')
        .insert({ code, created_by: userData.user?.id ?? null });
      if (insertError) throw insertError;
      setInviteCode(code);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'فشل توليد الرمز';
      setError(message);
    } finally {
      setGenerating(false);
    }
  };

  const copyInviteCode = async () => {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
    } catch {
      const input = document.createElement('input');
      input.value = inviteCode;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }
    setCopied(true);
    setShowToast(true);
    setTimeout(() => { setCopied(false); setShowToast(false); }, 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-2.5 sm:py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
              م
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">لوحة المعلم</p>
              <p className="text-xs text-slate-400 leading-tight hidden sm:block">إدارة بنك الأسئلة</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all text-xs sm:text-sm font-medium"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">الإعدادات</span>
            </button>
            <button
              onClick={onSignOut}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all text-xs sm:text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">خروج</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-4 sm:py-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث في الأسئلة أو التصنيف..."
              className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-sm"
            />
          </div>
          <button
            onClick={openCreate}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-all shadow-lg shadow-emerald-600/20 text-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            سؤال جديد
          </button>
        </div>

        {/* Curriculum filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <select
            value={filterUnit}
            onChange={(e) => { setFilterUnit(e.target.value); setFilterLesson(''); }}
            className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-sm"
          >
            <option value="">كل الوحدات</option>
            {filterUnits.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
          </select>
          <select
            value={filterLesson}
            onChange={(e) => setFilterLesson(e.target.value)}
            disabled={!filterUnit}
            className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-sm disabled:opacity-50"
          >
            <option value="">كل الدروس</option>
            {filterLessons.map((lesson) => <option key={lesson} value={lesson}>{lesson}</option>)}
          </select>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5 sm:mb-6">
          <StatCard label="إجمالي الأسئلة" value={questions.length} />
          <StatCard label="منشور" value={questions.filter((q) => q.is_published).length} accent="emerald" />
          <StatCard label="مسودة" value={questions.filter((q) => !q.is_published).length} accent="amber" />
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-400 text-sm">لا توجد أسئلة. ابدأ بإضافة سؤال جديد.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((q, i) => (
              <div
                key={q.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <span className="shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-100 text-slate-600 text-xs sm:text-sm font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-medium">
                        {q.category}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-100 font-medium">
                        {q.unit_name || 'الفصل الأول: تحليل الدوال'}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-50 text-slate-600 border border-slate-100 font-medium">
                        {q.lesson_name || 'التهيئة للفصل الأول'}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                          q.is_published
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}
                      >
                        {q.is_published ? 'منشور' : 'مسودة'}
                      </span>
                    </div>
                    <p className="text-slate-800 font-medium mb-2">{q.question_text}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {q.answers.map((a, ai) => (
                        <span
                          key={ai}
                          className={`text-xs px-2.5 py-1 rounded-lg border ${
                            ai === q.correct_answer
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium'
                              : 'bg-slate-50 text-slate-500 border-slate-100'
                          }`}
                        >
                          {ai === q.correct_answer && <Check className="w-3 h-3 inline ml-1" />}
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => togglePublish(q)}
                      title={q.is_published ? 'إلغاء النشر' : 'نشر'}
                      className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    >
                      {q.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => openEdit(q)}
                      title="تعديل"
                      className="p-2 rounded-lg text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => remove(q)}
                      title="حذف"
                      className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Editor drawer */}
      {panelOpen && (
        <div className="fixed inset-0 z-30 flex justify-start" dir="rtl">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={closePanel}
          />
          <div className="relative w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl animate-[slideIn_0.2s_ease-out]">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10">
              <h2 className="text-base sm:text-lg font-bold text-slate-800">
                {editing ? 'تعديل السؤال' : 'سؤال جديد'}
              </h2>
              <button
                onClick={closePanel}
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              <Field label="نص السؤال">
                <textarea
                  value={form.question_text}
                  onChange={(e) => setForm({ ...form, question_text: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-sm resize-none"
                  placeholder="اكتب نص السؤال هنا..."
                />
              </Field>

              <Field label="التصنيف">
                <input
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-sm"
                  placeholder="القدرات العامة"
                />
              </Field>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-4">
                <p className="text-sm font-semibold text-slate-700">تصنيف المنهج</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="الفصل الدراسي">
                    <select
                      value={form.term}
                      onChange={(e) => {
                        const term = e.target.value;
                        const firstUnit = MATH_CURRICULUM.find((item) => item.term === term)?.units[0];
                        setForm({ ...form, term, unit_name: firstUnit?.name ?? '', unit_order: 1, lesson_name: firstUnit?.lessons[0] ?? '', lesson_order: 1 });
                      }}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-sm"
                    >
                      {MATH_CURRICULUM.map((item) => <option key={item.term} value={item.term}>{item.term}</option>)}
                    </select>
                  </Field>
                  <Field label="الوحدة">
                    <select
                      value={form.unit_name}
                      onChange={(e) => {
                        const unitIndex = curriculumUnits.findIndex((unit) => unit.name === e.target.value);
                        const unit = curriculumUnits[unitIndex] ?? curriculumUnits[0];
                        setForm({ ...form, unit_name: unit.name, unit_order: unitIndex + 1, lesson_name: unit.lessons[0], lesson_order: 1 });
                      }}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-sm"
                    >
                      {curriculumUnits.map((unit, index) => <option key={unit.name} value={unit.name}>{index + 1}. {unit.name}</option>)}
                    </select>
                  </Field>
                  <Field label="الدرس">
                    <select
                      value={form.lesson_name}
                      onChange={(e) => setForm({ ...form, lesson_name: e.target.value, lesson_order: selectedCurriculumUnit.lessons.findIndex((lesson) => lesson === e.target.value) + 1 })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-sm"
                    >
                      {selectedCurriculumUnit.lessons.map((lesson, index) => <option key={lesson} value={lesson}>{index + 1}. {lesson}</option>)}
                    </select>
                  </Field>
                  <div className="flex items-end">
                    <div className="w-full rounded-xl bg-white border border-slate-200 px-3 py-2.5 text-xs text-slate-500">
                      ترتيب الدرس: <span className="font-bold text-emerald-700">{form.lesson_order}</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-400">اختر الدرس من القائمة ليظهر السؤال في مكانه الصحيح للطالب. أسئلة نفس الوحدة تُجمّع تلقائيًا في الاختبار الشامل.</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700">الإجابات</label>
                  <button
                    onClick={addAnswer}
                    disabled={form.answers.length >= 6}
                    className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium disabled:opacity-40"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    إضافة خيار
                  </button>
                </div>
                <div className="space-y-2">
                  {form.answers.map((a, ai) => (
                    <div key={ai} className="flex items-center gap-2">
                      <button
                        onClick={() => setForm({ ...form, correct_answer: ai })}
                        className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${
                          form.correct_answer === ai
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                        title="تحديد كإجابة صحيحة"
                      >
                        {form.correct_answer === ai ? <Check className="w-4 h-4" /> : String.fromCharCode(1571 + ai)}
                      </button>
                      <input
                        value={a}
                        onChange={(e) => updateAnswer(ai, e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-sm"
                        placeholder={`الخيار ${ai + 1}`}
                      />
                      {form.answers.length > 2 && (
                        <button
                          onClick={() => removeAnswer(ai)}
                          className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-2">اضغط على الحرف لتحديد الإجابة الصحيحة (باللون الأخضر).</p>
              </div>

              <Field label="تفسير الإجابة (اختياري)">
                <textarea
                  value={form.explanation}
                  onChange={(e) => setForm({ ...form, explanation: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-sm resize-none"
                  placeholder="يظهر للطالب بعد الإجابة..."
                />
              </Field>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_published}
                  onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                  className="w-4 h-4 rounded accent-emerald-600"
                />
                <span className="text-sm text-slate-700">نشر السؤال للطلاب</span>
              </label>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">
                  {error}
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-100 px-4 sm:px-6 py-3 sm:py-4 flex gap-3">
              <button
                onClick={closePanel}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium transition-all text-sm"
              >
                إلغاء
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings modal */}
      {showSettings && (
        <div className="fixed inset-0 z-30 flex items-center justify-center p-4" dir="rtl">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowSettings(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10">
              <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-600" />
                إعدادات المعلم
              </h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">رمز دعوة المعلم</label>
                <div className="flex items-stretch gap-2">
                  <div className="flex items-center gap-2 px-3 sm:px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 flex-1 min-w-0">
                    <KeyRound className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-mono text-sm sm:text-base text-slate-700 truncate" dir="ltr">{inviteCode || '—'}</span>
                  </div>
                  <button
                    onClick={copyInviteCode}
                    disabled={!inviteCode}
                    title="نسخ الرمز"
                    className="shrink-0 px-3 sm:px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-all disabled:opacity-40 flex items-center justify-center gap-1.5 text-sm font-medium"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span className="hidden sm:inline">{copied ? 'تم النسخ' : 'نسخ'}</span>
                  </button>
                </div>

                {showToast && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-emerald-600 animate-[fadeIn_0.2s_ease-out]">
                    <Check className="w-3.5 h-3.5" />
                    تم نسخ رمز الدعوة
                  </div>
                )}

                <p className="text-xs text-slate-400 mt-2">هذا الرمز مطلوب من أي معلم جديد لإنشاء حساب. لا تشاركه مع الطلاب.</p>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <p className="text-sm font-medium text-slate-700 mb-2">توليد رمز دعوة جديد</p>
                <p className="text-xs text-slate-400 mb-3">اضغط على زر التدوير لإنشاء رمز دعوة جديد وعشوائي. الرمز القديم سيُستبدل ولم يعد صالحًا للاستخدام.</p>
                <button
                  onClick={generateInviteCode}
                  disabled={generating}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
                >
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  {generating ? 'جارٍ التوليد...' : 'توليد رمز جديد'}
                </button>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">
                  {error}
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-100 px-4 sm:px-6 py-3 sm:py-4 flex gap-3">
              <button
                onClick={() => { setShowSettings(false); setError(null); }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium transition-all text-sm"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: 'emerald' | 'amber' }) {
  const color = accent === 'emerald' ? 'text-emerald-600' : accent === 'amber' ? 'text-amber-600' : 'text-slate-800';
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-3 sm:p-4 text-center">
      <p className={`text-xl sm:text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
