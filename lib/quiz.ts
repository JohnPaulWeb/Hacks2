import { supabase } from './supabase'
import type { Database } from './supabase'

export async function getTodayQuiz() {
  const today = new Date().toISOString().split('T')[0]

  const { data: quizData, error: quizError } = await supabase
    .from('daily_quizzes')
    .select('id')
    .eq('quiz_date', today)
    .single()

  if (quizError && quizError.code !== 'PGRST116') throw quizError

  if (!quizData) {
    // Create today's quiz if it doesn't exist
    const { data: newQuiz, error: createError } = await supabase
      .from('daily_quizzes')
      .insert({ quiz_date: today })
      .select()
      .single()

    if (createError) throw createError
    return newQuiz
  }

  return quizData
}

export async function getTodayQuestions() {
  const quiz = await getTodayQuiz()
  if (!quiz || !quiz.id) return []

  const { data: questions, error: questionsError } = await supabase
    .from('quiz_questions')
    .select('*')
    .eq('quiz_id', quiz.id)
    .order('question_order', { ascending: true })

  if (questionsError) throw questionsError
  return (questions || []) as Database['public']['Tables']['quiz_questions']['Row'][]
}

export async function submitQuizAnswer(
  userId: string,
  questionId: string,
  userAnswer: 'human' | 'ai'
) {
  const today = new Date().toISOString().split('T')[0]

  // Get the question to check if answer is correct
  const { data: question, error: questionError } = await supabase
    .from('quiz_questions')
    .select('correct_answer')
    .eq('id', questionId)
    .single()

  if (questionError) throw questionError

  const isCorrect = question.correct_answer === userAnswer
  const xpEarned = isCorrect ? 10 : 0 // Base XP for correct answer

  // Insert the response
  const { data: response, error: responseError } = await supabase
    .from('user_quiz_responses')
    .upsert(
      {
        user_id: userId,
        quiz_date: today,
        question_id: questionId,
        user_answer: userAnswer,
        is_correct: isCorrect,
        xp_earned: xpEarned,
      },
      { onConflict: 'user_id,quiz_date,question_id' }
    )
    .select()
    .single()

  if (responseError) throw responseError

  return {
    response,
    correct: isCorrect,
    xpEarned,
  }
}

export async function getUserQuizProgress(userId: string) {
  const today = new Date().toISOString().split('T')[0]

  const { data: responses, error } = await supabase
    .from('user_quiz_responses')
    .select('*')
    .eq('user_id', userId)
    .eq('quiz_date', today)

  if (error) throw error

  return responses as Database['public']['Tables']['user_quiz_responses']['Row'][]
}

export async function getQuizResult(userId: string) {
  const today = new Date().toISOString().split('T')[0]

  const { data: responses, error } = await supabase
    .from('user_quiz_responses')
    .select('*, quiz_questions:question_id(*)')
    .eq('user_id', userId)
    .eq('quiz_date', today)

  if (error) throw error

  const correct = responses.filter((r) => r.is_correct).length
  const total = responses.length
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0
  const totalXp = responses.reduce((sum, r) => sum + r.xp_earned, 0)

  return {
    correct,
    total,
    accuracy,
    totalXp,
    responses,
  }
}
