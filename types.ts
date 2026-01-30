// ---------------------------------------------------------------------------
// 2. Data Models (TypeScript)
// ---------------------------------------------------------------------------

export interface Vote {
  answer: string;
  count: number;
  isMostVoted: boolean;
}

export interface Comment {
  date: string;
  voteCount: number;
  content: string;
}

// Raw input from JSON file
export interface RawQuestion {
  topic?: string;
  index?: string | number;
  body: string;
  answer: string; // "A", "AB", etc.
  answerDescription?: string;
  options: string[]; // HTML strings
  votes?: Vote[];
  comments?: Comment[];
  url?: string;
}

export interface Option {
  key: string; // "A", "B", "C"
  text: string; // Clean text
}

// Normalized question for app usage
export interface NormalizedQuestion {
  id: string; // Generated unique ID
  topic: string;
  index: string;
  body: string; // Clean text
  correctAnswers: string[]; // ["A", "B"]
  options: Option[];
  type: 'SINGLE' | 'MULTI';
  explanation: string; // Pre-calculated explanation text
}

export interface UserAnswer {
  questionId: string;
  selectedOptions: string[]; // ["A"] or ["A", "B"]
  isCorrect: boolean;
  timestamp: number;
}

export interface QuizStats {
  totalQuestions: number;
  totalAnswered: number;
  correctCount: number;
  incorrectCount: number;
  accuracy: number;
  startTime: number;
  endTime?: number;
}

export interface LeaderboardEntry {
  runId: string;
  date: string;
  totalAnswered: number;
  correct: number;
  accuracy: number;
}
