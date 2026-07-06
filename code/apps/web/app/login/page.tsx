import Link from 'next/link';
import { AuthShell } from '../../components/AuthShell';
import { SsoButtons } from '../../components/auth/SsoButtons';
import { Field, Input, Checkbox, OrDivider } from '../../components/ui/input';
import { PasswordInput } from '../../components/ui/password-input';
import { buttonVariants } from '../../components/ui/button';
import { cn } from '../../lib/utils';
import { MailIcon, KeyIcon, ArrowRightIcon } from '../../components/icons';

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your Strings workspace."
      footer={
        <>
          New here?{' '}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <SsoButtons />
      <OrDivider label="or sign in with email" />

      <form className="space-y-1">
        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            type="email"
            placeholder="you@acme.com"
            leadingIcon={<MailIcon width={16} height={16} />}
          />
        </Field>

        <Field label="Password" htmlFor="password">
          <PasswordInput
            id="password"
            placeholder="••••••••"
            leadingIcon={<KeyIcon width={16} height={16} />}
          />
        </Field>

        <div className="flex items-center justify-between pb-2 pt-1">
          <Checkbox id="keep" defaultChecked>
            Keep me signed in
          </Checkbox>
          <Link href="/forgot-password" className="text-[12.5px] font-semibold text-primary hover:underline">
            Forgot password?
          </Link>
        </div>

        <Link
          href="/dashboard"
          className={cn(buttonVariants({ variant: 'gradient', size: 'lg' }), 'w-full')}
        >
          Sign in
          <ArrowRightIcon width={18} height={18} />
        </Link>
      </form>

      <p className="mt-5 text-center text-[12px] text-subtle">
        Single sign-on is configured per tenant.
      </p>
    </AuthShell>
  );
}
