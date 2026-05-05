 import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QuizRunner from '../components/Quiz/QuizRunner';
import { useAuth } from '../auth/AuthContext';
import { apiFetch } from '../api/client';

export default function PlacementTest() {
  const { auth, completePlacement, refreshProfile, setPendingExam } = useAuth();
  const navigate = useNavigate();
  const [examId, setExamId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [submitResult, setSubmitResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (submitResult || isSubmitting) return;

      // After submit, completePlacement() clears pendingExam; refetching /exams/current then 404s.
      if (auth.placementCompleted) {
        navigate('/roadmap', { replace: true });
        return;
      }
      setLoading(true);
      setLoadError('');
      try {
        if (auth.pendingExam?.id && auth.pendingExam?.questions?.length) {
          setExamId(auth.pendingExam.id);
          setQuestions(auth.pendingExam.questions);
          setLoading(false);
          return;
        }
        const data = await apiFetch('/api/exams/current');
        if (cancelled) return;
        setExamId(data.exam.id);
        setQuestions(data.exam.questions);
        setPendingExam({ id: data.exam.id, questions: data.exam.questions });
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : 'Could not load placement exam');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [auth.pendingExam, auth.placementCompleted, navigate, setPendingExam, submitResult, isSubmitting]);

  if (loading) {
    return (
      <div className="quiz-root" style={{ padding: 48, textAlign: 'center' }}>
        <p>Loading your AI placement exam…</p>
      </div>
    );
  }

  if (loadError || !examId || !questions.length) {
    return (
      <div className="quiz-root" style={{ padding: 48, textAlign: 'center' }}>
        <p>{loadError || 'No placement exam found.'}</p>
        <button type="button" className="quiz-nav-btn primary" onClick={() => navigate('/register')}>
          Back to register
        </button>
      </div>
    );
  }

  return (
    <QuizRunner
      brandTitle="AI English Placement"
      quizTitle="Placement Test"
      questions={questions}
      gradingMode="none"
      submitResult={submitResult}
      onFinish={async ({ answers }) => {
        setIsSubmitting(true);
        try {
          const payload = questions.map((q) => ({
            questionId: q.id,
            selectedIndex: typeof answers[q.id] === 'number' ? answers[q.id] : -1,
          }));
          const data = await apiFetch('/api/placement/submit', {
            method: 'POST',
            body: { examId, answers: payload },
          });
          setSubmitResult(data);
          await refreshProfile();
          completePlacement(data.level);
        } finally {
          setIsSubmitting(false);
        }
      }}
      onDone={() => {
        navigate('/roadmap', { replace: true });
      }}
      allowBack
    />
  );
}
