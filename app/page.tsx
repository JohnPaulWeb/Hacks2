'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

export default function Page() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard')
      } else {
        router.push('/auth/signin')
      }
    }
  }, [user, loading, router])

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="text-center">
        <div className="mx-auto mb-6 overflow-hidden rounded-2xl ring-1 ring-primary/20">
          <Image
            src="/ofc.jpg"
            alt="Spot the Bot"
            width={112}
            height={112}
            priority
            className="h-28 w-28 object-cover"
          />
        </div>
        <div className="text-2xl font-bold tracking-tight text-foreground">Spot the Bot</div>
        <p className="mt-2 text-sm text-muted-foreground">Loading your session…</p>
      </div>
    </main>
  )
}
