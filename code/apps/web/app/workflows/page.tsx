'use client';

import { useState } from 'react';
import { TopNav } from '../../components/TopNav';
import {
  Glyph,
  SearchIcon,
  PlusIcon,
  PlayIcon,
  CheckIcon,
  DownloadIcon,
  ChevronDownIcon,
  MinusIcon,
  FitIcon,
  PanelLeftIcon,
  DotsIcon,
} from '../../components/icons';
import {
  palette,
  nodes,
  edges,
  workflowMeta,
  type CanvasNode,
  type InspectorSection,
} from '../../data_mock/workflows';

export default function WorkflowsPage() {
  // selection drives the inspector; defaults to the Validate node (matches mockup)
  const [selectedId, setSelectedId] = useState('node_validate');
  const [zoom, setZoom] = useState(1);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [collapsedSecs, setCollapsedSecs] = useState<Set<string>>(new Set());
  const [showPalette, setShowPalette] = useState(true);
  const [showInspector, setShowInspector] = useState(true);
  const [notice, setNotice] = useState<{ text: string; tone: 'ok' | 'info' } | null>(null);

  const selected = nodes.find((n) => n.id === selectedId) ?? null;

  const flash = (text: string, tone: 'ok' | 'info' = 'info') => {
    setNotice({ text, tone });
    window.setTimeout(() => setNotice(null), 2600);
  };

  const toggle = (set: Set<string>, key: string) => {
    const next = new Set(set);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  };

  const cols = `${showPalette ? '236px' : '0px'} 1fr ${showInspector ? '320px' : '0px'}`;

  return (
    <>
      <TopNav active="/workflows" />

      {/* builder action bar */}
      <div className="builder-top">
        <button
          className="btn-bd"
          title={showPalette ? 'Hide node palette' : 'Show node palette'}
          onClick={() => setShowPalette((v) => !v)}
          style={{ padding: '0 9px' }}
        >
          <PanelLeftIcon />
        </button>
        <div className="wf-name">
          {workflowMeta.name}
          <span className="badge-bd">
            <span className="bd" />
            {workflowMeta.status} · v{workflowMeta.version}
          </span>
        </div>
        <span className="text-muted" style={{ fontSize: 12 }}>
          Autosaved 30s ago
        </span>
        <div style={{ flex: 1 }} />
        <button className="btn-bd" onClick={() => flash('Dry run queued — 5 nodes, 0 side effects', 'info')}>
          <PlayIcon /> Dry run
        </button>
        <button className="btn-bd" onClick={() => flash('Validation passed · 0 errors, 0 type mismatches', 'ok')}>
          <CheckIcon /> Validate
        </button>
        <div style={{ width: 1, height: 24, background: 'var(--border)' }} />
        <button className="btn-bd" onClick={() => flash('Draft discarded — reverted to last save', 'info')}>
          Discard
        </button>
        <button className="btn-bd" onClick={() => flash('Draft saved', 'ok')}>
          Save draft
        </button>
        <button
          className="btn-bd primary"
          onClick={() => flash('Publish requested → approval queue (1 reviewer)', 'ok')}
        >
          <DownloadIcon /> Publish
        </button>
      </div>

      <div className="builder" style={{ gridTemplateColumns: cols }}>
        {/* ── Palette ─────────────────────────────────────────── */}
        {showPalette && (
          <aside className="palette">
            <div
              className="flex h-[34px] items-center gap-2 rounded-[11px] border border-border-strong bg-surface-2 px-3 text-[13px] text-subtle"
              style={{ margin: '0 4px 4px' }}
            >
              <SearchIcon width={14} height={14} />
              Search nodes
            </div>

            {palette.map((grp) => {
              const open = !collapsedGroups.has(grp.group);
              return (
                <div key={grp.group}>
                  <button
                    className={`pgroup${open ? '' : ' collapsed'}`}
                    onClick={() => setCollapsedGroups((s) => toggle(s, grp.group))}
                  >
                    <ChevronDownIcon width={12} height={12} className="chev" />
                    {grp.group}
                  </button>
                  {open &&
                    grp.nodes.map((n) => (
                      <button
                        key={n.key}
                        className="pnode"
                        onClick={() => flash(`Drag “${n.label}” onto the canvas to add it (demo)`, 'info')}
                      >
                        <span className={`pn-ic ${n.icon}`}>
                          <Glyph name={n.key} />
                        </span>
                        {n.label}
                      </button>
                    ))}
                </div>
              );
            })}
          </aside>
        )}

        {/* ── Canvas ──────────────────────────────────────────── */}
        <div className="canvas">
          {notice && (
            <div
              className="absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-xl px-4 py-2 text-[12.5px] font-semibold shadow"
              style={{
                background: notice.tone === 'ok' ? 'var(--success-soft)' : 'var(--info-soft)',
                color: notice.tone === 'ok' ? 'var(--success-fg)' : 'var(--info-fg)',
              }}
            >
              {notice.text}
            </div>
          )}

          <div className="canvas-inner" style={{ position: 'absolute', inset: 0, transform: `scale(${zoom})` }}>
            {/* edges */}
            <svg
              width="920"
              height="400"
              viewBox="0 0 920 400"
              style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}
            >
              {edges.map((e) => (
                <path key={e.id} className={`edge${e.active ? ' active' : ''}`} d={e.d} />
              ))}
              {edges
                .filter((e) => e.label)
                .map((e) => (
                  <text
                    key={`${e.id}-l`}
                    className="edge-label"
                    x={e.labelXY![0]}
                    y={e.labelXY![1]}
                    fill={e.labelColor}
                  >
                    {e.label}
                  </text>
                ))}
            </svg>

            {/* nodes */}
            {nodes.map((n) => (
              <NodeCard
                key={n.id}
                node={n}
                selected={n.id === selectedId}
                onClick={() => setSelectedId(n.id)}
              />
            ))}
          </div>

          {/* zoom controls */}
          <div className="canvas-toolbar">
            <button title="Zoom in" onClick={() => setZoom((z) => Math.min(1.6, +(z + 0.1).toFixed(2)))}>
              <PlusIcon width={17} height={17} />
            </button>
            <span className="zoomlabel">{Math.round(zoom * 100)}%</span>
            <button title="Zoom out" onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))}>
              <MinusIcon width={17} height={17} />
            </button>
            <button title="Fit to view" onClick={() => setZoom(1)}>
              <FitIcon width={17} height={17} />
            </button>
          </div>

          {/* minimap */}
          <div className="minimap">
            <svg width="150" height="96" viewBox="0 0 150 96">
              <rect x="6" y="40" width="20" height="14" rx="2" fill="var(--info)" />
              <rect x="42" y="40" width="20" height="14" rx="2" fill="var(--primary)" />
              <rect x="78" y="40" width="20" height="14" rx="2" fill="var(--warning-fg)" />
              <rect x="116" y="14" width="20" height="12" rx="2" fill="var(--tier-tenant)" />
              <rect x="116" y="66" width="20" height="12" rx="2" fill="var(--danger)" />
              <rect
                x="2"
                y="6"
                width="96"
                height="58"
                fill="none"
                stroke="var(--primary)"
                strokeWidth="1.5"
                rx="3"
                opacity=".5"
              />
            </svg>
          </div>
        </div>

        {/* ── Inspector ───────────────────────────────────────── */}
        {showInspector && (
          <aside className="inspector">
            {selected ? (
              <>
                <div className="insp-head">
                  <span className={`pn-ic ${selected.icon}`}>
                    <Glyph name={selected.glyph} width={16} height={16} />
                  </span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, fontFamily: 'var(--font-display)' }}>
                      {selected.title}
                    </div>
                    <div className="text-subtle" style={{ fontSize: 11.5 }}>
                      {selected.id} · {selected.kind}
                    </div>
                  </div>
                </div>

                {selected.inspector.map((sec, i) => {
                  const key = `${selected.id}:${i}`;
                  const open = !collapsedSecs.has(key);
                  return (
                    <div key={key} className={`insp-sec${open ? '' : ' collapsed'}`}>
                      <h4 onClick={() => setCollapsedSecs((s) => toggle(s, key))}>
                        {sec.title}
                        <ChevronDownIcon width={13} height={13} className="chev" />
                      </h4>
                      {open && <SectionBody sec={sec} onAction={flash} />}
                    </div>
                  );
                })}
              </>
            ) : (
              <div className="p-6 text-[13px] text-muted">Select a node to edit its configuration.</div>
            )}
          </aside>
        )}
      </div>
    </>
  );
}

