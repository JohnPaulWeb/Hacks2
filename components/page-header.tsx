import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type PageHeaderTone = 'primary' | 'secondary' | 'accent' | 'neutral'

const toneStyles: Record<
  PageHeaderTone,
  { wash: string; icon: string; eyebrow: string }
> = {
  primary: {
    wash: 'from-primary/12 via-transparent to-secondary/8',
    icon: 'bg-primary/12 text-primary ring-primary/20',
    eyebrow: 'text-primary',
  },
  secondary: {
    wash: 'from-secondary/12 via-transparent to-primary/6',
    icon: 'bg-secondary/12 text-secondary ring-secondary/20',
    eyebrow: 'text-secondary',
  },
  accent: {
    wash: 'from-accent/12 via-transparent to-primary/6',
    icon: 'bg-accent/12 text-accent ring-accent/25',
    eyebrow: 'text-accent',
  },
  neutral: {
    wash: 'from-muted/80 via-transparent to-transparent',
    icon: 'bg-muted text-foreground ring-border',
    eyebrow: 'text-muted-foreground',
  },
}

export function PageHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  tone = 'primary',
  children,
  className,
}: {
  eyebrow?: string
  title: string
  description?: string
  icon?: LucideIcon
  tone?: PageHeaderTone
  children?: React.ReactNode
  className?: string
}) {
  const styles = toneStyles[tone]

  return (
    <section className={cn('relative overflow-hidden border-b border-border/80', className)}>
      <div className={cn('absolute inset-0 bg-gradient-to-br', styles.wash)} />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, color-mix(in oklab, var(--foreground) 6%, transparent) 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />
      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:py-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            {eyebrow && (
              <p className={cn('mb-2 text-xs font-semibold uppercase tracking-[0.2em]', styles.eyebrow)}>
                {eyebrow}
              </p>
            )}
            <div className="flex items-start gap-4">
              {Icon && (
                <div
                  className={cn(
                    'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1',
                    styles.icon,
                  )}
                >
                  <Icon className="h-6 w-6" strokeWidth={2} />
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{title}</h1>
                {description && <p className="mt-2 text-base text-muted-foreground sm:text-lg">{description}</p>}
              </div>
            </div>
          </div>
          {children && <div className="shrink-0">{children}</div>}
        </div>
      </div>
    </section>
  )
}

export function PageContent({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn('mx-auto w-full max-w-7xl flex-1 px-4 py-10', className)}>{children}</div>
}

export function SectionTitle({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
    </div>
  )
}
