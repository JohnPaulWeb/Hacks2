import { cn } from '@/lib/utils'

export function LoadingState({
  label = 'Loading…',
  hint,
  className,
}: {
  label?: string
  hint?: string
  className?: string
}) {
  return (
    <div className={cn('flex flex-1 items-center justify-center p-8', className)}>
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
      </div>
    </div>
  )
}
