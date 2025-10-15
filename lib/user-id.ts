/**
 * Generates and persists a unique user ID for trivia tracking
 * Uses localStorage to remember the same user across browser sessions
 */
export const getUserId = (): string => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return 'server-user' // Fallback for server-side rendering
  }
  
  try {
    // Try to get existing user ID from localStorage
    let userId = localStorage.getItem('trivia-user-id')
    
    // If no user ID exists, generate a new one
    if (!userId) {
      // Generate a random user ID: 'user-' + 9 random alphanumeric characters
      userId = 'user-' + Math.random().toString(36).substring(2, 11)
      
      // Store the new user ID in localStorage
      localStorage.setItem('trivia-user-id', userId)
    }
    
    return userId
  } catch (error) {
    // Fallback if localStorage is not available
    console.warn('localStorage not available, using temporary user ID')
    return 'temp-user-' + Math.random().toString(36).substring(2, 9)
  }
}