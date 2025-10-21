'use client'

import { useState, useEffect } from 'react'
import { useTheme } from './ThemeProvider'

/**
 * ThemeToggle Component
 * A simple button that switches between light and dark mode
 * Displays text only (no icons) showing the current theme
 */
export default function ThemeToggle() {
  // State to track if component has mounted on client
  const [mounted, setMounted] = useState(false)
  
  // Get the current theme and toggle function from our ThemeProvider
  const { theme, toggleTheme } = useTheme()

  // Set mounted to true after component mounts on client
  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render anything until mounted on client
  // This prevents server-side rendering issues
  if (!mounted) {
    return null
  }

  return (
    <button
      onClick={toggleTheme} // When clicked, switch themes
      // Styling breakdown:
      // - fixed top-4 right-4: Position button in top-right corner of screen
      // - px-4 py-2: Padding inside button
      // - rounded-lg: Rounded corners
      // - bg-gray-200: Light gray background in light mode
      // - dark:bg-gray-700: Dark gray background in dark mode
      // - hover:bg-gray-300: Slightly darker on hover (light mode)
      // - dark:hover:bg-gray-600: Slightly lighter on hover (dark mode)
      // - transition-colors: Smooth color transitions
      // - shadow-lg: Drop shadow for depth
      // - z-50: High z-index so it stays on top of other elements
      // - font-semibold: Bold text
      className="fixed top-4 right-4 px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors shadow-lg z-50 font-semibold text-gray-800 dark:text-gray-100"
      aria-label="Toggle theme" // Accessibility label for screen readers
    >
      {/* Display the opposite theme name (what clicking will switch TO) */}
      {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
    </button>
  )
}