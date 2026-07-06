import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap',
  {
    variants: {
      variant: {
        neutral: 'bg-surface-2 text-muted border border-border',
        primary: 'bg-primary-soft text-primary-soft-fg',
        teal: 'bg-teal-soft text-teal',
        amber: 'bg-amber-soft text-amber-fg',
        rose: 'bg-rose-soft text-rose-fg',
        success: 'bg-success-soft text-success-fg',
        outline: 'border border-border-strong text-muted',
      },
      size: {
        sm: 'h-[22px] px-2.5 text-[11px]',
        md: 'h-7 px-3 text-xs',
      },
    },
    defaultVariants: { variant: 'neutral', size: 'sm' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = ({ className, variant, size, ...props }: BadgeProps) => (
  <span className={cn(badgeVariants({ variant, size }), className)} {...props} />
);
