'use client'

import { useState } from 'react'
import QuestionModal from './QuestionModal'
import { DailyTriviaProps, TriviaQuestion } from '@/types'

export default function DailyTrivia({ dailyTrivia, userId, onAnswerSubmit }: DailyTriviaProps) {
  const [selectedQuestion, setSelectedQuestion] = useState<TriviaQuestion | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionResult, setSubmissionResult] = useState<any>(null)
  const [localQuestions, setLocalQuestions] = useState<TriviaQuestion[]>(dailyTrivia.questions)

  const handleQuestionClick = (question: TriviaQuestion) => {
    if (!question.isAnswered && !isSubmitting) {
      setSelectedQuestion(question)
      setSubmissionResult(null)
    }
  }

  const handleSubmitAnswer = async (userAnswer: string) => {
    if (!selectedQuestion) return

    try {
      setIsSubmitting(true)
      const result = await onAnswerSubmit(selectedQuestion.id, userAnswer, userId)
      setSubmissionResult(result)

      // Update local state with proper typing
      setLocalQuestions((prev: TriviaQuestion[]) => 
        prev.map((q: TriviaQuestion) => 
          q.id === selectedQuestion.id 
            ? { 
                ...q, 
                isAnswered: true, 
                userAnswer,
                isCorrect: result.isCorrect
              }
            : q
        )
      )
    } catch (error) {
      console.error('Error submitting answer:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloseModal = () => {
    setSelectedQuestion(null)
    setSubmissionResult(null)
  }

  const getCategoryColor = (index: number): string => {
    const colors = [
      'bg-blue-500 hover:bg-blue-600',
      'bg-green-500 hover:bg-green-600',
      'bg-red-500 hover:bg-red-600',
      'bg-purple-500 hover:bg-purple-600',
      'bg-yellow-500 hover:bg-yellow-600',
      'bg-pink-500 hover:bg-pink-600',
      'bg-indigo-500 hover:bg-indigo-600',
      'bg-teal-500 hover:bg-teal-600',
      'bg-orange-500 hover:bg-orange-600'
    ]
    return colors[index % colors.length]
  }

  return (
    <div>
      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {localQuestions.map((question: TriviaQuestion, index: number) => (
          <div
            key={question.id}
            className={`rounded-lg shadow-md transition-all duration-200 cursor-pointer transform hover:scale-105 ${
              question.isAnswered 
                ? question.isCorrect
                  ? 'bg-green-500 cursor-not-allowed'
                  : 'bg-red-500 cursor-not-allowed'
                : getCategoryColor(index)
            } text-white p-6 text-center`}
            onClick={() => handleQuestionClick(question)}
          >
            <h3 className="text-xl font-bold mb-2">{question.category}</h3>
            <p className="text-sm opacity-90 capitalize">{question.difficulty}</p>
            {question.isAnswered && (
              <div className="mt-2 text-sm">
                <p className="truncate">Your answer: {question.userAnswer}</p>
                <p className="font-semibold mt-1">
                  {question.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Question Modal */}
      <QuestionModal
        question={selectedQuestion}
        isOpen={!!selectedQuestion}
        isSubmitting={isSubmitting}
        onClose={handleCloseModal}
        onSubmit={handleSubmitAnswer}
        submissionResult={submissionResult}
      />
    </div>
  )
}