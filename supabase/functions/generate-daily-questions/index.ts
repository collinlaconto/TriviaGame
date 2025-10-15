// supabase/functions/generate-daily-questions/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

serve(async () => {
  try {
    const today = new Date().toISOString().split('T')[0]

    // 1. Check if today's game exists
    const { data: existingGame } = await supabase
      .from('daily_games')
      .select('id')
      .eq('game_date', today)
      .single()

    let gameId = existingGame?.id

    if (!gameId) {
      const { data: newGame, error: insertError } = await supabase
        .from('daily_games')
        .insert({ game_date: today })
        .select('id')
        .single()
      if (insertError) throw insertError
      gameId = newGame.id
    }

    // 2. Get all questions, choose 9 random
    const { data: questions, error: qError } = await supabase
      .from('questions')
      .select('id')
    if (qError) throw qError

    const selected = questions
      .sort(() => Math.random() - 0.5)
      .slice(0, 9)

    // 3. Insert into daily_questions
    const inserts = selected.map(q => ({
      daily_game_id: gameId,
      question_id: q.id,
    }))

    const { error: dqError } = await supabase
      .from('daily_questions')
      .insert(inserts)
    if (dqError) throw dqError

    return new Response(
      JSON.stringify({ message: 'Daily questions generated', gameId }),
      { status: 200 }
    )
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
