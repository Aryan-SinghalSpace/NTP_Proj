'use client';

import * as React from 'react';
import { Input, type InputProps } from './input';
import { EyeIcon, EyeOffIcon } from '../icons';

/** Password field with a show/hide toggle. */
export const PasswordInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ leadingIcon, ...props }, ref) => {
    const [show, setShow] = React.useState(false);
    return (
      <Input
        ref={ref}
        type={show ? 'text' : 'password'}
        leadingIcon={leadingIcon}
        trailing={
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Hide password' : 'Show password'}
            className="grid h-8 w-8 place-items-center rounded-lg text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            {show ? <EyeOffIcon width={16} height={16} /> : <EyeIcon width={16} height={16} />}
          </button>
        }
        {...props}
      />
    );
  },
);
PasswordInput.displayName = 'PasswordInput';
