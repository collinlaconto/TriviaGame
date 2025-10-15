import { TriviaQuestion, SubmissionResult, ProgressStats, DailyTrivia } from './trivia'

export interface ProgressStatsProps {
  stats: ProgressStats
}

export interface DailyTriviaProps {
  dailyTrivia: DailyTrivia  // ✅ Use proper type instead of 'any'
  userId: string
  onAnswerSubmit: (questionId: string, userAnswer: string, userId: string) => Promise<SubmissionResult>
}

export interface CompletionModalProps {
  isOpen: boolean
  correctCount: number
  totalQuestions: number
  onPlayAgain: () => void
  onClose: () => void
}