import Link from 'next/link';
import { buttonVariants } from '../ui/button';
import { cn } from '../../lib/utils';
import { GoogleIcon, MicrosoftIcon } from '../icons';

/**
 * Google + Microsoft SSO buttons (PRD §11 auth). Links to /dashboard as a
 * stand-in until real OIDC replaces the header auth.
 */
export function SsoButtons() {
  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      <Link
        href="/dashboard"
        className={cn(buttonVariants({ variant: 'secondary', size: 'md' }), 'w-full')}
      >
        <GoogleIcon />
        Google
      </Link>
      <Link
        href="/dashboard"
        className={cn(buttonVariants({ variant: 'secondary', size: 'md' }), 'w-full')}
      >
        <MicrosoftIcon />
        Microsoft
      </Link>
    </div>
  );
}
