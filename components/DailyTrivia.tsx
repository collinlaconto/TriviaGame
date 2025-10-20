'use client'

import { useState } from 'react'
import { DailyTriviaProps, TriviaQuestion } from '@/types'

// Color scheme for different categories
const categoryColors: { [key: string]: string } = {
  'Science': 'bg-blue-600',
  'History': 'bg-orange-500',
  'Geography': 'bg-emerald-600',
  'Literature': 'bg-purple-600',
  'Sports': 'bg-red-600',
  'Entertainment': 'bg-fuchsia-500',
  'Art': 'bg-violet-600',
  'Music': 'bg-yellow-500',
  'Technology': 'bg-slate-700',
  'Nature': 'bg-lime-600',
}

// Fallback colors for uncategorized questions
const fallbackColors = [
  'bg-blue-600',
  'bg-orange-500',
  'bg-emerald-600',
  'bg-purple-600',
  'bg-red-600',
  'bg-fuchsia-500',
]

export default function DailyTrivia({ dailyTrivia, userId, onAnswerSubmit }: DailyTriviaProps) {
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [results, setResults] = useState<{ [key: string]: any }>({})
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null)

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

  const getCategoryColor = (category: string, index: number): string => {
    return categoryColors[category] || fallbackColors[index % fallbackColors.length]
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dailyTrivia.questions.map((question, index) => {
          const isSelected = selectedQuestion === question.id
          const colorClass = getCategoryColor(question.category, index)
          
          return (
            <div 
              key={question.id} 
              className="relative"
            >
              {/* Category Card (Front) */}
              {!isSelected && (
                <button
                  onClick={() => setSelectedQuestion(question.id)}
                  className={`w-full h-40 ${colorClass} rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-white p-6 flex flex-col items-center justify-center cursor-pointer ${
                    question.isAnswered ? 'opacity-50' : ''
                  }`}
                >
                  <div className="text-center">
                    <div className="text-sm font-semibold opacity-90 mb-2">
                      Question {index + 1}
                    </div>
                    <div className="text-2xl font-bold">
                      {question.category}
                    </div>
                    {question.isAnswered && (
                      <div className="mt-3 text-sm text-gray-700 bg-white bg-opacity-30 rounded px-3 py-1 inline-block">
                        {question.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                      </div>
                    )}
                  </div>
                </button>
              )}

              {/* Question Card (Back) */}
              {isSelected && (
                <div className={`border-2 rounded-lg p-4 bg-white shadow-lg min-h-40 flex flex-col ${
                  question.isAnswered ? 'border-gray-300' : 'border-gray-300'
                }`}>
                  {/* Header with category and close button */}
                  <div className="flex justify-between items-center mb-3">
                    <span className={`text-xs ${colorClass} text-white px-3 py-1 rounded font-semibold ${
                      question.isAnswered ? 'opacity-50' : ''
                    }`}>
                      {question.category}
                    </span>
                    <button
                      onClick={() => setSelectedQuestion(null)}
                      className="text-gray-500 hover:text-gray-700 text-xl font-bold"
                    >
                      ×
                    </button>
                  </div>
                  
                  {/* Question Text */}
                  <p className="text-gray-800 mb-4 flex-grow text-sm">
                    {question.question}
                  </p>
                  
                  {/* Answer Section */}
                  {question.isAnswered ? (
                    <div className="text-center py-2">
                      <p className={`font-semibold text-lg ${
                        question.isCorrect ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {question.isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                      </p>
                      {question.userAnswer && (
                        <p className="mt-2 text-sm text-gray-700">Your answer: <span className="font-medium">{question.userAnswer}</span></p>
                      )}
                      {!question.isCorrect && results[question.id]?.correctAnswer && (
                        <p className="mt-1 text-sm text-gray-700">Correct answer: <span className="font-medium">{results[question.id].correctAnswer}</span></p>
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-gray-50 text-gray-900"
                        autoFocus
                      />
                      <button
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement
                          handleSubmitAnswer(question, input.value)
                        }}
                        disabled={submitting === question.id}
                        className={`${colorClass} text-white px-3 py-2 rounded-md hover:opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-semibold`}
                      >
                        {submitting === question.id ? 'Submitting...' : 'Submit Answer'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}