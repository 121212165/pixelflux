import { cn } from '@/lib/utils'
import type { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'hover' | 'highlighted'
}

export function Card({
  className,
  variant = 'default',
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border p-6 transition-all duration-200 ease-out',
        variant === 'default' &&
          'bg-surface-elevated border-border-subtle',
        variant === 'hover' &&
          'bg-surface-elevated border-border-default hover:shadow-lg hover:-translate-y-0.5',
        variant === 'highlighted' &&
          'bg-surface-elevated border-border-focus shadow-lg',
        className,
      )}
      {...props}
    />
  )
}

export function CardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1.5', className)} {...props} />
}

export function CardTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-h4 font-semibold text-text-primary', className)}
      {...props}
    />
  )
}

export function CardDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-body text-text-secondary', className)} {...props} />
  )
}

export function CardContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('pt-4', className)} {...props} />
}
