import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

/**
 * Command x Bento tokens — kept in CSS variables (see app/globals.css) and
 * surfaced to Tailwind here so utilities like `bg-surface` / `text-muted`
 * map to the same design system as the mockups in /mockups/final.
 *
 * shadcn-style components (components/ui/*) are themed with these same tokens
 * plus the `cn()` helper + CVA, rather than shadcn's default palette — so the
 * component layer inherits the brand instead of looking stock.
 */
export default {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        'surface-hover': 'var(--surface-hover)',
        border: 'var(--border)',
        'border-strong': 'var(--border-strong)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        subtle: 'var(--subtle)',

        primary: 'var(--primary)',
        'primary-hover': 'var(--primary-hover)',
        'primary-soft': 'var(--primary-soft)',
        'primary-soft-fg': 'var(--primary-soft-fg)',
        'primary-fg': 'var(--primary-fg)',

        teal: 'var(--teal)',
        'teal-soft': 'var(--teal-soft)',
        amber: 'var(--amber)',
        'amber-soft': 'var(--amber-soft)',
        'amber-fg': 'var(--amber-fg)',
        rose: 'var(--rose)',
        'rose-soft': 'var(--rose-soft)',
        'rose-fg': 'var(--rose-fg)',
        sky: 'var(--sky)',
        'sky-soft': 'var(--sky-soft)',
        'sky-fg': 'var(--sky-fg)',
        violet: 'var(--violet)',
        'violet-soft': 'var(--violet-soft)',

        success: 'var(--success)',
        'success-soft': 'var(--success-soft)',
        'success-fg': 'var(--success-fg)',
        danger: 'var(--danger)',
        'danger-soft': 'var(--danger-soft)',
        'danger-fg': 'var(--danger-fg)',

        // shadcn-compat aliases (map onto Bento so ported components inherit brand)
        ring: 'var(--primary)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', '"Space Grotesk"', 'Inter', 'sans-serif'],
        mono: ['var(--font-mono)', '"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        lg: '12px',
        xl: '14px',
        '2xl': '18px',
        '3xl': '24px',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow)',
        lg: 'var(--shadow-lg)',
        glow: 'var(--shadow-glow)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(91,91,240,0.35)' },
          '70%': { boxShadow: '0 0 0 12px rgba(91,91,240,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(91,91,240,0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.16,1,0.3,1) both',
        'fade-in': 'fade-in 0.5s ease both',
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
        'pulse-ring': 'pulse-ring 2.2s ease-out infinite',
      },
    },
  },
  plugins: [animate],
} satisfies Config;
