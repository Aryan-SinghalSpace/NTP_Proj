import Link from 'next/link';
import { AuthShell } from '../../components/AuthShell';
import { MailIcon, ChevronLeftIcon } from '../../components/icons';

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll email you a secure link to set a new one."
      footer={
        <Link href="/login" className="inline-flex items-center gap-1.5 font-semibold text-primary">
          <ChevronLeftIcon width={15} height={15} />
          Back to sign in
        </Link>
      }
    >
      <form>
        <div className="field">
          <label>Email</label>
          <input className="input" type="email" placeholder="you@acme.com" />
        </div>

        <Link
          href="/login"
          className="btn-bd primary"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          <MailIcon />
          Send reset link
        </Link>

        <p className="help mt-4">
          If an account exists for that address, a reset link will arrive within a few minutes.
          Check your spam folder if you don&apos;t see it.
        </p>
      </form>
    </AuthShell>
  );
}
