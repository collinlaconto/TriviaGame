'use client'

import { useState } from 'react'
import { DailyTriviaProps, TriviaQuestion } from '@/types'

// Color scheme for different categories
const categoryColors: { [key: string]: string } = {
  'Science': 'bg-blue-500',
  'History': 'bg-amber-500',
  'Geography': 'bg-green-500',
  'Literature': 'bg-purple-500',
  'Sports': 'bg-red-500',
  'Entertainment': 'bg-pink-500',
  'Art': 'bg-indigo-500',
  'Music': 'bg-cyan-500',
  'Technology': 'bg-slate-500',
  'Nature': 'bg-emerald-500',
}

// Fallback colors for uncategorized questions
const fallbackColors = [
  'bg-blue-500',
  'bg-amber-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-red-500',
  'bg-pink-500',
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
                  className={`w-full h-40 ${colorClass} rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-white p-6 flex flex-col items-center justify-center cursor-pointer`}
                >
                  <div className="text-center">
                    <div className="text-sm font-semibold opacity-90 mb-2">
                      Question {index + 1}
                    </div>
                    <div className="text-2xl font-bold">
                      {question.category}
                    </div>
                    {question.isAnswered && (
                      <div className="mt-3 text-sm bg-white bg-opacity-20 rounded px-3 py-1 inline-block">
                        {question.isCorrect ? '✓ Answered' : '✗ Answered'}
                      </div>
                    )}
                  </div>
                </button>
              )}

              {/* Question Card (Back) */}
              {isSelected && (
                <div className="border-2 border-gray-300 rounded-lg p-4 bg-white shadow-lg min-h-40 flex flex-col">
                  {/* Header with category and close button */}
                  <div className="flex justify-between items-center mb-3">
                    <span className={`text-xs ${colorClass} text-white px-3 py-1 rounded font-semibold`}>
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