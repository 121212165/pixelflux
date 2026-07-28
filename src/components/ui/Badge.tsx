import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2 py-0.5 text-caption font-medium',
  {
    variants: {
      variant: {
        default: 'bg-primary-500/15 text-primary-500',
        success: 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500',
        warning: 'bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-500',
        error: 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500',
        info: 'bg-info-50 text-info-600 dark:bg-info-500/15 dark:text-info-500',
        neutral: 'bg-neutral-100 text-text-secondary dark:bg-neutral-800',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}
