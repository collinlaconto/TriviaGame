import { ProgressStatsProps } from '@/types'

export default function ProgressStats({ stats }: ProgressStatsProps) {
  const { answeredCount, correctCount, totalQuestions, date } = stats
  const progressPercentage = Math.round((answeredCount / totalQuestions) * 100)

  return (
    <div className="space-y-8">
      {/* Header Stats */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Goose Trivia</h1>
        <p className="text-gray-600">Can you answer all {totalQuestions} questions correctly?</p>
        <div className="mt-4 flex justify-between items-center bg-white rounded-lg shadow-sm p-4">
          <div className="text-left">
            <p className="text-sm text-gray-500">Date</p>
            <p className="font-semibold">{new Date(date).toLocaleDateString()}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Correct Answers</p>
            <p className="text-2xl font-bold text-green-600">{correctCount} / {totalQuestions}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Progress</p>
            <p className="font-semibold">
              {answeredCount} / {totalQuestions}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Your Progress</span>
          <span>{progressPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  )
}