import Link from 'next/link';
import { AuthShell } from '../../components/AuthShell';
import { Field, Input } from '../../components/ui/input';
import { buttonVariants } from '../../components/ui/button';
import { cn } from '../../lib/utils';
import { MailIcon, ArrowLeftIcon } from '../../components/icons';

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset your password"
      subtitle="We’ll email you a secure link to set a new one."
      footer={
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
        >
          <ArrowLeftIcon width={15} height={15} />
          Back to sign in
        </Link>
      }
    >
      <form className="space-y-1">
        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            type="email"
            placeholder="you@acme.com"
            leadingIcon={<MailIcon width={16} height={16} />}
          />
        </Field>

        <Link
          href="/login"
          className={cn(buttonVariants({ variant: 'gradient', size: 'lg' }), 'w-full')}
        >
          <MailIcon width={18} height={18} />
          Send reset link
        </Link>
      </form>

      <p className="mt-5 text-[12px] leading-relaxed text-subtle">
        If an account exists for that address, a reset link will arrive within a few minutes. Check
        your spam folder if you don’t see it.
      </p>
    </AuthShell>
  );
}
