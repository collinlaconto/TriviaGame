'use client'

import { useState, useEffect } from 'react'
import { useTheme } from './ThemeProvider'

/**
 * ThemeToggle Component
 * A button that switches between light and dark mode
 * Displays text showing what mode clicking will switch to
 */
export default function ThemeToggle() {
  // Track if component has mounted on client to prevent SSR issues
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render anything until mounted on client
  if (!mounted) {
    return null
  }

  // Only access theme context after confirming we're on the client
  return <ThemeToggleButton />
}

function ThemeToggleButton() {
  // Get the current theme and toggle function from ThemeProvider
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="fixed top-4 right-4 px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors shadow-lg z-50 font-semibold text-gray-800 dark:text-gray-100"
      aria-label="Toggle theme"
    >
      {/* Display the opposite theme name (what clicking will switch TO) */}
      {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
    </button>
  )
}