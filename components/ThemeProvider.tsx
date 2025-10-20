'use client'

import { createContext, useContext, useEffect, useState } from 'react'

// Define the two possible theme values
type Theme = 'light' | 'dark'

// Define what data the ThemeContext will provide to components
type ThemeContextType = {
  theme: Theme              // The current theme ('light' or 'dark')
  toggleTheme: () => void   // Function to switch between themes
}

// Create a Context to share theme data across all components
// Initially undefined because no value exists until ThemeProvider wraps the app
const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

/**
 * ThemeProvider Component
 * Wraps the entire app to provide theme functionality to all child components
 * Handles: loading saved theme, detecting system preference, saving changes, and updating the DOM
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // State to track the current theme (defaults to 'light')
  const [theme, setTheme] = useState<Theme>('light')
  
  // State to track if the component has mounted (rendered on the client)
  // This prevents hydration errors in Next.js (when server HTML doesn't match client)
  const [mounted, setMounted] = useState(false)

  // EFFECT 1: Runs once when component mounts
  // Purpose: Load the user's saved theme preference or detect their system preference
  useEffect(() => {
    setMounted(true) // Mark that we're now running on the client
    
    // Try to get the saved theme from browser's localStorage
    const savedTheme = localStorage.getItem('theme') as Theme | null
    
    if (savedTheme) {
      // If user previously saved a preference, use it
      setTheme(savedTheme)
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      // Otherwise, check if their operating system prefers dark mode
      // This respects the user's system-wide dark mode setting
      setTheme('dark')
    }
    // If neither exists, keep default 'light' theme
  }, []) // Empty dependency array = only run once on mount

  // EFFECT 2: Runs whenever theme or mounted changes
  // Purpose: Apply the theme to the HTML document and save it to localStorage
  useEffect(() => {
    if (mounted) { // Only run after component has mounted on client
      // Get the root HTML element (<html>)
      const root = document.documentElement
      
      // Remove any existing theme classes
      root.classList.remove('light', 'dark')
      
      // Add the current theme as a class to <html>
      // This enables Tailwind's dark: prefix to work
      root.classList.add(theme)
      
      // Save the theme to localStorage so it persists across browser sessions
      localStorage.setItem('theme', theme)
    }
  }, [theme, mounted]) // Run whenever theme or mounted changes

  /**
   * toggleTheme Function
   * Switches between light and dark mode
   */
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light')
  }

  // Before the component mounts on client, render children without theme context
  // This prevents "flash of wrong theme" by not rendering theme-dependent UI until ready
  if (!mounted) {
    return <>{children}</>
  }

  // Provide theme and toggleTheme to all child components via Context
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

/**
 * useTheme Hook
 * Custom hook that any component can call to access theme and toggleTheme
 * Example usage: const { theme, toggleTheme } = useTheme()
 */
export function useTheme() {
  // Get the context value
  const context = useContext(ThemeContext)
  
  // If context is undefined, it means useTheme was called outside of ThemeProvider
  // Throw an error to help developers catch this mistake
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  
  return context
}