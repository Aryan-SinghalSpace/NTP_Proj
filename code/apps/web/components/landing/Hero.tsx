'use client';

import Link from 'next/link';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { buttonVariants } from '../ui/button';
import { cn } from '../../lib/utils';
import { ArrowRightIcon, PlayIcon, Glyph, CheckIcon } from '../icons';

const flow = [
  { name: 'Commission', kind: 'trigger', cls: 'ic-trigger', glyph: 'scan' },
  { name: 'Validate', kind: 'validate', cls: 'ic-validate', glyph: 'validate' },
  { name: 'Generate ID', kind: 'id', cls: 'ic-id', glyph: 'genid' },
  { name: 'Record event', kind: 'record', cls: 'ic-record', glyph: 'record' },
];

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function Hero() {
  const reduce = useReducedMotion();
  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
  };
  const item: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
  };

  return (
    <section className="relative overflow-hidden px-5 pb-20 pt-32 sm:px-8 sm:pt-36">
      {/* backdrop */}
      <div className="pointer-events-none absolute inset-0 mesh" />
      <div className="pointer-events-none absolute inset-0 dotgrid opacity-40 [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)]" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
        {/* copy */}
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.div variants={item}>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3.5 py-1.5 text-[12.5px] font-semibold text-muted backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-teal" />
              Multi-tenant · No-code · GS1-aware
            </span>
          </motion.div>

          <motion.h1
            variants={item}
            className="mt-6 font-display text-[clamp(2.6rem,6vw,4.2rem)] font-bold leading-[1.04] tracking-tight"
          >
            Traceability,
            <br />
            <span className="grad-text">without the code.</span>
          </motion.h1>

          <motion.p variants={item} className="mt-6 max-w-xl text-[17px] leading-relaxed text-muted">
            Assemble a complete traceability solution for any customer — identity, product master
            data, workflows, labels and recall — configured, not coded. One platform, every tenant,
            from 100 GTINs to a million.
          </motion.p>

          <motion.div variants={item} className="mt-9 flex flex-wrap items-center gap-3">
            <Link href="/register" className={buttonVariants({ variant: 'gradient', size: 'lg' })}>
              Get started
              <ArrowRightIcon width={18} height={18} />
            </Link>
            <a href="#how" className={buttonVariants({ variant: 'secondary', size: 'lg' })}>
              <PlayIcon width={16} height={16} />
              See how it works
            </a>
          </motion.div>

          <motion.div variants={item} className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-subtle">
            {['No code required', 'Versioned & auditable', 'Tenant-isolated by design'].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5">
                <CheckIcon width={15} height={15} className="text-success" />
                {t}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* animated workflow preview */}
        <motion.div
          initial={{ opacity: 0, y: reduce ? 0 : 28, scale: reduce ? 1 : 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <div className="glass rounded-[26px] p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="brand-grad grid h-7 w-7 place-items-center rounded-lg font-display text-xs font-bold text-white">
                  S
                </span>
                <span className="font-display text-sm font-bold">Commission workflow</span>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-[11px] font-bold text-success-fg">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
                Live
              </span>
            </div>

            <div className="space-y-2.5">
              {flow.map((n, i) => (
                <motion.div
                  key={n.name}
                  initial={{ opacity: 0, x: reduce ? 0 : 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 + i * 0.12 }}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl border bg-surface px-3.5 py-3 shadow-sm',
                    i === 2 ? 'border-primary/40 shadow-[0_0_0_3px_rgba(91,91,240,0.08)]' : 'border-border',
                  )}
                >
                  <span className={cn('grid h-9 w-9 place-items-center rounded-xl', n.cls)}>
                    <Glyph name={n.glyph} width={17} height={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-semibold text-text">{n.name}</div>
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-subtle">
                      {n.kind}
                    </div>
                  </div>
                  {i === 2 ? (
                    <span className="animate-pulse-ring grid h-6 w-6 place-items-center rounded-full bg-primary text-[11px] font-bold text-white">
                      ●
                    </span>
                  ) : (
                    <CheckIcon width={16} height={16} className="text-success" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* floating stat chip */}
          <motion.div
            initial={{ opacity: 0, y: reduce ? 0 : 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="animate-float absolute -bottom-6 -left-4 hidden rounded-2xl border border-border bg-surface px-4 py-3 shadow-lg sm:block"
          >
            <div className="font-display text-xl font-bold text-text">&lt; 60s</div>
            <div className="text-[11px] font-semibold text-muted">recall fan-out · 10M units</div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
