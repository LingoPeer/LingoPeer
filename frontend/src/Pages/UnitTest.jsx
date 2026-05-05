import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import QuizRunner from '../components/Quiz/QuizRunner';
import { getUnitTestQuestions } from '../data/unitTests';
import { getProgressState, setProgressState } from '../auth/storage';
import NavBar from '../components/NavBar';
import AiChat from '../components/AiChat';

export default function UnitTest() {
  const { unitId } = useParams();
  const unitIdNum = Number(unitId);
  const questions = getUnitTestQuestions(unitIdNum);
  const navigate = useNavigate();

  const rightMeta = useMemo(() => {
    return (
      <>
        <button className="quiz-btn" onClick={() => navigate('/roadmap')}>
          Save & Exit
        </button>
      </>
    );
  }, [navigate]);

  useEffect(() => {
    if (!questions.length) navigate('/roadmap', { replace: true });
  }, [navigate, questions.length]);

  if (!questions.length) return null;

  return (
    <>
    <NavBar />
    
    <QuizRunner
      brandTitle=""
      quizTitle={`Unit ${unitIdNum} Test`}
      questions={questions}
      rightMeta={rightMeta}
      allowBack
      onFinish={() => {
        const progress = getProgressState();
        setProgressState({
          ...progress,
          unitTestsCompleted: {
            ...progress.unitTestsCompleted,
            [unitIdNum]: true,
          },
        });
      }}
      onDone={() => {
        navigate('/roadmap', { replace: true });
      }}
      />
      <AiChat />
      </>
  );
}

