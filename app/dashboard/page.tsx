'use client'

import { useAuth } from '@/lib/auth-context'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Zap, Flame, Trophy, Target, Award, BookOpen, ArrowRight } from 'lucide-react'
import type { Database } from '@/lib/supabase'

export default function DashboardPage() {
  const { profile, user } = useAuth()
  const [playedToday, setPlayedToday] = useState(false)
  const [todayScore, setTodayScore] = useState<{
    correct: number
    total: number
    xp: number
  } | null>(null)
  const [badges, setBadges] = useState<Database['public']['Tables']['badges']['Row'][]>([])

  useEffect(() => {
    if (!user) return

    const checkTodayProgress = async () => {
      const today = new Date().toISOString().split('T')[0]

      const { data: responses } = await supabase
        .from('user_quiz_responses')
        .select('is_correct, xp_earned')
        .eq('user_id', user.id)
        .eq('quiz_date', today)

      if (responses && responses.length > 0) {
        const correct = responses.filter((r) => r.is_correct).length
        setPlayedToday(true)
        setTodayScore({
          correct,
          total: responses.length,
          xp: responses.reduce((sum, r) => sum + r.xp_earned, 0),
        })
      }
    }

    const fetchBadges = async () => {
      const { data } = await supabase.from('badges').select('*').limit(6)
      if (data) setBadges(data)
    }

    checkTodayProgress()
    fetchBadges()
  }, [user])

  return (
    <div className="flex flex-1 flex-col">
      <section className="relative overflow-hidden border-b border-border/80">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-secondary/10" />
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:py-14">
          <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary">Daily training</p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Welcome back, {profile?.display_name}
          </h1>
          <p className="mt-2 max-w-xl text-lg text-muted-foreground">
            Sharpen your instincts with today&apos;s quiz and keep your streak alive.
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-10">
        <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="surface-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">Total XP</h3>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent">
                <Zap className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-bold tabular-nums tracking-tight text-primary">{profile?.total_xp || 0}</p>
            <p className="mt-1 text-sm text-muted-foreground">Lifetime points</p>
          </div>

          <div className="surface-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">Current streak</h3>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/15 text-secondary">
                <Flame className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-bold tabular-nums tracking-tight text-secondary">{profile?.current_streak || 0}</p>
            <p className="mt-1 text-sm text-muted-foreground">Days in a row</p>
          </div>

          <div className="surface-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">Best streak</h3>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Trophy className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-bold tabular-nums tracking-tight text-foreground">{profile?.longest_streak || 0}</p>
            <p className="mt-1 text-sm text-muted-foreground">Personal record</p>
          </div>

          <div className="surface-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">Today&apos;s score</h3>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Target className="h-5 w-5" />
              </div>
            </div>
            {playedToday && todayScore ? (
              <>
                <p className="text-3xl font-bold tabular-nums tracking-tight text-primary">
                  {todayScore.correct}/{todayScore.total}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">+{todayScore.xp} XP earned</p>
              </>
            ) : (
              <>
                <p className="text-3xl font-bold text-muted-foreground/50">—</p>
                <p className="mt-1 text-sm text-muted-foreground">Not played yet</p>
              </>
            )}
          </div>
        </div>

        {!playedToday && (
          <div className="relative mb-10 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary to-secondary p-8 text-primary-foreground shadow-lg shadow-primary/20">
            <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Today&apos;s challenge is ready</h2>
                <p className="mt-2 max-w-lg text-primary-foreground/90">
                  Complete five quick questions to earn XP and protect your streak.
                </p>
              </div>
              <Link href="/dashboard/arena" className="shrink-0">
                <Button size="lg" className="h-11 gap-2 bg-white text-primary hover:bg-white/90">
                  Start quiz
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        )}

        <section className="mb-10">
          <div className="mb-5 flex items-end justify-between gap-4">
            <h2 className="text-xl font-bold tracking-tight text-foreground">Achievements</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6 lg:gap-4">
            {badges.map((badge) => (
              <div key={badge.id} className="surface-card p-4 text-center">
                <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-accent">
                  <Award className="h-6 w-6" />
                </div>
                <h3 className="mb-1 text-sm font-semibold text-foreground">{badge.name}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">{badge.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link href="/dashboard/arena" className="group block">
            <div className="surface-card h-full p-6 group-hover:border-primary/40">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground">Play arena</h3>
              <p className="mt-1 text-sm text-muted-foreground">Daily quiz &amp; image inspector</p>
            </div>
          </Link>
          <Link href="/dashboard/leaderboard" className="group block">
            <div className="surface-card h-full p-6 group-hover:border-secondary/40">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                <Trophy className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground">Leaderboard</h3>
              <p className="mt-1 text-sm text-muted-foreground">See top detectives</p>
            </div>
          </Link>
          <Link href="/dashboard/guide" className="group block">
            <div className="surface-card h-full p-6 group-hover:border-accent/40">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <BookOpen className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground">Guide</h3>
              <p className="mt-1 text-sm text-muted-foreground">Tips for spotting AI</p>
            </div>
          </Link>
        </section>
      </div>
    </div>
  )
}