function NodeCard({
  node,
  selected,
  onClick,
}: {
  node: CanvasNode;
  selected: boolean;
  onClick: () => void;
}) {
  const { ports } = node;
  return (
    <button
      className={`node${selected ? ' sel' : ''}`}
      style={{ left: node.x, top: node.y }}
      onClick={onClick}
    >
      <div className="n-head">
        <span className={`n-ic ${node.icon}`}>
          <Glyph name={node.glyph} width={14} height={14} />
        </span>
        <div>
          <div className="n-title">{node.title}</div>
          <div className="n-kind">{node.kind}</div>
        </div>
      </div>
      <div className="n-body">
        {typeof node.body === 'string' ? (
          node.body
        ) : (
          <>
            <div style={{ color: 'var(--success-fg)' }}>{node.body.yes}</div>
            <div style={{ color: 'var(--danger-fg)', marginTop: 4 }}>{node.body.no}</div>
          </>
        )}
      </div>
      {ports.in && <span className={`port in${ports.inOn ? ' on' : ''}`} />}
      {ports.out && <span className={`port out${ports.outOn ? ' on' : ''}`} />}
      {ports.branch && (
        <>
          <span className="port out" style={{ top: 38 }} />
          <span className="port out" style={{ top: 'auto', bottom: 18, transform: 'none' }} />
        </>
      )}
    </button>
  );
}

