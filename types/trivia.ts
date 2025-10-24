// This file handles the types that we use and export

export interface TriviaQuestion {
  id: string
  category: string
  question: string
  difficulty: string
  isAnswered?: boolean
  userAnswer?: string
  isCorrect?: boolean
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