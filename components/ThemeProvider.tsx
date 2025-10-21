'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

type ThemeContextType = {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    console.log('ThemeProvider mounted')
    setMounted(true)
    
    const savedTheme = localStorage.getItem('theme') as Theme | null
    console.log('Saved theme from localStorage:', savedTheme)
    
    if (savedTheme) {
      setTheme(savedTheme)
      console.log('Using saved theme:', savedTheme)
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark')
      console.log('Using system preference: dark')
    } else {
      console.log('Using default: light')
    }
  }, [])

  useEffect(() => {
    if (mounted) {
      console.log('Applying theme:', theme)
      const root = document.documentElement
      
      if (theme === 'dark') {
        root.classList.add('dark')
        console.log('Added dark class to html element')
      } else {
        root.classList.remove('dark')
        console.log('Removed dark class from html element')
      }
      
      localStorage.setItem('theme', theme)
      console.log('Saved theme to localStorage:', theme)
      console.log('Current HTML classes:', root.className)
    }
  }, [theme, mounted])

  const toggleTheme = () => {
    console.log('toggleTheme called, current theme:', theme)
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light'
      console.log('Setting new theme:', newTheme)
      return newTheme
    })
  }

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}