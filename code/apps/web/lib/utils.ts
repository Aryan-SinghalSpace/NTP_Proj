import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge conditional class names and de-dupe conflicting Tailwind utilities.
 * The standard shadcn/ui helper — `cn('px-2', cond && 'px-4')` → `px-4`.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
