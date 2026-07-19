'use client'

import { useAuth } from '@/lib/auth-context'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getTodayQuestions, submitQuizAnswer } from '@/lib/quiz'
import { checkAndAwardBadges } from '@/lib/badges'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronRight, Zap, CheckCircle, XCircle } from 'lucide-react'
import type { Database } from '@/lib/supabase'

export default function ArenaPage() {
  const { user, profile, refreshProfile } = useAuth()
  const [questions, setQuestions] = useState<Database['public']['Tables']['quiz_questions']['Row'][]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<{ [key: string]: 'human' | 'ai' | null }>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [totalXp, setTotalXp] = useState(0)

  useEffect(() => {
    if (!user) return

    const loadQuiz = async () => {
      try {
        const quizQuestions = await getTodayQuestions()
        setQuestions(quizQuestions)

        // Initialize answers
        const initialAnswers: { [key: string]: null } = {}
        quizQuestions.forEach((q) => {
          initialAnswers[q.id] = null
        })
        setAnswers(initialAnswers)
      } catch (err) {
        console.error('Failed to load quiz:', err)
      } finally {
        setLoading(false)
      }
    }

    loadQuiz()
  }, [user])

  const currentQuestion = questions[currentIndex]

  const handleAnswer = async (answer: 'human' | 'ai') => {
    if (!user || !currentQuestion) return

    setSubmitting(true)

    try {
      const result = await submitQuizAnswer(user.id, currentQuestion.id, answer)
      const newAnswers = { ...answers, [currentQuestion.id]: answer }
      setAnswers(newAnswers)
      setTotalXp((prev) => prev + result.xpEarned)

      if (currentIndex < questions.length - 1) {
        // Move to next question
        setTimeout(() => {
          setCurrentIndex((prev) => prev + 1)
          setSubmitting(false)
        }, 500)
      } else {
        // Quiz complete
        await new Promise((resolve) => setTimeout(resolve, 500))

        const { data: responses } = await supabase
          .from('user_quiz_responses')
          .select('is_correct, xp_earned, question_id')
          .eq('user_id', user.id)
          .eq('quiz_date', new Date().toISOString().split('T')[0])

        if (responses) {
          const correct = responses.filter((r) => r.is_correct).length
          const total = responses.length
          const xp = responses.reduce((sum, r) => sum + r.xp_earned, 0)

          setResults({
            correct,
            total,
            accuracy: Math.round((correct / total) * 100),
            xp,
          })

          // Update profile
          if (profile) {
            // Calculate streak
            const today = new Date()
            const yesterday = new Date(today)
            yesterday.setDate(yesterday.getDate() - 1)
            const yesterdayStr = yesterday.toISOString().split('T')[0]

            const { data: yesterdayResponses } = await supabase
              .from('user_quiz_responses')
              .select('id')
              .eq('user_id', user.id)
              .eq('quiz_date', yesterdayStr)

            const isConsecutive = (yesterdayResponses?.length || 0) > 0

            const newStreak = isConsecutive ? profile.current_streak + 1 : 1
            const longestStreak = Math.max(newStreak, profile.longest_streak || 0)

            const { error } = await supabase
              .from('users')
              .update({
                total_xp: (profile.total_xp || 0) + xp,
                current_streak: newStreak,
                longest_streak: longestStreak,
                last_played_date: new Date().toISOString(),
              })
              .eq('id', user.id)

            if (!error) {
              await refreshProfile()
              // Check and award badges
              await checkAndAwardBadges(user.id)
            }
          }
        }

        setSubmitting(false)
      }
    } catch (err) {
      console.error('Failed to submit answer:', err)
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary mb-2">Loading Quiz...</div>
          <p className="text-muted-foreground">Preparing today&apos;s challenge</p>
        </div>
      </div>
    )
  }

  if (!questions.length) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary mb-2">Quiz Not Available</div>
          <p className="text-muted-foreground mb-6">No quiz questions for today</p>
          <Link href="/dashboard">
            <Button className="bg-primary text-primary-foreground">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (results) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-primary/5 to-background p-4">
        <div className="max-w-2xl w-full">
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <h1 className="text-4xl font-bold text-foreground mb-2">Quiz Complete!</h1>

            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-8 my-8">
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <p className="text-muted-foreground text-sm mb-2">Accuracy</p>
                  <p className="text-4xl font-bold text-primary">{results.accuracy}%</p>
                  <p className="text-muted-foreground text-sm mt-2">
                    {results.correct}/{results.total} correct
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm mb-2">XP Earned</p>
                  <p className="text-4xl font-bold text-accent flex items-center justify-center gap-2">
                    <Zap className="w-8 h-8" />
                    {results.xp}
                  </p>
                </div>
              </div>

              {results.accuracy >= 80 && (
                <div className="mb-6 p-4 bg-secondary/20 border border-secondary rounded-lg text-secondary">
                  <p className="font-semibold">Outstanding! You&apos;re crushing it!</p>
                </div>
              )}
              {results.accuracy >= 60 && results.accuracy < 80 && (
                <div className="mb-6 p-4 bg-accent/20 border border-accent rounded-lg text-accent">
                  <p className="font-semibold">Good job! Keep practicing to improve!</p>
                </div>
              )}
            </div>

            <Link href="/dashboard">
              <Button className="bg-primary text-primary-foreground w-full">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Progress Bar */}
      <div className="border-b border-border bg-card p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-foreground">
              Question {currentIndex + 1} of {questions.length}
            </p>
            <p className="text-sm text-muted-foreground">{Math.round(((currentIndex + 1) / questions.length) * 100)}%</p>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Which content is AI-generated?
            </h2>
          </div>

          {/* Two Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Option - Human */}
            <div
              className={`group cursor-pointer transition-all ${
                submitting ? 'pointer-events-none' : ''
              }`}
              onClick={() => !submitting && handleAnswer('human')}
            >
              <div
                className={`bg-card border-2 rounded-lg p-6 transition-all h-full flex flex-col ${
                  answers[currentQuestion.id] === 'human'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 rounded-full bg-secondary/20 text-secondary text-sm font-semibold">
                    OPTION A
                  </span>
                  {answers[currentQuestion.id] === 'human' && (
                    <CheckCircle className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div className="flex-1 mb-4">
                  <p className="text-foreground text-lg leading-relaxed">{currentQuestion.human_content}</p>
                </div>
                <Button
                  className="w-full bg-secondary/20 text-secondary hover:bg-secondary/30 border border-secondary/50"
                  disabled={submitting}
                >
                  {submitting && answers[currentQuestion.id] === 'human' ? 'Checking...' : 'This is Human'}
                </Button>
              </div>
            </div>

            {/* Right Option - AI */}
            <div
              className={`group cursor-pointer transition-all ${
                submitting ? 'pointer-events-none' : ''
              }`}
              onClick={() => !submitting && handleAnswer('ai')}
            >
              <div
                className={`bg-card border-2 rounded-lg p-6 transition-all h-full flex flex-col ${
                  answers[currentQuestion.id] === 'ai'
                    ? 'border-accent bg-accent/5'
                    : 'border-border hover:border-accent/50'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 rounded-full bg-accent/20 text-accent text-sm font-semibold">
                    OPTION B
                  </span>
                  {answers[currentQuestion.id] === 'ai' && (
                    <CheckCircle className="w-6 h-6 text-accent" />
                  )}
                </div>
                <div className="flex-1 mb-4">
                  <p className="text-foreground text-lg leading-relaxed">{currentQuestion.ai_content}</p>
                </div>
                <Button
                  className="w-full bg-accent/20 text-accent hover:bg-accent/30 border border-accent/50"
                  disabled={submitting}
                >
                  {submitting && answers[currentQuestion.id] === 'ai' ? 'Checking...' : 'This is AI'}
                </Button>
              </div>
            </div>
          </div>

          {/* Hints */}
          {currentQuestion.visual_flaws && currentQuestion.visual_flaws.length > 0 && (
            <div className="mt-8 p-4 bg-muted/50 rounded-lg border border-border">
              <p className="text-sm font-semibold text-foreground mb-2">Potential AI Tell:</p>
              <p className="text-sm text-muted-foreground">{currentQuestion.visual_flaws[0]}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
