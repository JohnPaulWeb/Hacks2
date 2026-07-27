'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { checkUsernameAvailable } from '@/lib/auth'
import { AuthShell } from '@/components/auth-shell'

const inputClassName =
  'w-full rounded-lg border border-border bg-background/80 px-4 py-2.5 text-foreground shadow-sm transition placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50'

export default function SignUpPage() {
  const router = useRouter()
  const { signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)

  const handleUsernameChange = async (value: string) => {
    setUsername(value)
    if (value.length < 3) {
      setUsernameAvailable(null)
      return
    }

    setChecking(true)
    try {
      const available = await checkUsernameAvailable(value)
      setUsernameAvailable(available)
    } finally {
      setChecking(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (usernameAvailable === false) {
      setError('Username is not available')
      return
    }

    setLoading(true)

    try {
      await signUp(email, password, username)
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign up')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Create your account" subtitle="Join detectives learning to spot AI-generated content">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClassName}
            placeholder="you@example.com"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => handleUsernameChange(e.target.value)}
            className={`${inputClassName} ${
              usernameAvailable === true
                ? 'border-emerald-500/60 focus:ring-emerald-500/30'
                : usernameAvailable === false
                  ? 'border-destructive/60 focus:ring-destructive/30'
                  : ''
            }`}
            placeholder="your_username"
            minLength={3}
            required
          />
          {checking && <p className="mt-1.5 text-xs text-muted-foreground">Checking availability…</p>}
          {usernameAvailable === true && <p className="mt-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">Username available</p>}
          {usernameAvailable === false && <p className="mt-1.5 text-xs font-medium text-destructive">Username taken</p>}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClassName}
            placeholder="••••••••"
            minLength={6}
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">Confirm password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={inputClassName}
            placeholder="••••••••"
            minLength={6}
            required
          />
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Button type="submit" disabled={loading || usernameAvailable === false} size="lg" className="h-11 w-full text-base">
          {loading ? 'Creating account…' : 'Sign up'}
        </Button>
      </form>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/auth/signin" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </div>
    </AuthShell>
  )
}
