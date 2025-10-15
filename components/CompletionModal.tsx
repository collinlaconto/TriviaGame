import { CompletionModalProps } from '@/types'

export default function CompletionModal({
  isOpen,
  correctCount,
  totalQuestions,
  onPlayAgain,
  onClose
}: CompletionModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Quiz Completed!</h2>
        <p className="text-lg text-gray-700 mb-2">
          You got {correctCount} out of {totalQuestions} correct.
        </p>
        <p className="text-gray-600 mb-4">
          New questions available every day at midnight UTC!
        </p>
        <button
          onClick={onPlayAgain}
          className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
        >
          Play Again
        </button>
      </div>
    </div>
  );
}