function SectionBody({
  sec,
  onAction,
}: {
  sec: InspectorSection;
  onAction: (text: string, tone?: 'ok' | 'info') => void;
}) {
  return (
    <div className="insp-body">
      {sec.boundFields && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 10 }}>
          {sec.boundFields.map((b) => (
            <span key={b.name} className="tagfield">
              {b.name} <span className="ttype">{b.type}</span>
            </span>
          ))}
        </div>
      )}

      {sec.fields?.map((f) =>
        f.kind === 'input' ? (
          <div className="field" key={f.label}>
            <label>{f.label}</label>
            <input className="input" defaultValue={f.value} />
          </div>
        ) : (
          <div className="field" key={f.label}>
            <label>{f.label}</label>
            <div className="selrow" style={{ margin: 0 }}>
              <span>{f.value}</span>
              <ChevronDownIcon width={14} height={14} />
            </div>
          </div>
        ),
      )}

      {sec.rows?.map((r) => (
        <div className="selrow" key={r}>
          <span>{r}</span>
          <DotsIcon width={15} height={15} style={{ color: 'var(--subtle)' }} />
        </div>
      ))}

      {sec.action && (
        <button
          className="btn-bd"
          style={{ width: '100%', justifyContent: 'center', background: 'var(--primary-soft)', borderColor: 'transparent', color: 'var(--primary-soft-fg)' }}
          onClick={() => onAction('Field picker — only type-matching fields are bindable (demo)', 'info')}
        >
          <PlusIcon width={15} height={15} /> {sec.action}
        </button>
      )}

      {sec.help && <div className="help">{sec.help}</div>}
    </div>
  );
}
