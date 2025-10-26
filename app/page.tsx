'use client'

// React and Next.js imports
import { useState, useEffect } from 'react'
// React hooks

import TriviaQuestionList from '@/components/TriviaQuestionList'
// Component that displays trivia questions (works for both daily and unlimited modes)

import ProgressStats from '@/components/ProgressStats'
// Component that shows user progress information

import { SubmissionResult, ProgressStats as ProgressStatsType, TriviaQuestion } from '@/types'
// TypeScript type definitions

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
  // Today's trivia questions (9 questions that reset daily)
  // Stored as array of questions with progress data
  
  const [unlimitedTrivia, setUnlimitedTrivia] = useState<TriviaQuestion[] | null>(null)
  // Unlimited mode questions (12 random questions, can fetch more anytime)
  
  const [currMode, setCurrentMode] = useState<string>("daily")
  // Tracks which mode user is in: "daily" or "unlimited"
  // Determines which set of questions to display
  
  const [isLoading, setIsLoading] = useState(true)
  // Loading state for API calls
  
  const [error, setError] = useState<string | null>(null)
  // Error message state
  
  const [userId] = useState(() => getUserId())
  // User ID - uses function initializer to get it once
  
  const [isLoadingUnlimited, setIsLoadingUnlimited] = useState(false)
  // Tracks if unlimited questions are being fetched
  // Used for rate limiting the "Get New Questions" button

  const supabase = createClient()
  // Initialize Supabase client for database operations

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
      
      // Fetch today's daily game with questions from Supabase
      // Uses Supabase's fluent query builder to join multiple tables
      const { data: dailyGame, error: gameError } = await supabase
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
          // PGRST116 is the error for "no rows returned" from Supabase
          throw new Error('No trivia available for today. Please check back later.')
          // If no rows are returned, there is no trivia and an error is displayed
        }
        throw new Error('Failed to fetch daily trivia')
        // Generic error if the gameError code is different
      }

      if (!dailyGame) {
        // Additional check if no game data was returned
        throw new Error('No trivia available for today')
      }

      // Transform the nested database response into a flat array of questions
      // daily_questions is an array of join records
      // We extract the nested questions from each join record
      const questions = dailyGame.daily_questions.map((dq: any) => dq.questions)

      // Load user's previous submissions for today's questions to show progress
      const { data: userSubmissions, error: progressError } = await supabase
        .from('user_answers')
        // User's answer history table
        .select('question_id, user_answer, is_correct')
        // Select relevant columns
        .eq('user_id', userId)
        // For current user based on user ID
        .in('question_id', questions.map((q: any) => q.id))
        // Where question_id is in today's questions

      // Merge questions with user progress data
      // Creates new array where each question includes user's answer status
      const questionsWithProgress: QuestionWithProgress[] = questions.map((question: any) => {
        // Find if user has submitted an answer for this question
        const submission = userSubmissions?.find((s: any) => s.question_id === question.id)
        
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
        // If no submission, return original question without progress data
      })

      // Update the state with the transformed data
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

  const fetchUnlimitedTrivia = async () => {
    // Fetches 12 random questions for unlimited mode
    // Uses PostgreSQL RPC function for efficient random selection
    try {
      setIsLoading(true)
      // Set loading state to true
      setError(null)
      // Clear any previous errors
      
      // Call the database RPC function to get random questions
      // This is more efficient than fetching all questions and sorting in JavaScript
      const { data: questions, error: questionError } = await supabase
        .rpc('get_random_questions', { question_count: 12 })
      
      if (questionError) {
        throw new Error('Failed to load trivia')
      }

      // Update state with the fetched questions
      setUnlimitedTrivia(questions)

    } catch (error: any) {
      console.error('Error in fetchUnlimitedTrivia:', error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGetNewQuestions = async () => {
    // Handles the "Get New Questions" button click in unlimited mode
    // Implements client-side rate limiting (3 second cooldown)
    setIsLoadingUnlimited(true)
    // Disable the button while fetching
    
    await fetchUnlimitedTrivia()
    // Fetch new random questions
    
    // 3 second cooldown before allowing another request
    // Prevents abuse and excessive database queries
    setTimeout(() => {
      setIsLoadingUnlimited(false)
    }, 3000)
  }

  const handleAnswerSubmit = async (questionId: string, userAnswer: string, userId: string): Promise<SubmissionResult> => {
    // Handles when a user submits an answer to a DAILY trivia question
    // Checks correctness, saves to database, and updates local state
    try {
      // Get the correct answer from the database for validation
      const { data: question, error: questionError } = await supabase
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

      // Helper function to normalize answers for comparison
      // Removes punctuation, articles, whitespace differences, etc.
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

      // Compares normalized versions of both answers
      function answersMatch(userAnswer: string, correctAnswer: string): boolean {
        return normalizeAnswer(userAnswer) === normalizeAnswer(correctAnswer)
      }

      // Check if the user's answer is correct
      const isCorrect = answersMatch(userAnswer, question.answer)
      
      // Save the user's submission to the database
      const { error: submitError } = await supabase
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

      // Update local state to reflect the new submission
      // This provides immediate UI feedback without refetching from database
      setDailyTrivia(prev => {
        if (!prev) return null
        // If no previous state, return null
        
        // Map through questions and update the answered one
        return prev.map(q => 
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
            // Return other questions unchanged
        )
      })

      // Return result to the calling component
      return {
        isCorrect,
        correctAnswer: isCorrect ? undefined : question.answer
        // Only reveal correct answer if user was wrong
      }

    } catch (error: any) {
      console.error('Error in handleAnswerSubmit:', error)
      throw new Error(error.message || 'Failed to submit answer')
      // Re-throw for error handling in child component
    }
  }

  const handleUnlimitedAnswerSubmit = async (questionId: string, userAnswer: string, userId: string): Promise<SubmissionResult> => {
    // Handles when a user submits an answer to an UNLIMITED mode question
    // Same logic as handleAnswerSubmit, but does NOT save to database
    // Unlimited mode answers are ephemeral - only tracked in local state
    try {
      // Get the correct answer from the database for validation
      const { data: question, error: questionError } = await supabase
        .from('questions')
        .select('answer')
        .eq('id', questionId)
        .single()
        
      if (questionError || !question) {
        throw new Error('Question not found')
      }

      // Helper functions for answer normalization (same as daily mode)
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

      // Update only local state (no database write for unlimited mode)
      // This keeps unlimited mode fast and doesn't clutter the database
      setUnlimitedTrivia(prev => {
        if (!prev) return []
        return prev.map(q =>
          q.id === questionId
            ? { ...q, isAnswered: true, userAnswer: userAnswer.trim(), isCorrect }
            : q
        )
      })

      return {
        isCorrect,
        correctAnswer: isCorrect ? undefined : question.answer
      }

    } catch (error: any) {
      console.error('Error in handleUnlimitedAnswerSubmit:', error)
      throw new Error(error.message || 'Failed to submit answer')
    }
  }

  const getCorrectCount = () => {
    // Helper function to count how many questions the user answered correctly
    // Works for both daily and unlimited modes by checking currMode
    const triviaProgress = currMode === "daily" ? dailyTrivia : unlimitedTrivia
    return triviaProgress?.filter(q => q.isCorrect).length || 0
  }

  const getProgressStats = (): ProgressStatsType => {
    // Calculates and returns progress statistics for display
    // Dynamically switches between daily and unlimited data based on current mode
    const triviaProgress = currMode === "daily" ? dailyTrivia : unlimitedTrivia
    
    const answeredCount = triviaProgress?.filter(q => q.isAnswered).length || 0
    // How many questions user has answered
    
    const correctCount = getCorrectCount()
    // How many answers were correct
    
    const totalQuestions = triviaProgress?.length || 0
    // Total questions available in current mode

    return {
      answeredCount,
      correctCount,
      totalQuestions,
      date: new Date().toISOString().split('T')[0]
      // Today's date (generated fresh, not stored in state)
    }
  }

  // Loading state UI - shown while fetching data
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading today's trivia...</p>
        </div>
      </div>
    )
  }

  // Error state UI - only shown if no trivia data exists
  if (error && !dailyTrivia) {
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
  }

  // No trivia available state
  if (!dailyTrivia) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex justify-center items-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">No trivia available today.</p>
        </div>
      </div>
    )
  }

  // Calculate current progress stats
  const progressStats = getProgressStats()
  const allAnswered = progressStats.answeredCount === progressStats.totalQuestions
  // Check if user has answered all questions in current mode

  // Main render - display the trivia interface
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        
        {/* Unified card wrapper for ProgressStats and header */}
        {/* This creates a single rounded card containing both sections */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          {/* Progress statistics component - shows score and progress bar */}
          <ProgressStats stats={progressStats} />
          
          {/* Header and mode controls section */}
          <div className="mt-6">
            <div className="flex justify-between items-center">
              {/* Dynamic header - changes based on current mode */}
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                {currMode === "daily" ? "Today's Questions" : "Unlimited Mode"}
              </h2>
              
              {/* Mode switching and action buttons */}
              <div className="flex gap-3">
                {/* "Play Unlimited" button - only shown when daily trivia is complete */}
                {allAnswered && currMode === "daily" && (
                  <button 
                    onClick={() => { 
                      setCurrentMode("unlimited")
                      fetchUnlimitedTrivia() 
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                  >
                    Play Unlimited Mode
                  </button>
                )}
                
                {/* Unlimited mode controls - shown only in unlimited mode */}
                {currMode === "unlimited" && (
                  <>
                    {/* Switch back to daily mode */}
                    <button 
                      onClick={() => setCurrentMode("daily")}
                      className="bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                    >
                      Back to Daily
                    </button>
                    {/* Fetch new random questions - includes 3-second rate limit */}
                    <button 
                      onClick={handleGetNewQuestions}
                      disabled={isLoadingUnlimited}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {isLoadingUnlimited ? 'Please Wait...' : 'Get New Questions'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Non-blocking error display - shows while trivia is visible */}
        {error && (
          <div className="mb-4 p-4 bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 dark:border-yellow-600 rounded-lg">
            <p className="text-yellow-800 dark:text-yellow-200">{error}</p>
          </div>
        )}

        {/* Conditional rendering based on current mode */}
        {/* Daily mode - shows daily trivia questions */}
        {currMode === "daily" && dailyTrivia && (
          <TriviaQuestionList
            questions={dailyTrivia}
            userId={userId}
            onAnswerSubmit={handleAnswerSubmit}
          />
        )}

        {/* Unlimited mode - shows unlimited trivia questions */}
        {currMode === "unlimited" && unlimitedTrivia && (
          <TriviaQuestionList
            questions={unlimitedTrivia}
            userId={userId}
            onAnswerSubmit={handleUnlimitedAnswerSubmit}
          />
        )}
      </div>
    </div>
  )
}