'use client'

// React and Next.js imports

import { useState, useEffect } from 'react'
// React hooks
import TriviaQuestionList from '@/components/TriviaQuestionList'
// Component that displays the daily trivia questions
import ProgressStats from '@/components/ProgressStats'
// Component that shows user progress information
import CompletionModal from '@/components/CompletionModal'
// Modal showed when all questions have been answered
import { SubmissionResult, ProgressStats as ProgressStatsType, TriviaQuestion } from '@/types'
// Typescript type definitions
import { createClient } from '@/lib/supabase/client'
// Supabase client for database operations
import { getUserId } from '@/lib/user-id'
// Utility function to get user ID

// Interface that adds progress tracking to trivia questions
interface QuestionWithProgress extends TriviaQuestion {
  isAnswered?: boolean
  // Whether the user has answered this question
  userAnswer?: string
  // The user's answer for this question
  isCorrect?: boolean
  // Whether the user's answer was correct
}


export default function Home() {
  // Main component for the home page


  // State management
  
  const [dailyTrivia, setDailyTrivia] = useState<TriviaQuestion[] | null>(null)
  const [unlimitedTrivia, setUnlimitedTrivia] = useState<TriviaQuestion[] | null>(null)
  const [currMode, setCurrentMode] = useState<string>("daily")

  const [isLoading, setIsLoading] = useState(true)
  // Loading state for API calls
  const [error, setError] = useState<string | null>(null)
  // Error message state
  const [userId] = useState(() => getUserId())
  // User ID
  // Uses function initializer to get it once

  const supabase = createClient()
  // Initialize supbase client for database operations

  useEffect(() => {
    // useEffect hook runs when component mounts (empty dependency array [])
    fetchDailyTrivia()
    // Fetch daily trivia when component loads
  }, [])
  // Empty array means this effect runs only once after initial render

  const fetchDailyTrivia = async () => {
    // Fetches today's trivia questions and user progress from the database
    try {
      setIsLoading(true)
      // Set loading state to true
      setError(null)
      // Clear any previous errors

      const today = new Date().toISOString().split('T')[0]
      // Get today's date in YYYY-MM-DD format for database query
      
      
      const { data: dailyGame, error: gameError } = await supabase
      // Fetch today's daily game with questions from supabase
      // Uses supabase's fluent query builder to join multiple tables
        .from('daily_games')
        // Select from daily_games table
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
        // Select game data and nested questions through daily_questions join table
        .eq('game_date', today)
        // Where game_date equals today
        .single()
        // Expects exactly one result or error if none

      if (gameError) {
        // Handles errors from database query
        if (gameError.code === 'PGRST116') {
          // PGRST116 is the error for "no rows returned" from supabase
          throw new Error('No trivia available for today. Please check back later.')
          // If no rows are returned, there is no triva and an error is displayed
        }
        throw new Error('Failed to fetch daily trivia')
        // Generic error if the gameError code is different
      }

      if (!dailyGame) {
        // Additional check if no game data was returned
        throw new Error('No trivia available for today')
      }

      
      const questions = dailyGame.daily_questions.map((dq: any) => dq.questions)
      // Transform the nested database response into a flat array of questions
      // daily_questions is an array of join records
      // We use this to extract the nested questions

      
      const { data: userSubmissions, error: progressError } = await supabase
      // Load user's previous submissions for today's questions to show progress
        .from('user_answers')
        // User's answer history table
        .select('question_id, user_answer, is_correct')
        // Select relevant columns
        .eq('user_id', userId)
        // For current user base on user ID
        .in('question_id', questions.map((q: any) => q.id))
        // Where question_id is in today's questions

      
      const questionsWithProgress: QuestionWithProgress[] = questions.map((question: any) => {
        // Merge questions with user progress data
        // Creates new array where each question includes user's answer status
        
        const submission = userSubmissions?.find((s: any) => s.question_id === question.id)
        // Find if user has submitted an answer for this question

        return submission ? {
          ...question,
          // Spread all original question properties
          isAnswered: true,
          // User has answered this question
          userAnswer: submission.user_answer,
          // What the user answered
          isCorrect: submission.is_correct
          // Whether the user was correct
        } : question
        // If not submission, returns orignal question without progress data
      })

      setDailyTrivia(questionsWithProgress)

    } catch (error: any) {
      console.error('Error in fetchDailyTrivia:', error)
      setError(error.message)
      // Set error message for user display
    } finally {
      setIsLoading(false)
      // Always turn off loading state regardless of success or error
    }
  }

  const handleAnswerSubmit = async (questionId: string, userAnswer: string, userId: string): Promise<SubmissionResult> => {
    // Handles when a user submits an answer to a question
    try {
      
      const { data: question, error: questionError } = await supabase
      // Get the correct answer from the database for validation
        .from('questions')
        .select('answer')
        // Select only the answer column
        .eq('id', questionId)
        // For this specific question
        .single()
        // Expect exactly one result

      if (questionError || !question) {
        throw new Error('Question not found')
        // If the question is not found, display an error
      }

      // Add the helper functions at the top of your file (outside the component)
      function normalizeAnswer(answer: string): string {
        let normalized = answer.trim()
        normalized = normalized.toLowerCase()
        normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        normalized = normalized.replace(/[^\w\s]/g, '')
        normalized = normalized.replace(/^(the|a|an)\s+/i, '')
        normalized = normalized.replace(/s$/, '')
        normalized = normalized.replace(/\s+/g, ' ').trim()
        return normalized
      }

      function answersMatch(userAnswer: string, correctAnswer: string): boolean {
        return normalizeAnswer(userAnswer) === normalizeAnswer(correctAnswer)
      }


      const isCorrect = answersMatch(userAnswer, question.answer)
      
      const { error: submitError } = await supabase
      // Save the user's submission to the database
        .from('user_answers')
        .insert({
          user_id: userId,
          question_id: questionId,
          user_answer: userAnswer.trim(),
          // Store cleaned version
          is_correct: isCorrect,
          // Store whether they were correct
          submitted_at: new Date().toISOString()
          // Timestamp of submission
        })

      if (submitError) {
        throw new Error('Failed to save answer')
      }

      setDailyTrivia(prev => {
        // Update local state to reflect the new submission
        if (!prev) return null
        // If no previous state, return null
        return prev.map(q => 
          // Map through questions and update the answered one
          q.id === questionId 
            ? { 
                ...q, 
                // Spread existing question properties
                isAnswered: true, 
                // Mark as answered
                userAnswer: userAnswer.trim(),
                // Store user's answer
                isCorrect 
                // Store correctness
              }
            : q
            // Return other questons unchanged
        )
      })
      return {
        // Return result to the calling component
        isCorrect,
        correctAnswer: isCorrect ? undefined : question.answer
        // Only reveal correct answer if wrong
      }

    } catch (error: any) {
      console.error('Error in handleAnswerSubmit:', error)
      throw new Error(error.message || 'Failed to submit answer')
      // Re-throw for error handling in child component
    }
  }
  const fetchUnlimitedTrivia = async () => {
    try {
        setIsLoading(true)
        setError(null)
        const { data: questions, error: gameError} = await supabase
            .from('questions')
            .select('id, question, category, difficulty')
            .order('random()')
            .limit(12)
        if (gameError) {
            throw new Error('Failed to load trivia')
        }
        setUnlimitedTrivia(questions)
    } catch (error: any) {
        setError(error.message)
    } finally {
        setIsLoading(false)
    }
  }


  const handleUnlimitedAnswerSubmit = async (questionId: string, userAnswer: string, userId: string): Promise<SubmissionResult> => {
    try {
        const { data: question, error: questionError } = await supabase
            .from('questions')
            .select('answer')
            .eq('id', questionId)
            .single()
        if (questionError || !question) {
            throw new Error('Question not found')
        }
        function normalizeAnswer(answer: string): string {
            let normalized = answer.trim()
            normalized = normalized.toLowerCase()
            normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            normalized = normalized.replace(/[^\w\s]/g, '')
            normalized = normalized.replace(/^(the|a|an)\s+/i, '')
            normalized = normalized.replace(/s$/, '')
            normalized = normalized.replace(/\s+/g, ' ').trim()
            return normalized
        }

        function answersMatch(userAnswer: string, correctAnswer: string): boolean {
            return normalizeAnswer(userAnswer) === normalizeAnswer(correctAnswer)
        }

        const isCorrect = answersMatch(userAnswer, question.answer)

        setUnlimitedTrivia(prev => {
            if (!prev) return null
            return prev.map(q =>
                q.id === questionId
                ? {
                    ...q,
                    isAnswered: true,
                    userAnswer: userAnswer.trim(),
                    isCorrect
                }
                : q
            )
        })
        return {
            isCorrect,
            correctAnswer: isCorrect ? undefined: question.answer
        }

    } catch (error: any) {
        setError(error.message)
        throw new Error(error.message)
    }
  }


  const getCorrectCount = () => {
    // Helper function to count how many questions the user answered correctly
    return dailyTrivia?.filter(q => q.isCorrect).length || 0
  }

  const getProgressStats = (): ProgressStatsType => {
    // Calculates and returns progress statistics for display
    const answeredCount = dailyTrivia?.filter(q => q.isAnswered).length || 0
    // Answered count
    const correctCount = getCorrectCount()
    // Correct count
    const totalQuestions = dailyTrivia?.length || 0
    // Total questions

    return {
      answeredCount,
      // How many questions user has answered
      correctCount,
      // How many answers were correct
      totalQuestions,
      // Total questions available
      date: new Date().toISOString().split('T')[0]
      // Today's date
    }
  }

  if (isLoading) {
    // Loading state UI
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading today's trivia...</p>
        </div>
      </div>
    )
    // Animated loading spinner
  }

  if (error && !dailyTrivia) {
    // Error state UI
    // Only show if no trivia data exists
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex justify-center items-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Something went wrong</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchDailyTrivia}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
    // Retry button that re-fetches data
  }

  if (!dailyTrivia) {
    // No trivia available state
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex justify-center items-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">No trivia available today.</p>
        </div>
      </div>
    )
  }

  const progressStats = getProgressStats()
  const allAnswered = progressStats.answeredCount === progressStats.totalQuestions
  // Calculate current progress

  return (
    // Main render
    // Display the trivia interface


    // Progress stats: progress statistics component
    // Error: Non-blocking error display - Shows while trivia is visible
    // Daily Trivia: Main trivia component with questions
    // Completion Modal: Shows when all questions are answered
    

    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <ProgressStats stats={progressStats} />

        {error && (
          <div className="mb-4 p-4 bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 dark:border-yellow-600 rounded-lg">
            <p className="text-yellow-800 dark:text-yellow-200">{error}</p>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-2xl font-bold">
            {currMode === "daily" ? "Today's Questions" : "Unlimited Mode"}
          </h2>
  
          {allAnswered && currMode === "daily" && (
            <button onClick={() => {setCurrentMode("unlimited"); fetchUnlimitedTrivia()}}>
              Play Unlimited Mode
            </button>
          )}
  
          {currMode === "unlimited" && (
            <>
            <button onClick={() => {setCurrentMode("daily")}}>
              Back to Daily
            </button>
            <button onClick={() => {fetchUnlimitedTrivia()}}>
              Get New Questions
            </button>
          </>
          )}
        </div>

        {currMode === "daily" && dailyTrivia && (
          <TriviaQuestionList
            questions={dailyTrivia}
            userId={userId}
            onAnswerSubmit={handleAnswerSubmit}
          />
        )}

        {currMode === "unlimited" && unlimitedTrivia && (
          <TriviaQuestionList
            questions={unlimitedTrivia}
            userId={userId}
            onAnswerSubmit={handleUnlimitedAnswerSubmit}
          />
        )}

        <CompletionModal
          isOpen={allAnswered}
          correctCount={progressStats.correctCount}
          totalQuestions={progressStats.totalQuestions}
          onClose={() => {}}
        />
      </div>
    </div>
  )
}