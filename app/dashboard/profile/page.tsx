'use client'

import { useAuth } from '@/lib/auth-context'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/loading-state'
import { PageContent, PageHeader, SectionTitle } from '@/components/page-header'
import { Zap, Flame, Trophy, Target, Award, LogOut, UserRound, Check } from 'lucide-react'
import type { Database } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const { profile, user, signOut } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    totalAccuracy: 0,
    totalXp: 0,
    bestDay: 0,
  })
  const [badges, setBadges] = useState<Database['public']['Tables']['user_badges']['Row'][]>([])
  const [badgeDetails, setBadgeDetails] = useState<Database['public']['Tables']['badges']['Row'][]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !profile) return

    const loadStats = async () => {
      try {
        const { data: responses, error } = await supabase
          .from('user_quiz_responses')
          .select('is_correct, xp_earned, quiz_date')
          .eq('user_id', user.id)

        if (error) throw error

        if (responses) {
          const totalCorrect = responses.filter((r) => r.is_correct).length
          const totalAccuracy = responses.length > 0 ? Math.round((totalCorrect / responses.length) * 100) : 0

          const dailyStats = responses.reduce(
            (acc, r) => {
              if (!acc[r.quiz_date]) {
                acc[r.quiz_date] = { correct: 0, total: 0 }
              }
              acc[r.quiz_date].total += 1
              if (r.is_correct) acc[r.quiz_date].correct += 1
              return acc
            },
            {} as Record<string, { correct: number; total: number }>,
          )

          const bestDay = Math.max(...Object.values(dailyStats).map((d) => d.correct), 0)

          setStats({
            totalQuizzes: Object.keys(dailyStats).length,
            totalAccuracy,
            totalXp: profile.total_xp || 0,
            bestDay,
          })
        }

        const { data: userBadges } = await supabase.from('user_badges').select('*').eq('user_id', user.id)
        if (userBadges) setBadges(userBadges)

        const { data: allBadges } = await supabase.from('badges').select('*').limit(10)
        if (allBadges) setBadgeDetails(allBadges)
      } catch (err) {
        console.error('Failed to load stats:', err)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [user, profile])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/auth/signin')
    } catch (err) {
      console.error('Sign out failed:', err)
    }
  }

  if (loading || !profile) {
    return <LoadingState label="Loading profile…" />
  }

  const joinDate = profile.created_at ? new Date(profile.created_at) : null
  const earnedBadgeIds = new Set(badges.map((b) => b.badge_id))
  const level = Math.floor((profile.total_xp || 0) / 500) + 1
  const xpIntoLevel = (profile.total_xp || 0) % 500
  const levelProgress = Math.min(100, Math.round((xpIntoLevel / 500) * 100))

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        eyebrow="Your profile"
        title={profile.display_name ?? 'Detective'}
        description={`@${profile.username}`}
        icon={UserRound}
        tone="secondary"
      >
        <div className="flex flex-col items-stretch gap-3 sm:items-end">
          <div className="surface-card min-w-[200px] px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Level {level}</p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-secondary to-primary transition-all"
                style={{ width: `${levelProgress}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{500 - xpIntoLevel} XP to next level</p>
          </div>
          <Button variant="outline" onClick={handleSignOut} className="gap-2">
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </PageHeader>

      <PageContent>
        <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: 'Total XP', value: stats.totalXp, icon: Zap, color: 'text-accent' },
            { label: 'Quizzes', value: stats.totalQuizzes, icon: Target, color: 'text-primary' },
            { label: 'Accuracy', value: `${stats.totalAccuracy}%`, icon: Trophy, color: 'text-secondary' },
            { label: 'Streak', value: profile.current_streak || 0, icon: Flame, color: 'text-secondary' },
          ].map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="surface-card p-6">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <p className={`text-3xl font-bold tabular-nums tracking-tight ${stat.color}`}>{stat.value}</p>
              </div>
            )
          })}
        </div>

        <SectionTitle
          title="Achievements"
          description={`${badges.length} of ${badgeDetails.length || '—'} badges unlocked`}
        />
        <div className="mb-12 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {badgeDetails.map((badge) => {
            const earned = earnedBadgeIds.has(badge.id)
            return (
              <div
                key={badge.id}
                className={`relative rounded-2xl border p-4 text-center transition ${
                  earned
                    ? 'border-secondary/40 bg-secondary/5 shadow-sm'
                    : 'border-border/60 bg-muted/20 opacity-70 grayscale'
                }`}
              >
                {earned && (
                  <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                )}
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-card">
                  <Award className={`h-6 w-6 ${earned ? 'text-secondary' : 'text-muted-foreground'}`} />
                </div>
                <h3 className="text-sm font-semibold text-foreground">{badge.name}</h3>
                <p className="mt-1 text-xs leading-snug text-muted-foreground">{badge.description}</p>
              </div>
            )
          })}
        </div>

        <SectionTitle title="Account" />
        <div className="surface-card divide-y divide-border/80 overflow-hidden">
          {[
            { label: 'Email', value: profile.email },
            { label: 'Username', value: `@${profile.username}` },
            {
              label: 'Member since',
              value: joinDate ? joinDate.toLocaleDateString(undefined, { dateStyle: 'long' }) : 'Recently',
            },
            { label: 'Best day score', value: `${stats.bestDay} correct answers` },
          ].map((row) => (
            <div key={row.label} className="flex flex-col gap-1 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium text-muted-foreground">{row.label}</p>
              <p className="text-sm font-semibold text-foreground">{row.value}</p>
            </div>
          ))}
        </div>
      </PageContent>
    </div>
  )
}
