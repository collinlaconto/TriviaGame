'use client'

import { useState, useEffect } from 'react'
import DailyTrivia from '@/components/DailyTrivia'
import ProgressStats from '@/components/ProgressStats'
import CompletionModal from '@/components/CompletionModal'
import { DailyTrivia as DailyTriviaType, SubmissionResult, ProgressStats as ProgressStatsType, TriviaQuestion } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { getUserId } from '@/lib/user-id'

interface QuestionWithProgress extends TriviaQuestion {
  isAnswered?: boolean
  userAnswer?: string
  isCorrect?: boolean
}

export default function Home() {
  const [dailyTrivia, setDailyTrivia] = useState<DailyTriviaType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId] = useState(() => getUserId())

  const supabase = createClient()

  useEffect(() => {
    fetchDailyTrivia()
  }, [])

  const fetchDailyTrivia = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const today = new Date().toISOString().split('T')[0]
      
      // Fetch today's daily game with questions
      const { data: dailyGame, error: gameError } = await supabase
        .from('daily_games')
        .select(`
          game_date,
          daily_questions (
            questions (
              id,
              question,
              category,
              difficulty
            )
          )
        `)
        .eq('game_date', today)
        .single()

      if (gameError) {
        if (gameError.code === 'PGRST116') {
          throw new Error('No trivia available for today. Please check back later.')
        }
        throw new Error('Failed to fetch daily trivia')
      }

      if (!dailyGame) {
        throw new Error('No trivia available for today')
      }

      // Transform the data to match your existing structure
      const questions = dailyGame.daily_questions.map((dq: any) => dq.questions)
      
      // Load user progress for today's questions
      const { data: userSubmissions, error: progressError } = await supabase
        .from('user_answers')
        .select('question_id, user_answer, is_correct')
        .eq('user_id', userId)
        .in('question_id', questions.map((q: any) => q.id))

      // Merge questions with user progress
      const questionsWithProgress: QuestionWithProgress[] = questions.map((question: any) => {
        const submission = userSubmissions?.find((s: any) => s.question_id === question.id)
        return submission ? {
          ...question,
          isAnswered: true,
          userAnswer: submission.user_answer,
          isCorrect: submission.is_correct
        } : question
      })

      setDailyTrivia({
        date: dailyGame.game_date,
        questions: questionsWithProgress
      })

    } catch (error: any) {
      console.error('Error in fetchDailyTrivia:', error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnswerSubmit = async (questionId: string, userAnswer: string, userId: string): Promise<SubmissionResult> => {
    try {
      // Get the correct answer from the database
      const { data: question, error: questionError } = await supabase
        .from('questions')
        .select('answer')
        .eq('id', questionId)
        .single()

      if (questionError || !question) {
        throw new Error('Question not found')
      }

      const isCorrect = question.answer.trim().toLowerCase() === userAnswer.trim().toLowerCase()

      // Save the submission to the database
      const { error: submitError } = await supabase
        .from('user_answers')
        .insert({
          user_id: userId,
          question_id: questionId,
          user_answer: userAnswer.trim(),
          is_correct: isCorrect,
          submitted_at: new Date().toISOString()
        })

      if (submitError) {
        throw new Error('Failed to save answer')
      }

      // Update local state to reflect the submission
      setDailyTrivia(prev => {
        if (!prev) return null
        
        const updatedQuestions = prev.questions.map(q => 
          q.id === questionId 
            ? { 
                ...q, 
                isAnswered: true, 
                userAnswer: userAnswer.trim(),
                isCorrect 
              }
            : q
        )
        
        return {
          ...prev,
          questions: updatedQuestions
        }
      })

      return {
        isCorrect,
        correctAnswer: isCorrect ? undefined : question.answer
        // Removed: question and category as they're not needed
      }

    } catch (error: any) {
      console.error('Error in handleAnswerSubmit:', error)
      throw new Error(error.message || 'Failed to submit answer')
    }
  }

  const handlePlayAgain = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const userId = getUserId()
    
      console.log('Resetting answers for user:', userId, 'on date:', today)
    
      // Delete user's answers for today
      const { error, count } = await supabase
        .from('user_answers')
        .delete()
        .eq('user_id', userId)
        .gte('submitted_at', `${today}T00:00:00Z`)
        .lte('submitted_at', `${today}T23:59:59Z`)

      if (error) {
        console.error('Error resetting answers:', error)
        setError('Failed to reset game. Please refresh the page.')
        return
      }

      console.log(`Deleted ${count} answers`)

      // Clear local state to force a refresh
      setDailyTrivia(null)
      setError(null)
      setIsLoading(true)

      // Refetch the daily trivia
      await fetchDailyTrivia()
    
    } catch (error) {
      console.error('Failed to reset game:', error)
      setError('Failed to reset game. Please refresh the page.')
    }
  }


  const getCorrectCount = () => {
    return dailyTrivia?.questions.filter(q => q.isCorrect).length || 0
  }

  const getProgressStats = (): ProgressStatsType => {
    const answeredCount = dailyTrivia?.questions.filter(q => q.isAnswered).length || 0
    const correctCount = getCorrectCount()
    const totalQuestions = dailyTrivia?.questions.length || 0

    return {
      answeredCount,
      correctCount,
      totalQuestions,
      date: dailyTrivia?.date || new Date().toISOString().split('T')[0]
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading today's trivia...</p>
        </div>
      </div>
    )
  }

  if (error && !dailyTrivia) {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchDailyTrivia}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!dailyTrivia) {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center">
        <div className="text-center">
          <p className="text-gray-600">No trivia available today.</p>
        </div>
      </div>
    )
  }

  const progressStats = getProgressStats()
  const allAnswered = progressStats.answeredCount === progressStats.totalQuestions

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <ProgressStats stats={progressStats} />

        {error && (
          <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 rounded-lg">
            <p className="text-yellow-800">{error}</p>
          </div>
        )}

        <DailyTrivia
          dailyTrivia={dailyTrivia}
          userId={userId}
          onAnswerSubmit={handleAnswerSubmit}
        />

        <CompletionModal
          isOpen={allAnswered}
          correctCount={progressStats.correctCount}
          totalQuestions={progressStats.totalQuestions}
          onPlayAgain={handlePlayAgain}  // Updated to use the new function
          onClose={() => {}}
        />
      </div>
    </div>
  )
}