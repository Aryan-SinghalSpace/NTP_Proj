/**
 * Mock data for the Workflow Builder (/workflows). Shaped to resemble what the
 * Temporal graph-interpreter backend will eventually serve: a workflow is just
 * data — nodes + edges + per-node config — that the engine interprets.
 *
 * NOTE: everything under `data_mock/` is temporary demo data. Delete this whole
 * folder once each page is wired to the live API.
 */

/** Visual swatch class for a node kind — maps to .ic-* in globals.css. */
export type NodeIcon =
  | 'ic-trigger'
  | 'ic-validate'
  | 'ic-branch'
  | 'ic-id'
  | 'ic-label'
  | 'ic-record'
  | 'ic-notify'
  | 'ic-approve';

/** A draggable node type shown in the left palette, grouped by category. */
export interface PaletteNode {
  key: string;
  label: string;
  icon: NodeIcon;
}
export interface PaletteGroup {
  group: string;
  nodes: PaletteNode[];
}

export const palette: PaletteGroup[] = [
  {
    group: 'Triggers',
    nodes: [
      { key: 'scan', label: 'Scan', icon: 'ic-trigger' },
      { key: 'upload', label: 'Upload', icon: 'ic-trigger' },
      { key: 'api', label: 'API call', icon: 'ic-trigger' },
    ],
  },
  {
    group: 'Logic',
    nodes: [
      { key: 'validate', label: 'Validate', icon: 'ic-validate' },
      { key: 'branch', label: 'Branch', icon: 'ic-branch' },
      { key: 'route', label: 'Dynamic Route', icon: 'ic-branch' },
      { key: 'transform', label: 'Transform', icon: 'ic-id' },
    ],
  },
  {
    group: 'Identity & Output',
    nodes: [
      { key: 'genid', label: 'Generate ID', icon: 'ic-id' },
      { key: 'genlabel', label: 'Generate Label', icon: 'ic-label' },
    ],
  },
  {
    group: 'Data & Flow',
    nodes: [
      { key: 'record', label: 'Record Event', icon: 'ic-record' },
      { key: 'approve', label: 'Approve', icon: 'ic-approve' },
      { key: 'notify', label: 'Notify', icon: 'ic-notify' },
    ],
  },
  {
    group: 'Advanced',
    nodes: [
      { key: 'loop', label: 'Loop', icon: 'ic-approve' },
      { key: 'subflow', label: 'Sub-workflow', icon: 'ic-approve' },
    ],
  },
];

/** A read-only inspector section for the selected node. */
export interface InspectorField {
  label: string;
  value: string;
  /** 'input' = editable text box; 'select' = a row with a chevron. */
  kind: 'input' | 'select';
}
export interface BoundField {
  name: string;
  type: string;
}
export interface InspectorSection {
  title: string;
  /** rendered as <input> rows */
  fields?: InspectorField[];
  /** rendered as a wrap of type-tagged chips */
  boundFields?: BoundField[];
  /** rendered as selrows (list items) */
  rows?: string[];
  /** small helper line under the section */
  help?: string;
  /** a full-width soft button label (e.g. "Bind field") */
  action?: string;
}

/** A node placed on the canvas. */
export interface CanvasNode {
  id: string;
  title: string;
  kind: string; // sub-label under the title, e.g. "Validate", "Output · Zint"
  icon: NodeIcon;
  glyph: string; // shape name from the Glyph map in components/icons
  body: string | { yes: string; no: string }; // branch nodes show two outcome lines
  x: number;
  y: number;
  ports: { in?: boolean; out?: boolean; inOn?: boolean; outOn?: boolean; branch?: boolean };
  inspector: InspectorSection[];
}

export const edges: { id: string; d: string; active?: boolean; label?: string; labelXY?: [number, number]; labelColor?: string }[] = [
  { id: 'e1', d: 'M212,173 C232,173 220,173 240,173', active: true },
  { id: 'e2', d: 'M436,173 C456,173 444,180 464,180', active: true },
  { id: 'e3', d: 'M660,160 C712,160 636,77 688,77', label: 'Yes', labelXY: [676, 120], labelColor: 'var(--success-fg)' },
  { id: 'e4', d: 'M660,200 C712,200 636,293 688,293', label: 'No', labelXY: [676, 252], labelColor: 'var(--danger-fg)' },
];

