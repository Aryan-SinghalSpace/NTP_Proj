import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import { OutboxWatcher } from '../components/OutboxWatcher';

// Loaded once, self-hosted by Next at build time — no render-blocking CSS import,
// no layout shift. Each exposes a CSS variable consumed by tailwind.config.ts.
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Strings — Configurable Dynamic Traceability Platform',
  description:
    'Assemble a complete traceability solution for any customer — identity, workflows, labels and recall — without writing code.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans antialiased">
        {children}
        <OutboxWatcher />
      </body>
    </html>
  );
}
