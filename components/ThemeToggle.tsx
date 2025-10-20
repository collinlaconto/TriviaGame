'use client'

import { useTheme } from './ThemeProvider'

/**
 * ThemeToggle Component
 * A simple button that switches between light and dark mode
 */
export default function ThemeToggle() {
  // Get the current theme and toggle function from our ThemeProvider
  const { theme, toggleTheme } = useTheme()

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