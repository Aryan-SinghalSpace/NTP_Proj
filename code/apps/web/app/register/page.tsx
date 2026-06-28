import Link from 'next/link';
import { AuthShell } from '../../components/AuthShell';
import { UserIcon } from '../../components/icons';

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Start assembling your traceability workspace."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-primary">
            Sign in
          </Link>
        </>
      }
    >
      <form>
        <div className="grid grid-cols-2 gap-3">
          <div className="field">
            <label>First name</label>
            <input className="input" placeholder="Asha" />
          </div>
          <div className="field">
            <label>Last name</label>
            <input className="input" placeholder="Rao" />
          </div>
        </div>

        <div className="field">
          <label>Work email</label>
          <input className="input" type="email" placeholder="you@acme.com" />
        </div>

        <div className="field">
          <label>Organisation</label>
          <input className="input" placeholder="Acme Foods Pvt Ltd" />
        </div>

        <div className="field">
          <label>Password</label>
          <input className="input" type="password" placeholder="At least 12 characters" />
          <p className="help">Use 12+ characters with a mix of letters, numbers and symbols.</p>
        </div>

        <label className="mb-5 flex items-start gap-2 text-[12.5px] text-muted">
          <input type="checkbox" className="mt-0.5 h-3.5 w-3.5 accent-[var(--primary)]" />
          <span>
            I agree to the{' '}
            <Link href="/" className="font-semibold text-primary">
              Terms
            </Link>{' '}
            and{' '}
            <Link href="/" className="font-semibold text-primary">
              Privacy Policy
            </Link>
            .
          </span>
        </label>

        <Link
          href="/onboarding"
          className="btn-bd primary"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          <UserIcon />
          Create account
        </Link>

        <p className="help mt-4">
          After verifying your email you&apos;ll be guided through tenant onboarding.
        </p>
      </form>
    </AuthShell>
  );
}
