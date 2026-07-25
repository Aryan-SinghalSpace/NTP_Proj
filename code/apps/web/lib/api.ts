import { toApiError, isNetworkError, QueuedOfflineError } from './api-error';
import { enqueue, type OutboxItem } from './outbox';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

// Demo tenant seeded by apps/api/drizzle/0001_seed.sql. Real auth replaces this.
const DEMO_TENANT = '00000000-0000-0000-0000-000000000001';

/* ── low-level helpers (throw a typed ApiError on non-OK) ──────────────────── */

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'x-tenant-id': DEMO_TENANT },
    cache: 'no-store',
  });
  if (!res.ok) throw await toApiError(res);
  return (await res.json()) as T;
}

/**
 * Raw POST. Throws ApiError on an HTTP error; lets a network failure (TypeError)
 * bubble so callers can decide to queue it offline. Also used as the outbox
 * flush poster (see `sendQueued`).
 */
async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-tenant-id': DEMO_TENANT },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await toApiError(res);
  return (await res.json()) as T;
}

/** Raw PATCH. Throws ApiError on an HTTP error. */
async function patchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers: { 'x-tenant-id': DEMO_TENANT },
  });
  if (!res.ok) throw await toApiError(res);
  return (await res.json()) as T;
}

/** Poster for the offline outbox flush (same as postJson, exported by intent). */
export function sendQueued(path: string, body: unknown): Promise<unknown> {
  return postJson(path, body);
}

/**
 * Write that falls back to the offline outbox. On a network failure the payload
 * is saved locally and a QueuedOfflineError (friendly) is thrown so the UI can
 * say "saved offline — will sync". HTTP errors (ApiError) bubble unchanged.
 */
async function writeOrQueue<T>(
  path: string,
  body: unknown,
  meta: { kind: OutboxItem['kind']; label: string; offlineMsg: string },
): Promise<T> {
  try {
    return await postJson<T>(path, body);
  } catch (e) {
    if (isNetworkError(e)) {
      enqueue({ kind: meta.kind, label: meta.label, method: 'POST', path, body });
      throw new QueuedOfflineError(meta.offlineMsg);
    }
    throw e;
  }
}

function genKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `k_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
}

/* ── Field Library ────────────────────────────────────────────────────────── */

export interface FieldDefinitionRow {
  id: string;
  version: number;
  tier: string;
  entity: string;
  key: string;
  displayName: string;
  dataType: string;
  status: string;
  isLocked: boolean;
}

export function getFields(entity: string, includeInactive = false): Promise<FieldDefinitionRow[]> {
  const q = includeInactive ? '&includeInactive=1' : '';
  return getJson<FieldDefinitionRow[]>(`/api/fields?entity=${encodeURIComponent(entity)}${q}`);
}

export interface CreateFieldPayload {
  entity: string;
  key: string;
  displayName: string;
  dataType: string;
  required?: boolean;
}

/** Add a Tenant Custom field. */
export function createField(payload: CreateFieldPayload): Promise<FieldDefinitionRow> {
  return postJson<FieldDefinitionRow>('/api/fields', payload);
}

/** Deactivate a field (deactivate-not-delete, invariant #4). */
export function deactivateField(id: string): Promise<FieldDefinitionRow> {
  return patchJson<FieldDefinitionRow>(`/api/fields/${id}/deactivate`);
}

/** Reactivate a previously deactivated field. */
export function reactivateField(id: string): Promise<FieldDefinitionRow> {
  return patchJson<FieldDefinitionRow>(`/api/fields/${id}/reactivate`);
}

/* ── Products (Identity & Master Data) ──────────────────────── */

export interface ApiProduct {
  id: string;
  tenantId: string;
  gtin: string | null; // null while draft — assigned at commit (invariant 7)
  brand: string;
  name: string;
  netContent: string;
  packType: string;
  country: string;
  brandOwner: string;
  category: string;
  attributes: Record<string, string>;
  status: 'draft' | 'committed';
  committedAt: string | null;
  createdAt: string;
  updatedAt: string;
  batchCount: number;
}

export interface CreateProductPayload {
  brand: string;
  name: string;
  netContent: string;
  packType: string;
  country?: string;
  brandOwner: string;
  category: string;
  attributes?: Record<string, string>;
}

export function getProducts(): Promise<ApiProduct[]> {
  return getJson<ApiProduct[]>('/api/products');
}

/** Create a draft product (falls back to the offline outbox if the API is down). */
export function createProduct(payload: CreateProductPayload): Promise<ApiProduct> {
  return writeOrQueue<ApiProduct>('/api/products', payload, {
    kind: 'product',
    label: `Product “${payload.name}”`,
    offlineMsg: `You’re offline — “${payload.name}” was saved and will sync automatically.`,
  });
}

/** Commit a draft product: assign a GTIN and lock its identity (invariant 7). */
export function commitProduct(id: string, gtin: string): Promise<ApiProduct> {
  return writeOrQueue<ApiProduct>(`/api/products/${id}/commit`, { gtin }, {
    kind: 'commit',
    label: `Commit GTIN ${gtin}`,
    offlineMsg: `You’re offline — the commit was saved and will sync automatically.`,
  });
}

/* ── Manufacturing units & brand owners ─────────────────────── */

export interface ApiManufacturingUnit {
  id: string;
  name: string;
  code: string;
  location: string;
  identifier: string;
  status: 'active' | 'inactive';
  products: number;
}

export interface ApiBrandOwner {
  id: string;
  name: string;
  gln: string | null;
  country: string;
  status: 'active' | 'inactive';
  products: number;
  brands: number;
}

export function getManufacturingUnits(): Promise<ApiManufacturingUnit[]> {
  return getJson<ApiManufacturingUnit[]>('/api/manufacturing-units');
}

export function getBrandOwners(): Promise<ApiBrandOwner[]> {
  return getJson<ApiBrandOwner[]>('/api/brand-owners');
}

/* ── Batches (batch traceability; expiry powers FEFO) ─────────────────────── */

export interface ApiBatch {
  id: string;
  productId: string;
  batchNumber: string;
  mfgDate: string | null;
  expiryDate: string | null;
  quantity: number;
  manufacturingUnitId: string | null;
  status: 'active' | 'on_hold' | 'recalled' | 'depleted';
  createdAt: string;
}

export interface CreateBatchPayload {
  productId: string;
  batchNumber: string;
  mfgDate?: string;
  expiryDate?: string;
  quantity?: number;
}

export function getBatches(productId: string): Promise<ApiBatch[]> {
  return getJson<ApiBatch[]>(`/api/batches?productId=${encodeURIComponent(productId)}`);
}

export function getAllBatches(): Promise<ApiBatch[]> {
  return getJson<ApiBatch[]>('/api/batches');
}

/** Create a batch (falls back to the offline outbox if the API is down). */
export function createBatch(payload: CreateBatchPayload): Promise<ApiBatch> {
  return writeOrQueue<ApiBatch>('/api/batches', payload, {
    kind: 'batch',
    label: `Batch ${payload.batchNumber}`,
    offlineMsg: `You’re offline — batch ${payload.batchNumber} was saved and will sync automatically.`,
  });
}

/* ── Events (append-only trace spine) ─────────────────────────────────────── */

export interface ApiEvent {
  id: string;
  eventType: string;
  occurredAt: string;
  recordedAt: string;
  actor: string | null;
  subjectKind: string;
  subjectId: string | null;
  subjectLabel: string | null;
  location: string | null;
  quantity: number | null;
  detail: string | null;
  createdAt: string;
}

export interface EventFilters {
  type?: string;
  subjectId?: string;
  limit?: number;
}

export interface CreateEventPayload {
  eventType: string;
  subjectKind?: string;
  subjectId?: string;
  subjectLabel?: string;
  actor?: string;
  location?: string;
  quantity?: number;
  detail?: string;
  idempotencyKey?: string;
}

export function getEvents(f: EventFilters = {}): Promise<ApiEvent[]> {
  const qs = new URLSearchParams();
  if (f.type && f.type !== 'All') qs.set('type', f.type);
  if (f.subjectId) qs.set('subjectId', f.subjectId);
  if (f.limit) qs.set('limit', String(f.limit));
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return getJson<ApiEvent[]>(`/api/events${suffix}`);
}

/**
 * Append an event (falls back to the offline outbox if the API is down). A stable
 * idempotencyKey is attached so an online success and any offline retry can never
 * create the event twice.
 */
export function createEvent(payload: CreateEventPayload): Promise<ApiEvent> {
  const withKey: CreateEventPayload = { ...payload, idempotencyKey: payload.idempotencyKey ?? genKey() };
  return writeOrQueue<ApiEvent>('/api/events', withKey, {
    kind: 'event',
    label: `${withKey.eventType} · ${withKey.subjectLabel ?? 'event'}`,
    offlineMsg: `You’re offline — the ${withKey.eventType} event was saved and will sync automatically.`,
  });
}
