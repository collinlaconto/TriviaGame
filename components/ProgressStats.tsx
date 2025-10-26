import { ProgressStatsProps } from '@/types'

export default function ProgressStats({ stats }: ProgressStatsProps) {
  const { answeredCount, correctCount, totalQuestions, date } = stats
  const progressPercentage = Math.round((answeredCount / totalQuestions) * 100)

  return (
    <>
      {/* Header Stats */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-2">Goose Trivia</h1>
        <p className="text-gray-600 dark:text-gray-400">Can you answer all {totalQuestions} questions correctly?</p>
        <div className="mt-4 flex justify-between items-center p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-left">
            <p className="text-sm text-gray-500 dark:text-gray-400">Date</p>
            <p className="font-semibold text-gray-800 dark:text-gray-200">{new Date(date).toLocaleDateString()}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Correct Answers</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{correctCount} / {totalQuestions}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">Progress</p>
            <p className="font-semibold text-gray-800 dark:text-gray-200">
              {answeredCount} / {totalQuestions}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="pb-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>Your Progress</span>
          <span>{progressPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-green-500 dark:bg-green-400 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>
    </>
  )
}