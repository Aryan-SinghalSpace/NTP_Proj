'use client';

import { useEffect, useState } from 'react';
import { PageShell } from '../../components/PageShell';
import { TagIcon, CheckIcon, XIcon, DownloadIcon, PlusIcon } from '../../components/icons';
import { getLabelTemplates, createLabelTemplate, type ApiLabelTemplate } from '../../lib/api';

const outputFormats = ['PDF', 'PNG', 'ZPL', 'Excel'] as const;
// Scannability validation runs in the Zint sidecar (not built yet) — illustrative.
const scannability = [
  { label: 'Quiet zone', ok: true, note: '≥ 4× module width' },
  { label: 'Module size', ok: true, note: '0.33 mm (≥ min)' },
  { label: 'Contrast', ok: true, note: '78% (≥ 40%)' },
  { label: 'Check digit', ok: true, note: 'GS1 mod-10 valid' },
  { label: 'Print resolution', ok: false, note: '203 dpi — 300 dpi advised for unit size' },
];

export default function LabelsPage() {
  const [templates, setTemplates] = useState<ApiLabelTemplate[] | null>(null);
  const [sel, setSel] = useState<ApiLabelTemplate | null>(null);
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const flash = (t: string) => {
    setNotice(t);
    window.setTimeout(() => setNotice(null), 2400);
  };

  async function load(selectId?: string) {
    try {
      const t = await getLabelTemplates();
      setTemplates(t);
      setSel(t.find((x) => x.id === selectId) ?? t[0] ?? null);
    } catch {
      setTemplates([]);
    }
  }
  useEffect(() => {
    void load();
  }, []);

  const passes = scannability.filter((c) => c.ok).length;
  const all = templates ?? [];

  return (
    <PageShell
      active="/labels"
      title="Label Designer"
      subtitle="Acme Foods · live templates via RLS · WYSIWYG labels · Zint render + scannability at the sidecar (later)"
      actions={
        <button
          onClick={() => setCreating(true)}
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
          {templates === null && <div className="px-2 py-3 text-[12.5px] text-muted">Loading…</div>}
          {all.map((t) => (
            <button
              key={t.id}
              onClick={() => setSel(t)}
              className={`mb-1.5 flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left last:mb-0 ${
                sel?.id === t.id ? 'border-primary bg-primary-soft' : 'border-border hover:bg-surface-2'
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
          {templates !== null && all.length === 0 && <div className="px-2 py-3 text-[12.5px] text-muted">No templates yet.</div>}
        </div>

        {/* preview canvas */}
        <div className="flex flex-col items-center justify-center rounded-3xl border border-border bg-surface-2 p-8">
          {sel ? (
            <>
              <div className="w-full max-w-[360px] rounded-xl border border-border-strong bg-white p-5 shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wide text-[#6e6a78]">{sel.symbology}</div>
                    <div className="font-display text-[15px] font-bold text-[#1b1922]">{sel.fields[0]?.value}</div>
                  </div>
                  <Barcode payload={sel.payload} symbology={sel.symbology} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {sel.fields.slice(1).map((f) => (
                    <div key={f.label}>
                      <div className="text-[9.5px] uppercase tracking-wide text-[#a09bab]">{f.label}</div>
                      <div className={`text-[12px] font-semibold text-[#1b1922] ${f.mono ? 'font-mono' : ''}`}>{f.value}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 border-t border-dashed border-[#ecebe6] pt-2 text-center font-mono text-[10px] text-[#6e6a78]">
                  {sel.payload}
                </div>
              </div>
              <div className="mt-4 text-[12px] text-muted">{sel.size} · Zint renders the real barcode at export</div>
            </>
          ) : (
            <div className="text-[13px] text-muted">Select or create a template.</div>
          )}
        </div>

        {/* validation + output */}
        <div className="flex flex-col gap-4">
          <div className="rounded-3xl border border-border bg-surface p-4">
            <div className="mb-3 flex items-center gap-2">
              <h4 className="text-[12.5px] font-bold">Scannability</h4>
              <span
                className="ml-auto rounded-full px-2 py-0.5 text-[10.5px] font-bold"
                style={passes === scannability.length ? { background: 'var(--success-soft)', color: 'var(--success-fg)' } : { background: 'var(--warning-soft)', color: 'var(--warning-fg)' }}
              >
                {passes}/{scannability.length} pass
              </span>
            </div>
            {scannability.map((c) => (
              <div key={c.label} className="mb-2 flex items-start gap-2 last:mb-0">
                <span
                  className="mt-0.5 grid h-4 w-4 place-items-center rounded-full"
                  style={c.ok ? { background: 'var(--success-soft)', color: 'var(--success-fg)' } : { background: 'var(--danger-soft)', color: 'var(--danger-fg)' }}
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
                  onClick={() => flash(sel ? `Export ${sel.name} → ${f} (Zint sidecar)` : 'Select a template')}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-border-strong bg-surface text-[12.5px] font-semibold hover:bg-surface-hover"
                >
                  <DownloadIcon width={14} height={14} /> {f}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {creating && (
        <NewTemplateModal
          onClose={() => setCreating(false)}
          onCreated={(id, name) => {
            setCreating(false);
            flash(`Template “${name}” created`);
            void load(id);
          }}
          onError={flash}
        />
      )}
    </PageShell>
  );
}

function NewTemplateModal({ onClose, onCreated, onError }: { onClose: () => void; onCreated: (id: string, name: string) => void; onError: (m: string) => void }) {
  const [name, setName] = useState('');
  const [symbology, setSymbology] = useState('GS1 DataMatrix');
  const [size, setSize] = useState('25 × 25 mm');
  const [payload, setPayload] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      const t = await createLabelTemplate({ name: name.trim(), symbology, size, payload: payload.trim(), fields: [{ label: 'Product', value: name.trim() }] });
      onCreated(t.id, t.name);
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Could not create template');
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-[#1b1922]/30" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[420px] flex-col overflow-auto border-l border-border bg-surface shadow-lg">
        <div className="flex items-center gap-3 border-b border-border p-5">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--teal-soft)] text-teal">
            <TagIcon width={20} height={20} />
          </span>
          <div>
            <div className="font-display text-[17px] font-bold">New label template</div>
            <div className="text-[12px] text-muted">Design metadata; Zint renders at export</div>
          </div>
          <button onClick={onClose} className="ml-auto grid h-9 w-9 place-items-center rounded-xl border border-border text-muted hover:bg-surface-2">
            <XIcon width={16} height={16} />
          </button>
        </div>
        <div className="flex flex-col gap-3.5 p-5">
          <L label="Name" value={name} onChange={setName} placeholder="e.g. Unit · GS1 DataMatrix" />
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-muted">Symbology</span>
            <select value={symbology} onChange={(e) => setSymbology(e.target.value)} className="h-10 w-full rounded-xl border border-border-strong bg-surface px-3 text-[13.5px] outline-none focus:border-primary">
              {['GS1 DataMatrix', 'GS1-128', 'GS1-128 (SSCC)', 'QR', 'Code 128'].map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </label>
          <L label="Size" value={size} onChange={setSize} placeholder="25 × 25 mm" />
          <L label="Barcode payload" value={payload} onChange={setPayload} placeholder="(01)08901234567890(10)B-240931" mono />
        </div>
        <div className="mt-auto flex gap-2.5 border-t border-border p-5">
          <button onClick={onClose} className="inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-border-strong bg-surface text-[13.5px] font-semibold hover:bg-surface-hover">Cancel</button>
          <button onClick={submit} disabled={!name.trim() || busy} className="brand-grad inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl text-[13.5px] font-semibold text-white disabled:opacity-50">
            <CheckIcon width={16} height={16} /> {busy ? 'Creating…' : 'Create'}
          </button>
        </div>
      </aside>
    </div>
  );
}

function L({ label, value, onChange, placeholder, mono }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-semibold text-muted">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`h-10 w-full rounded-xl border border-border-strong bg-surface px-3 text-[13.5px] outline-none focus:border-primary placeholder:text-subtle ${mono ? 'font-mono text-[12.5px]' : ''}`}
      />
    </label>
  );
}

/** Deterministic faux barcode/DataMatrix from the payload (real encoding = Zint). */
function Barcode({ payload, symbology }: { payload: string; symbology: string }) {
  const codes = Array.from(payload || 'x').map((c) => c.charCodeAt(0));
  if (symbology.includes('DataMatrix') || symbology === 'QR') {
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
