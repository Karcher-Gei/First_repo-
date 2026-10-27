import type { ButtonHTMLAttributes } from 'react';

import { cn } from './cn';

type Variant = 'primary' | 'secondary' | 'ghost';

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-ink hover:bg-brand-dark',
  secondary: 'bg-ink text-white hover:bg-ink/90',
  ghost: 'bg-transparent text-ink hover:bg-surface-muted',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = 'primary', className, type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-card px-5 py-2.5 text-sm font-semibold uppercase tracking-wide transition-colors disabled:opacity-50',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
