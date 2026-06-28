import type { Config } from 'tailwindcss';

/**
 * Command x Bento tokens — kept in CSS variables (see app/globals.css) and
 * surfaced to Tailwind here so utilities like `bg-surface` / `text-muted`
 * map to the same design system as the mockups in /mockups/final.
 */
export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        border: 'var(--border)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        subtle: 'var(--subtle)',
        primary: 'var(--primary)',
        'primary-soft': 'var(--primary-soft)',
        'primary-fg': 'var(--primary-fg)',
        teal: 'var(--teal)',
        amber: 'var(--amber)',
        rose: 'var(--rose)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        xl: '14px',
        '2xl': '18px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
} satisfies Config;
