import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button, buttonVariants } from './button';

describe('<Button>', () => {
  it('renders its children as an accessible button', () => {
    render(<Button>Save changes</Button>);
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
  });

  it('forwards native props (disabled) and fires onClick', () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Go
      </Button>,
    );
    const btn = screen.getByRole('button', { name: 'Go' });
    expect(btn).toBeDisabled();
    btn.click();
    expect(onClick).not.toHaveBeenCalled(); // disabled → no click
  });

  it('applies variant + size classes via CVA', () => {
    render(
      <Button variant="gradient" size="lg">
        Publish
      </Button>,
    );
    const btn = screen.getByRole('button', { name: 'Publish' });
    expect(btn.className).toContain('brand-grad');
    // and buttonVariants is usable standalone (for <Link> navigation)
    expect(buttonVariants({ variant: 'ghost' })).toContain('bg-transparent');
  });
});
