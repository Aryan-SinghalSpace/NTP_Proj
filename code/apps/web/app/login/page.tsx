import Link from 'next/link';
import { AuthShell } from '../../components/AuthShell';
import { LogInIcon, MailIcon, KeyIcon } from '../../components/icons';

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your Strings workspace."
      footer={
        <>
          New here?{' '}
          <Link href="/register" className="font-semibold text-primary">
            Create an account
          </Link>{' '}
          ·{' '}
          <Link href="/forgot-password" className="text-primary">
            Forgot password?
          </Link>
        </>
      }
    >
      <form>
        {/* SSO */}
        <Link
          href="/dashboard"
          className="btn-bd"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          <LogInIcon />
          Continue with SSO
        </Link>

        {/* or divider */}
        <div className="my-5 flex items-center gap-3 text-[12px] text-subtle">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="field">
          <label>Email</label>
          <input className="input" type="email" placeholder="you@acme.com" />
        </div>

        <div className="field">
          <label>Password</label>
          <input className="input" type="password" placeholder="••••••••" />
        </div>

        <div className="mb-5 flex items-center justify-between text-[12.5px] text-muted">
          <label className="inline-flex items-center gap-2 font-medium">
            <input type="checkbox" className="h-3.5 w-3.5 accent-[var(--primary)]" />
            Keep me signed in
          </label>
          <Link href="/forgot-password" className="font-semibold text-primary">
            Forgot?
          </Link>
        </div>

        <Link
          href="/dashboard"
          className="btn-bd primary"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          <KeyIcon />
          Sign in
        </Link>

        <p className="help mt-4 flex items-center gap-1.5">
          <MailIcon width={14} height={14} />
          Single sign-on is configured per tenant.
        </p>
      </form>
    </AuthShell>
  );
}
