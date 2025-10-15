import { CompletionModalProps } from '@/types'

export default function CompletionModal({
  isOpen,
  correctCount,
  totalQuestions,
  onPlayAgain,
  onClose
}: CompletionModalProps) {
  if (!isOpen) return null

  const isPerfectScore = correctCount === totalQuestions

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          {isPerfectScore ? 'Perfect Score! 🎉' : 'Challenge Complete! ✅'}
        </h2>
        <div className="text-6xl mb-4">
          {isPerfectScore ? '🏆' : '✅'}
        </div>
        <p className="text-lg text-gray-600 mb-2">Your Results:</p>
        <p className="text-3xl font-bold text-green-600 mb-6">{correctCount} / {totalQuestions} Correct</p>
        <p className="text-gray-600 mb-4">
          {isPerfectScore 
            ? "Amazing! You got every question right!" 
            : `You answered ${correctCount} out of ${totalQuestions} questions correctly.`}
        </p>
        <div className="flex gap-4">
          <button
            onClick={onPlayAgain}
            className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Play Again
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}