import * as React from 'react';
import { cn } from '../../lib/utils';

const inputBase =
  'h-11 w-full rounded-xl border border-border-strong bg-surface px-3.5 text-sm text-text ' +
  'placeholder:text-subtle outline-none transition-shadow duration-150 ' +
  'focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:opacity-60';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leadingIcon?: React.ReactNode;
  trailing?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, leadingIcon, trailing, ...props }, ref) => {
    if (leadingIcon || trailing) {
      return (
        <div className="relative">
          {leadingIcon && (
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle">
              {leadingIcon}
            </span>
          )}
          <input
            ref={ref}
            className={cn(inputBase, leadingIcon && 'pl-11', trailing && 'pr-11', className)}
            {...props}
          />
          {trailing && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</span>
          )}
        </div>
      );
    }
    return <input ref={ref} className={cn(inputBase, className)} {...props} />;
  },
);
Input.displayName = 'Input';

export const Label = ({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={cn('block text-[12.5px] font-semibold text-muted', className)} {...props} />
);

/** Label + control + hint, with consistent spacing. */
export function Field({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label?: string;
  htmlFor?: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-4', className)}>
      {label && (
        <Label htmlFor={htmlFor} className="mb-1.5">
          {label}
        </Label>
      )}
      {children}
      {hint && <p className="mt-1.5 text-[11.5px] leading-snug text-subtle">{hint}</p>}
    </div>
  );
}

export function Checkbox({
  id,
  children,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { children?: React.ReactNode }) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex cursor-pointer select-none items-start gap-2.5 text-[12.5px] text-muted',
        className,
      )}
    >
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 h-4 w-4 flex-none rounded border-border-strong accent-[var(--primary)]"
        {...props}
      />
      {children && <span>{children}</span>}
    </label>
  );
}

export function OrDivider({ label = 'or' }: { label?: string }) {
  return (
    <div className="my-5 flex items-center gap-3 text-[12px] font-medium text-subtle">
      <span className="h-px flex-1 bg-border" />
      {label}
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
