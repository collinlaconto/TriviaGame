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
  // This prevents hydration errors in Next.js
  const [mounted, setMounted] = useState(false)

  // Load the user's saved theme preference or detect their system preference
  useEffect(() => {
    setMounted(true)
    
    // Try to get the saved theme from browser's localStorage
    const savedTheme = localStorage.getItem('theme') as Theme | null
    
    if (savedTheme) {
      // If user previously saved a preference, use it
      setTheme(savedTheme)
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      // Otherwise, check if their operating system prefers dark mode
      setTheme('dark')
    }
  }, [])

  // Apply the theme to the HTML document and save it to localStorage
  useEffect(() => {
    if (mounted) {
      const root = document.documentElement
      
      // Only manage the 'dark' class - Tailwind doesn't need 'light'
      if (theme === 'dark') {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
      
      // Save the theme to localStorage so it persists across browser sessions
      localStorage.setItem('theme', theme)
    }
  }, [theme, mounted])

  /**
   * toggleTheme Function
   * Switches between light and dark mode
   */
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light')
  }

  // Don't render until mounted to prevent flash of unstyled content
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
  const context = useContext(ThemeContext)
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  
  return context
}