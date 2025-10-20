import './globals.css'
import { Inter } from 'next/font/google'
// Imports font set from google
import { ThemeProvider } from '@/components/ThemeProvider'
import ThemeToggle from '@/components/ThemeToggle'
// Imports theme provider and toggle components

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Daily Trivia Challenge',
  description: 'Test your knowledge with daily trivia questions!',
}
// Sets the default page title and description for browsers and search engines

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Wrapper component that renders on every page
  // Different pages are sent in as children

  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
          <ThemeToggle />
          {children}
        </ThemeProvider>
        </body>
    </html>
  )
}