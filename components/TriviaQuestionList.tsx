'use client'

import { useState } from 'react'
import { TriviaQuestion, TriviaQuestionProps } from '@/types'
import styles from './TriviaQuestionList.module.css'

// Color palette for cards - each question gets a unique color based on its position
const cardColors = [
  'bg-blue-600',
  'bg-orange-500',
  'bg-emerald-600',
  'bg-purple-600',
  'bg-red-600',
  'bg-fuchsia-500',
  'bg-violet-600',
  'bg-yellow-500',
  'bg-slate-700',
  'bg-lime-600',
  'bg-cyan-600',
  'bg-rose-600',
  'bg-indigo-600',
  'bg-amber-600',
  'bg-teal-600',
  'bg-pink-600',
  'bg-sky-600',
  'bg-green-600',
]

export default function TriviaQuestionList({ questions, userId, onAnswerSubmit }: TriviaQuestionProps) {
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

  // Get color based on index position, not category
  const getCardColor = (index: number): string => {
    return cardColors[index % cardColors.length]
  }

  if (!questions?.length) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-600 dark:text-gray-400">No questions available today.</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {questions.map((question, index) => {
          const isSelected = selectedQuestion === question.id
          const colorClass = getCardColor(index)
          
          return (
            <div 
              key={question.id} 
              className="relative"
            >
              <div className={styles.cardContainer}>
                <div className={`${styles.cardFlipper} ${isSelected ? styles.flipped : ''}`}>
    
                  {/* Front card - always rendered */}
                  <button
                    onClick={() => setSelectedQuestion(question.id)}
                    className={`${styles.cardFace} ${styles.cardFront} w-full h-40 ${colorClass} rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-white p-6 flex flex-col items-center justify-center cursor-pointer ${
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
                    </div>
                  </button>
    
                  {/* Back card - always rendered */}
                  <div className={`${styles.cardFace} ${styles.cardBack} border-2 rounded-lg p-4 bg-white dark:bg-gray-800 shadow-lg min-h-40 flex flex-col ${
                    question.isAnswered ? 'border-gray-300 dark:border-gray-600' : 'border-gray-300 dark:border-gray-600'
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
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xl font-bold"
                      >
                        ×
                      </button>
                    </div>
                  
                  {/* Question Text */}
                  <p className="text-gray-800 dark:text-gray-200 mb-4 flex-grow text-sm">
                    {question.question}
                  </p>
                  
                  {/* Answer Section */}
                  {question.isAnswered ? (
                    <div className="text-center py-2">
                        <p className={`font-semibold text-lg ${
                          question.isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {question.isCorrect ? 'Correct!' : 'Incorrect'}
                        </p>
                        {question.userAnswer && (
                          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                            Your answer: <span className="font-medium">{question.userAnswer}</span>
                          </p>
                        )}
                        {!question.isCorrect && results[question.id]?.correctAnswer && (
                          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                            Correct answer: <span className="font-medium">{results[question.id].correctAnswer}</span>
                          </p>
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
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
                </div>  {/* ← Closes the back card div (cardFace cardBack) */}
              </div>  {/* ← Closes cardFlipper */}
            </div>  {/* ← Closes cardContainer */}
          </div>
        )
      })}
      
      </div>
    </div>
  )
}