import Link from 'next/link'
import Image from 'next/image'
import { Shield, Sparkles, Trophy } from 'lucide-react'

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <main className="min-h-screen grid lg:grid-cols-2 bg-background">
      <section className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#1e3a8a] via-primary to-secondary p-12 text-primary-foreground">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.35) 0%, transparent 45%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.2) 0%, transparent 40%)',
          }}
        />
        <div className="relative z-10">
          <Link href="/auth/signin" className="inline-flex items-center gap-3">
            <div className="h-11 w-11 overflow-hidden rounded-xl ring-1 ring-white/25">
              <Image
                src="/ofc.jpg"
                alt="Spot the Bot logo"
                width={88}
                height={88}
                priority
                className="h-full w-full object-cover"
              />
            </div>
            <span className="text-xl font-semibold tracking-tight">Spot the Bot</span>
          </Link>
        </div>
        <div className="relative z-10 max-w-md space-y-8">
          <div>
            <p className="mb-3 text-sm font-medium uppercase tracking-widest text-white/70">
              UNESCO media literacy
            </p>
            <h2 className="text-4xl font-bold leading-tight tracking-tight">
              Train your eye to spot AI in five minutes a day.
            </h2>
          </div>
          <ul className="space-y-4 text-sm text-white/90">
            <li className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-white/80" />
              Daily quizzes with real vs AI-generated content
            </li>
            <li className="flex items-start gap-3">
              <Shield className="mt-0.5 h-5 w-5 shrink-0 text-white/80" />
              Image inspector with forensic-style feedback
            </li>
            <li className="flex items-start gap-3">
              <Trophy className="mt-0.5 h-5 w-5 shrink-0 text-white/80" />
              XP, streaks, and leaderboard competition
            </li>
          </ul>
        </div>
        <p className="relative z-10 text-xs text-white/60">Built for curious minds. Play responsibly.</p>
      </section>

      <section className="flex flex-col justify-center p-6 sm:p-10 lg:p-14">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden text-center">
            <div className="mx-auto mb-4 h-12 w-12 overflow-hidden rounded-xl ring-1 ring-primary/20">
              <Image
                src="/ofc.jpg"
                alt="Spot the Bot logo"
                width={96}
                height={96}
                priority
                className="h-full w-full object-cover"
              />
            </div>
            <p className="text-sm font-semibold text-primary">Spot the Bot</p>
          </div>
          <div className="rounded-2xl border border-border/80 bg-card/80 p-8 shadow-xl shadow-primary/5 backdrop-blur-sm">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-6 h-28 w-28 overflow-hidden rounded-2xl ring-1 ring-primary/20 shadow-lg shadow-primary/10">
                <Image
                  src="/ofc.jpg"
                  alt="Spot the Bot logo"
                  width={224}
                  height={224}
                  priority
                  className="h-full w-full object-cover"
                />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
              <p className="mt-2 text-muted-foreground">{subtitle}</p>
            </div>
            {children}
          </div>
        </div>
      </section>
    </main>
  )
}
