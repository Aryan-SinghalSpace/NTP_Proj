import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

/**
 * Bento-themed button. shadcn structure (CVA + cn) but branded with our tokens.
 * Use <Button> for actions; use `buttonVariants({...})` as a className on <Link>
 * for navigation (avoids needing Radix Slot).
 */
export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold ' +
    'transition-all duration-150 outline-none focus-visible:ring-4 focus-visible:ring-primary/25 ' +
    'disabled:pointer-events-none disabled:opacity-50 active:translate-y-px select-none',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-primary-fg shadow-[0_10px_24px_-10px_rgba(91,91,240,0.7)] ' +
          'hover:bg-primary-hover hover:-translate-y-0.5',
        gradient:
          'brand-grad text-white shadow-[0_12px_28px_-12px_rgba(91,91,240,0.7)] ' +
          'hover:-translate-y-0.5 hover:brightness-[1.04]',
        secondary:
          'bg-surface text-text border border-border-strong shadow-sm ' +
          'hover:bg-surface-hover hover:-translate-y-0.5',
        ghost: 'bg-transparent text-text hover:bg-surface-hover',
        soft: 'bg-primary-soft text-primary-soft-fg hover:brightness-[0.98]',
        link: 'text-primary underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        sm: 'h-9 rounded-lg px-3.5 text-[13px]',
        md: 'h-11 rounded-xl px-5 text-sm',
        lg: 'h-[52px] rounded-2xl px-7 text-[15px]',
        icon: 'h-10 w-10 rounded-xl',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = 'Button';
