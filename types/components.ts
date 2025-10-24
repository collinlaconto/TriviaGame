// This file handles describing the components we use

import { TriviaQuestion, SubmissionResult, ProgressStats } from './trivia'

export interface ProgressStatsProps {
  stats: ProgressStats
}

export interface TriviaQuestionProps {
  questions: TriviaQuestion[]
  userId: string
  onAnswerSubmit: (questionId: string, userAnswer: string, userId: string) => Promise<SubmissionResult>
}