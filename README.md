Author: Collin Laconto

This is a basic trivia game

Takes questions from a database of jeopardy trivia questions and allows the user to submit answers.

12 new questions every day using a scheduled cron job in my database. Once the user has submitted answers for all 12 questions, they have the ability to play an unlimited mode.
Unlimited mode is the same format, but the user can generate a new set of 12 questions as many times as they want, and they are all pulled randomly from the database question pool.

Uses:

TypeScript, Supabase PostregSQL, Vercel, HTML/CSS, Python for web-scraping jeopardy archives.
