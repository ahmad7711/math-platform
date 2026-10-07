import { useEffect, useState } from 'react';
import { ArrowRight, GraduationCap, KeyRound, Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AuthScreen({ onBack }: { onBack: () => void }) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [teacherCode, setTeacherCode] = useState('');
  const [validInviteCode, setValidInviteCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const passwordRules = {
    length: password.length >= 6 && password.length <= 11,
    digits: (password.match(/\d/g) ?? []).length >= 2,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
  };

  useEffect(() => {
    supabase
      .rpc('get_active_invite_code')
      .then(({ data }: { data: string | null }) => {
        if (data) setValidInviteCode(data);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (teacherCode.trim() !== validInviteCode) {
          throw new Error('رمز دعوة المعلم غير صحيح. احصل عليه من إدارة المنصة.');
        }
        if (!passwordRules.length || !passwordRules.digits || !passwordRules.uppercase || !passwordRules.lowercase) {
          throw new Error('كلمة المرور يجب أن تكون من 6 إلى 11 محرفًا، وتحتوي على رقمين على الأقل وحرف إنجليزي كبير وحرف إنجليزي صغير.');
        }
        if (password !== confirmPassword) {
          throw new Error('كلمتا المرور غير متطابقتين. أعد كتابة التأكيد.');
        }
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccess('تم إنشاء حساب المعلم بنجاح. يمكنك تسجيل الدخول الآن بالبريد وكلمة المرور.');
        setMode('signin');
        setTeacherCode('');
        setPassword('');
        setConfirmPassword('');
      } else {
        if (!email.trim() || !password) {
          throw new Error('أدخل البريد الإلكتروني وكلمة المرور.');
        }
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      setError(toArabicAuthError(message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-600 text-white mb-3 sm:mb-4 shadow-lg shadow-emerald-600/20">
            <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">منصة الرياضيات</h1>
          <p className="text-slate-500 mt-1.5 sm:mt-2 text-xs sm:text-sm">بوابة المعلم — إدارة بنك أسئلة الرياضيات</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-5 sm:p-8">
          <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-5 sm:mb-6">
            <button
              onClick={() => { setMode('signin'); setError(null); setSuccess(null); }}
              className={`flex-1 py-2.5 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                mode === 'signin' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              تسجيل الدخول
            </button>
            <button
              onClick={() => { setMode('signup'); setError(null); setSuccess(null); }}
              className={`flex-1 py-2.5 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                mode === 'signup' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              إنشاء حساب معلم
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">البريد الإلكتروني للمعلم</label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-sm"
                  placeholder="teacher@example.com"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  maxLength={11}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-sm"
                  placeholder="••••••••"
                  dir="ltr"
                />
              </div>
              {mode === 'signup' && (
                <div className="text-xs text-slate-400 mt-2 space-y-1.5">
                  <p className="font-medium text-slate-500">شروط كلمة المرور:</p>
                  <ul className="space-y-1">
                    <li className={passwordRules.length ? 'text-emerald-600' : ''}>من 6 إلى 11 محرفًا</li>
                    <li className={passwordRules.digits ? 'text-emerald-600' : ''}>رقمان على الأقل</li>
                    <li className={passwordRules.uppercase ? 'text-emerald-600' : ''}>حرف إنجليزي كبير على الأقل</li>
                    <li className={passwordRules.lowercase ? 'text-emerald-600' : ''}>حرف إنجليزي صغير على الأقل</li>
                  </ul>
                </div>
              )}
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">تأكيد كلمة المرور</label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full pr-10 pl-3 py-2.5 rounded-xl border outline-none transition-all text-sm ${
                      confirmPassword && confirmPassword !== password
                        ? 'border-red-300 focus:ring-2 focus:ring-red-500/20'
                        : confirmPassword && confirmPassword === password
                        ? 'border-emerald-300 focus:ring-2 focus:ring-emerald-500/20'
                        : 'border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                    }`}
                    placeholder="••••••••"
                    dir="ltr"
                  />
                </div>
                {confirmPassword && confirmPassword !== password && (
                  <p className="text-xs text-red-500 mt-1.5">كلمتا المرور غير متطابقتين</p>
                )}
                {confirmPassword && confirmPassword === password && (
                  <p className="text-xs text-emerald-600 mt-1.5">كلمتا المرور متطابقتان</p>
                )}
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">رمز دعوة المعلم</label>
                <div className="relative">
                  <KeyRound className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={teacherCode}
                    onChange={(e) => setTeacherCode(e.target.value)}
                    className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-sm"
                    placeholder="أدخل الرمز الخاص بالمعلمين"
                    dir="ltr"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1.5">رمز الدعوة يُعطى للمعلمين من إدارة المنصة. بدون هذا الرمز لا يمكن إنشاء حساب معلم جديد. إذا لم يكن لديك الرمز، تواصل مع إدارة المنصة.</p>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">
                <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm">
                <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'signin' ? 'دخول المعلم' : 'إنشاء حساب المعلم'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          تسجيل الدخول وإنشاء الحساب مخصصان للمعلمين فقط — الطلاب لا يحتاجون إلى حساب
        </p>

        <button
          onClick={onBack}
          className="w-full mt-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800 font-medium transition-all text-sm flex items-center justify-center gap-2"
        >
          <ArrowRight className="w-4 h-4" />
          العودة للاختبار
        </button>
      </div>
    </div>
  );
}

function toArabicAuthError(message: string): string {
  const normalized = message.toLowerCase();
  if (message.startsWith('رمز') || message.startsWith('كلمة') || message.startsWith('أدخل')) return message;
  if (normalized.includes('email not confirmed')) return 'لم يتم تأكيد البريد الإلكتروني بعد. تواصل مع إدارة المنصة.';
  if (normalized.includes('invalid login credentials')) return 'البريد الإلكتروني أو كلمة المرور غير صحيحة. تأكد من البيانات وحاول مرة أخرى.';
  if (normalized.includes('password') && (normalized.includes('weak') || normalized.includes('guess') || normalized.includes('short') || normalized.includes('contain'))) {
    return 'كلمة المرور لا تطابق الشروط: من 6 إلى 11 محرفًا، ورقمان على الأقل، وحرف كبير وحرف صغير.';
  }
  if (normalized.includes('already registered') || normalized.includes('user already')) return 'هذا البريد الإلكتروني مسجل من قبل. استخدم تسجيل الدخول.';
  if (normalized.includes('valid email')) return 'أدخل بريدًا إلكترونيًا صحيحًا.';
  if (normalized.includes('rate limit')) return 'تم تجاوز عدد المحاولات. انتظر قليلًا ثم حاول مرة أخرى.';
  if (normalized.includes('network') || normalized.includes('fetch')) return 'تعذر الاتصال بالخدمة. تحقق من اتصال الإنترنت وحاول مرة أخرى.';
  return 'تعذر إكمال العملية. راجع البيانات وحاول مرة أخرى.';
}
