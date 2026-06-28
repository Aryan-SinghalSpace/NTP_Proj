'use client';

import { useState } from 'react';
import { PageShell } from '../../components/PageShell';
import { TagIcon, CheckIcon, XIcon, DownloadIcon, PlusIcon } from '../../components/icons';
import { templates, scannability, outputFormats, type LabelTemplate } from '../../data_mock/labels';

export default function LabelsPage() {
  const [sel, setSel] = useState<LabelTemplate>(templates[0]!);
  const [notice, setNotice] = useState<string | null>(null);
  const flash = (t: string) => {
    setNotice(t);
    window.setTimeout(() => setNotice(null), 2400);
  };
  const passes = scannability.filter((c) => c.ok).length;

  return (
    <PageShell
      active="/labels"
      title="Label Designer"
      subtitle="WYSIWYG labels rendered with Zint · scannability validated before commit · PDF / PNG / ZPL / Excel."
      actions={
        <button
          onClick={() => flash('New label template')}
          className="brand-grad inline-flex h-10 items-center gap-2 rounded-xl px-4 text-[13.5px] font-semibold text-white"
        >
          <PlusIcon width={16} height={16} /> New template
        </button>
      }
    >
      {notice && (
        <div className="fixed left-1/2 top-[74px] z-50 -translate-x-1/2 rounded-xl bg-[var(--success-soft)] px-4 py-2 text-[12.5px] font-semibold text-[var(--success-fg)] shadow">
          {notice}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[230px_1fr_280px]">
        {/* templates */}
        <div className="rounded-3xl border border-border bg-surface p-3">
          <div className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wide text-subtle">Templates</div>
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => setSel(t)}
              className={`mb-1.5 flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left last:mb-0 ${
                sel.id === t.id ? 'border-primary bg-primary-soft' : 'border-border hover:bg-surface-2'
              }`}
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--teal-soft)] text-teal">
                <TagIcon width={15} height={15} />
              </span>
              <div>
                <div className="text-[13px] font-semibold">{t.name}</div>
                <div className="text-[11px] text-muted">{t.size}</div>
              </div>
            </button>
          ))}
        </div>

        {/* preview canvas */}
        <div className="flex flex-col items-center justify-center rounded-3xl border border-border bg-surface-2 p-8">
          <div className="w-full max-w-[360px] rounded-xl border border-border-strong bg-white p-5 shadow-[var(--shadow)]">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-[#6e6a78]">{sel.symbology}</div>
                <div className="font-display text-[15px] font-bold text-[#1b1922]">
                  {sel.fields[0]?.value}
                </div>
              </div>
              <Barcode payload={sel.payload} symbology={sel.symbology} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
              {sel.fields.slice(1).map((f) => (
                <div key={f.label}>
                  <div className="text-[9.5px] uppercase tracking-wide text-[#a09bab]">{f.label}</div>
                  <div className={`text-[12px] font-semibold text-[#1b1922] ${f.mono ? 'font-mono' : ''}`}>
                    {f.value}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 border-t border-dashed border-[#ecebe6] pt-2 text-center font-mono text-[10px] text-[#6e6a78]">
              {sel.payload}
            </div>
          </div>
          <div className="mt-4 text-[12px] text-muted">{sel.size} · drag fields to reposition (demo)</div>
        </div>

        {/* validation + output */}
        <div className="flex flex-col gap-4">
          <div className="rounded-3xl border border-border bg-surface p-4">
            <div className="mb-3 flex items-center gap-2">
              <h4 className="text-[12.5px] font-bold">Scannability</h4>
              <span
                className="ml-auto rounded-full px-2 py-0.5 text-[10.5px] font-bold"
                style={
                  passes === scannability.length
                    ? { background: 'var(--success-soft)', color: 'var(--success-fg)' }
                    : { background: 'var(--warning-soft)', color: 'var(--warning-fg)' }
                }
              >
                {passes}/{scannability.length} pass
              </span>
            </div>
            {scannability.map((c) => (
              <div key={c.label} className="mb-2 flex items-start gap-2 last:mb-0">
                <span
                  className="mt-0.5 grid h-4 w-4 place-items-center rounded-full"
                  style={
                    c.ok
                      ? { background: 'var(--success-soft)', color: 'var(--success-fg)' }
                      : { background: 'var(--danger-soft)', color: 'var(--danger-fg)' }
                  }
                >
                  {c.ok ? <CheckIcon width={11} height={11} /> : <XIcon width={11} height={11} />}
                </span>
                <div>
                  <div className="text-[12.5px] font-semibold">{c.label}</div>
                  <div className="text-[11px] text-muted">{c.note}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-3xl border border-border bg-surface p-4">
            <h4 className="mb-3 text-[12.5px] font-bold">Output</h4>
            <div className="grid grid-cols-2 gap-2">
              {outputFormats.map((f) => (
                <button
                  key={f}
                  onClick={() => flash(`Exported ${sel.name} → ${f}`)}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-border-strong bg-surface text-[12.5px] font-semibold hover:bg-surface-hover"
                >
                  <DownloadIcon width={14} height={14} /> {f}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

/** Deterministic faux barcode/DataMatrix from the payload (no real encoding). */
function Barcode({ payload, symbology }: { payload: string; symbology: string }) {
  const codes = Array.from(payload).map((c) => c.charCodeAt(0));
  if (symbology.includes('DataMatrix')) {
    const n = 12;
    return (
      <svg width="56" height="56" viewBox="0 0 56 56">
        {Array.from({ length: n * n }).map((_, i) => {
          const on = (codes[i % codes.length]! + i * 7) % 2 === 0;
          if (!on) return null;
          const x = (i % n) * (56 / n);
          const y = Math.floor(i / n) * (56 / n);
          return <rect key={i} x={x} y={y} width={56 / n} height={56 / n} fill="#1b1922" />;
        })}
      </svg>
    );
  }
  return (
    <svg width="92" height="48" viewBox="0 0 92 48">
      {Array.from({ length: 40 }).map((_, i) => {
        const w = (codes[i % codes.length]! % 3) + 1;
        const x = i * 2.3;
        return i % 2 === 0 ? <rect key={i} x={x} y={0} width={w * 0.7} height={48} fill="#1b1922" /> : null;
      })}
    </svg>
  );
}
