import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import AuthScreen from '@/components/AuthScreen';
import StudentQuiz from '@/components/StudentQuiz';
import TeacherDashboard from '@/components/TeacherDashboard';

function App() {
  const { session, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center" dir="rtl">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (session) {
    return <TeacherDashboard onSignOut={async () => { await supabase.auth.signOut(); setShowAuth(false); }} />;
  }

  if (showAuth) {
    return <AuthScreen onBack={() => setShowAuth(false)} />;
  }

  return <StudentQuiz onTeacherAccess={() => setShowAuth(true)} />;
}

export default App;