export const nodes: CanvasNode[] = [
  {
    id: 'node_scan',
    title: 'Scan',
    kind: 'Trigger',
    icon: 'ic-trigger',
    glyph: 'scan',
    body: 'GS1 DataMatrix · unit label',
    x: 16,
    y: 130,
    ports: { out: true },
    inspector: [
      {
        title: 'General',
        fields: [
          { label: 'Node name', value: 'Scan', kind: 'input' },
          { label: 'Description', value: 'Entry trigger — unit label scan', kind: 'input' },
        ],
      },
      {
        title: 'Trigger source',
        rows: ['Surface — Scanning PWA', 'Symbology — GS1 DataMatrix', 'Scope — Unit label'],
        help: 'The scanning app posts each decoded label to this trigger.',
      },
    ],
  },
  {
    id: 'node_validate',
    title: 'Validate batch',
    kind: 'Validate',
    icon: 'ic-validate',
    glyph: 'validate',
    body: '3 fields · 4 rules',
    x: 240,
    y: 130,
    ports: { in: true, out: true, inOn: true, outOn: true },
    inspector: [
      {
        title: 'General',
        fields: [
          { label: 'Node name', value: 'Validate batch', kind: 'input' },
          { label: 'Description', value: 'Type & rule check before dispatch', kind: 'input' },
        ],
      },
      {
        title: 'Bound fields · strict typing',
        boundFields: [
          { name: 'Batch Number', type: 'text' },
          { name: 'Expiry Date', type: 'date' },
          { name: 'Manufacturing Unit', type: 'unit-ref' },
        ],
        action: 'Bind field',
        help: 'Only fields whose type matches the rule input can be bound — mismatches are blocked.',
      },
      {
        title: 'Validation rules',
        rows: [
          'Batch Number — required, ≤ 20 chars',
          'Expiry Date — required, > Mfg Date',
          'Mfg Unit — required, active plant',
        ],
      },
      {
        title: 'Failure handling',
        fields: [
          { label: 'Retry count', value: '3', kind: 'input' },
          { label: 'Backoff', value: 'Exponential · 2s base', kind: 'select' },
          { label: 'On error', value: 'Halt & route → Notify QA', kind: 'select' },
        ],
      },
    ],
  },
  {
    id: 'node_branch',
    title: 'QC passed?',
    kind: 'Branch',
    icon: 'ic-branch',
    glyph: 'branch',
    body: { yes: '▸ Yes — qc_status = released', no: '▸ No — otherwise' },
    x: 464,
    y: 124,
    ports: { in: true, branch: true },
    inspector: [
      {
        title: 'General',
        fields: [{ label: 'Node name', value: 'QC passed?', kind: 'input' }],
      },
      {
        title: 'Conditions',
        rows: ['Yes — qc_status = released', 'No — otherwise (default)'],
        help: 'Conditions are evaluated top-down; the first match wins.',
      },
    ],
  },
  {
    id: 'node_label',
    title: 'Generate Label',
    kind: 'Output · Zint',
    icon: 'ic-label',
    glyph: 'genlabel',
    body: 'Template: Case GS1-128',
    x: 688,
    y: 34,
    ports: { in: true, out: true },
    inspector: [
      {
        title: 'General',
        fields: [{ label: 'Node name', value: 'Generate Label', kind: 'input' }],
      },
      {
        title: 'Label output',
        fields: [
          { label: 'Template', value: 'Case GS1-128', kind: 'select' },
          { label: 'Renderer', value: 'Zint sidecar', kind: 'select' },
          { label: 'Format', value: 'PDF + ZPL', kind: 'select' },
        ],
        help: 'Scannability is validated before the label is committed.',
      },
    ],
  },
  {
    id: 'node_notify',
    title: 'Notify QA',
    kind: 'Notify · email',
    icon: 'ic-notify',
    glyph: 'notify',
    body: 'Hold raised → QA queue',
    x: 688,
    y: 250,
    ports: { in: true, out: true },
    inspector: [
      {
        title: 'General',
        fields: [{ label: 'Node name', value: 'Notify QA', kind: 'input' }],
      },
      {
        title: 'Notification',
        fields: [
          { label: 'Channel', value: 'Email', kind: 'select' },
          { label: 'Recipients', value: 'QA queue', kind: 'select' },
          { label: 'Template', value: 'Hold raised', kind: 'input' },
        ],
      },
    ],
  },
];

/** Workflows available in the switcher (only the first is fully wired here). */
export interface WorkflowMeta {
  id: string;
  name: string;
  status: 'Draft' | 'Published';
  version: number;
}

export const workflowMeta: WorkflowMeta = {
  id: 'wf_dispatch',
  name: 'FMCG Batch Dispatch',
  status: 'Draft',
  version: 3,
};
