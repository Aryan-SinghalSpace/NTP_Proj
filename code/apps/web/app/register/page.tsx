import Link from 'next/link';
import { AuthShell } from '../../components/AuthShell';
import { SsoButtons } from '../../components/auth/SsoButtons';
import { Field, Input, Checkbox, OrDivider } from '../../components/ui/input';
import { PasswordInput } from '../../components/ui/password-input';
import { buttonVariants } from '../../components/ui/button';
import { cn } from '../../lib/utils';
import { MailIcon, BuildingIcon, ArrowRightIcon } from '../../components/icons';

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Start assembling your traceability workspace."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <SsoButtons />
      <OrDivider label="or register with email" />

      <form className="space-y-1">
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" htmlFor="first">
            <Input id="first" placeholder="Asha" />
          </Field>
          <Field label="Last name" htmlFor="last">
            <Input id="last" placeholder="Rao" />
          </Field>
        </div>

        <Field label="Work email" htmlFor="email">
          <Input
            id="email"
            type="email"
            placeholder="you@acme.com"
            leadingIcon={<MailIcon width={16} height={16} />}
          />
        </Field>

        <Field label="Organisation" htmlFor="org">
          <Input
            id="org"
            placeholder="Acme Foods Pvt Ltd"
            leadingIcon={<BuildingIcon width={16} height={16} />}
          />
        </Field>

        <Field
          label="Password"
          htmlFor="password"
          hint="Use 12+ characters with a mix of letters, numbers and symbols."
        >
          <PasswordInput id="password" placeholder="At least 12 characters" />
        </Field>

        <Checkbox id="terms" className="mb-5">
          I agree to the{' '}
          <Link href="/" className="font-semibold text-primary hover:underline">
            Terms
          </Link>{' '}
          and{' '}
          <Link href="/" className="font-semibold text-primary hover:underline">
            Privacy Policy
          </Link>
          .
        </Checkbox>

        <Link
          href="/onboarding"
          className={cn(buttonVariants({ variant: 'gradient', size: 'lg' }), 'w-full')}
        >
          Create account
          <ArrowRightIcon width={18} height={18} />
        </Link>
      </form>

      <p className="mt-5 text-center text-[12px] text-subtle">
        After verifying your email you’ll be guided through tenant onboarding.
      </p>
    </AuthShell>
  );
}
