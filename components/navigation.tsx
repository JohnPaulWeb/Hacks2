'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Zap, Trophy, LogOut, Home, BookOpen, ScanSearch } from 'lucide-react'

const navLinks = [
  { href: '/dashboard', label: 'Home', icon: Home, exact: true },
  { href: '/dashboard/arena', label: 'Arena', icon: Zap, exact: false },
  { href: '/dashboard/leaderboard', label: 'Leaderboard', icon: Trophy, exact: false },
  { href: '/dashboard/guide', label: 'Guide', icon: BookOpen, exact: false },
]

export function Navigation() {
  const { profile, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/auth/signin')
    } catch (err) {
      console.error('Sign out failed:', err)
    }
  }

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)

  return (
    <nav className="sticky top-0 z-30 border-b border-border/80 bg-card/85 backdrop-blur-md supports-[backdrop-filter]:bg-card/70">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/dashboard" className="group flex shrink-0 items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/25 transition group-hover:scale-[1.02]">
            <ScanSearch className="h-5 w-5" strokeWidth={2.25} />
          </div>
          <div>
            <div className="text-base font-bold leading-none tracking-tight text-foreground">Spot the Bot</div>
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">AI detective</div>
          </div>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            )
          })}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-1.5 rounded-full border border-border/80 bg-muted/40 px-3 py-1.5 text-sm sm:flex">
            <Zap className="h-4 w-4 text-accent" />
            <span className="font-semibold tabular-nums text-foreground">{profile?.total_xp ?? 0}</span>
            <span className="text-xs text-muted-foreground">XP</span>
          </div>
          <Link
            href="/dashboard/profile"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-sm font-semibold text-primary-foreground ring-2 ring-background transition hover:ring-primary/30"
            title="Profile"
          >
            {profile?.display_name?.[0]?.toUpperCase() || 'U'}
          </Link>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="hidden gap-2 sm:inline-flex">
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto border-t border-border/60 px-4 py-2.5 md:hidden">
        {navLinks.map(({ href, label, exact }) => {
          const active = isActive(href, exact)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors',
                active ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground',
              )}
            >
              {label}
            </Link>
          )
        })}
        <Link
          href="/dashboard/profile"
          className={cn(
            'whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors',
            pathname === '/dashboard/profile' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground',
          )}
        >
          Profile
        </Link>
      </div>
    </nav>
  )
}
