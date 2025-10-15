export interface TriviaQuestion {
  id: string
  category: string
  question: string
  difficulty: string
  isAnswered?: boolean
  userAnswer?: string
  isCorrect?: boolean
}

export interface DailyTrivia {
  date: string
  questions: TriviaQuestion[]
}

export interface SubmissionResult {
  isCorrect: boolean
  correctAnswer?: string
}

export interface ProgressStats {
  answeredCount: number
  correctCount: number
  totalQuestions: number
  date: string
}