'use client'

import { useState } from 'react'
import { DailyTriviaProps, TriviaQuestion } from '@/types'

export default function DailyTrivia({ dailyTrivia, userId, onAnswerSubmit }: DailyTriviaProps) {
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [results, setResults] = useState<{ [key: string]: any }>({})

  const handleSubmitAnswer = async (question: TriviaQuestion, answer: string) => {
    if (!answer.trim()) return
    
    setSubmitting(question.id)
    try {
      const result = await onAnswerSubmit(question.id, answer, userId)
      setResults(prev => ({
        ...prev,
        [question.id]: result
      }))
    } catch (error) {
      console.error('Failed to submit answer:', error)
    } finally {
      setSubmitting(null)
    }
  }

  if (!dailyTrivia?.questions?.length) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-600">No questions available today.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Today's Questions</h2>
      
      {/* CHANGED: Replaced space-y-6 with grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dailyTrivia.questions.map((question, index) => (
          <div 
            key={question.id} 
            className="border border-gray-200 rounded-lg p-4 flex flex-col h-full"
          >
            {/* Question Header */}
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-semibold text-gray-700">
                Q{index + 1}
              </h3>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                {question.category}
              </span>
            </div>
            
            {/* Question Text */}
            <p className="text-gray-800 mb-4 flex-grow">{question.question}</p>
            
            {/* Answer Section */}
            {question.isAnswered ? (
              <div className={`p-3 rounded ${
                question.isCorrect 
                  ? 'bg-green-100 text-green-700 border border-green-200' 
                  : 'bg-red-100 text-red-700 border border-red-200'
              }`}>
                <p className="font-semibold text-sm">
                  {question.isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                </p>
                {question.userAnswer && (
                  <p className="mt-1 text-sm">Your answer: {question.userAnswer}</p>
                )}
                {!question.isCorrect && results[question.id]?.correctAnswer && (
                  <p className="mt-1 text-sm">Correct: {results[question.id].correctAnswer}</p>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Type your answer..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSubmitAnswer(question, e.currentTarget.value)
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <button
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement
                    handleSubmitAnswer(question, input.value)
                  }}
                  disabled={submitting === question.id}
                  className="bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                >
                  {submitting === question.id ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}