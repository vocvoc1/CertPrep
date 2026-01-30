import React, { useState } from 'react';
import { NormalizedQuestion, UserAnswer, LeaderboardEntry } from './types';
import { saveRun } from './services/storage';

// Views
import { HomeView } from './views/Home';
import { QuizView } from './views/Quiz';
import { SummaryView } from './views/Summary';
import { LeaderboardView } from './views/Leaderboard';

type ViewState = 'HOME' | 'QUIZ' | 'SUMMARY' | 'LEADERBOARD';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('HOME');
  const [questions, setQuestions] = useState<NormalizedQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [retryIds, setRetryIds] = useState<string[]>([]);

  // 1. Start Quiz from Home
  const handleStart = (loadedQuestions: NormalizedQuestion[]) => {
    setQuestions(loadedQuestions);
    setUserAnswers([]);
    setRetryIds([]);
    setCurrentView('QUIZ');
  };

  // 2. Complete Quiz
  const handleQuizComplete = (answers: UserAnswer[]) => {
    setUserAnswers(prev => [...prev, ...answers]); // Merge if partial (though usually replaces in this flow)
    
    // Save to Leaderboard
    const total = answers.length; // Or active questions length
    const correct = answers.filter(a => a.isCorrect).length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    
    const entry: LeaderboardEntry = {
        runId: Date.now().toString(),
        date: new Date().toISOString(),
        totalAnswered: total,
        correct,
        accuracy
    };
    saveRun(entry);
    
    setCurrentView('SUMMARY');
  };

  // 3. Retry Logic
  const handleRetry = (ids: string[]) => {
    setRetryIds(ids);
    // Important: We need to clear previous answers for these specific questions if we track them by ID
    // But for simplicity in this flow, we just start the Quiz View again. 
    // The QuizView filters by ID. 
    // We should probably reset the "userAnswers" for a fresh run, or just keep them? 
    // A retry usually implies a new "Mini Run".
    setUserAnswers([]); 
    setCurrentView('QUIZ');
  };

  // 4. Navigation Handlers
  const goHome = () => {
    setQuestions([]);
    setUserAnswers([]);
    setRetryIds([]);
    setCurrentView('HOME');
  };

  return (
    <main className="h-full w-full bg-slate-50 sm:bg-slate-200 flex flex-col items-center">
       {/* Mobile Container Simulator for Desktop */}
      <div className="w-full h-full sm:max-w-md sm:h-[90vh] sm:my-auto bg-slate-50 sm:rounded-3xl sm:shadow-2xl sm:overflow-hidden relative">
        
        {currentView === 'HOME' && (
            <HomeView 
                onStart={handleStart} 
                onOpenLeaderboard={() => setCurrentView('LEADERBOARD')} 
            />
        )}

        {currentView === 'QUIZ' && (
            <QuizView 
                questions={questions}
                initialRetryIds={retryIds.length > 0 ? retryIds : undefined}
                onComplete={handleQuizComplete}
                onExit={goHome}
            />
        )}

        {currentView === 'SUMMARY' && (
            <SummaryView 
                questions={questions}
                userAnswers={userAnswers}
                onRetryIncorrect={handleRetry}
                onNewQuiz={goHome}
                onViewLeaderboard={() => setCurrentView('LEADERBOARD')}
            />
        )}

        {currentView === 'LEADERBOARD' && (
            <LeaderboardView onBack={() => {
                // Return to appropriate screen
                if (questions.length > 0 && userAnswers.length > 0) {
                    setCurrentView('SUMMARY');
                } else {
                    setCurrentView('HOME');
                }
            }} />
        )}

      </div>
    </main>
  );
}

export default App;
