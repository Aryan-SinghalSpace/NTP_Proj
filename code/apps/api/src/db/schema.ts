import {
  pgTable,
  uuid,
  text,
  integer,
  jsonb,
  timestamp,
  boolean,
  primaryKey,
  index,
} from 'drizzle-orm/pg-core';

/** A customer organisation. Platform-global table (no tenant_id of its own). */
export const tenant = pgTable('tenant', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  tier: text('tier').notNull().default('low'),
  region: text('region').notNull().default('in'),
  status: text('status').notNull().default('active'),
  settings: jsonb('settings').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Field Library definition — append-only versions (PK = id + version).
 * tenant_id is NULL for Core/Super (platform-global), set for Tenant Custom.
 */
export const fieldDefinition = pgTable(
  'field_definition',
  {
    id: uuid('id').notNull().defaultRandom(),
    version: integer('version').notNull().default(1),
    tier: text('tier').notNull(),
    tenantId: uuid('tenant_id'),
    entity: text('entity').notNull(),
    key: text('key').notNull(),
    displayName: text('display_name').notNull(),
    dataType: text('data_type').notNull(),
    validation: jsonb('validation').notNull().default({}),
    options: jsonb('options').notNull().default([]),
    derived: jsonb('derived'),
    status: text('status').notNull().default('active'),
    isLocked: boolean('is_locked').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.id, t.version] }),
    entityIdx: index('field_definition_entity_idx').on(t.entity, t.status),
    tenantIdx: index('field_definition_tenant_idx').on(t.tenantId),
  }),
);

/**
 * Product — the core Identity & Master Data entity. UUID primary key
 * (invariant #1); GTIN and the other identity attributes are validated columns.
 * Tenant-scoped under RLS. The six identity attributes freeze on commit (#7).
 */
export const product = pgTable(
  'product',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    // six GTIN-immutable identity attributes
    gtin: text('gtin'),
    brand: text('brand').notNull(),
    name: text('name').notNull(),
    netContent: text('net_content').notNull(),
    packType: text('pack_type').notNull(),
    country: text('country').notNull().default('India'),
    // commercial / relational
    brandOwner: text('brand_owner').notNull(),
    category: text('category').notNull(),
    attributes: jsonb('attributes').notNull().default({}),
    // lifecycle
    status: text('status').notNull().default('draft'),
    committedAt: timestamp('committed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tenantStatusIdx: index('product_tenant_status_idx').on(t.tenantId, t.status),
  }),
);

/** Manufacturing unit (a plant / co-pack). Tenant-scoped under RLS. */
export const manufacturingUnit = pgTable(
  'manufacturing_unit',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    name: text('name').notNull(),
    code: text('code').notNull(),
    location: text('location').notNull(),
    identifier: text('identifier').notNull(),
    status: text('status').notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ tenantIdx: index('manufacturing_unit_tenant_idx').on(t.tenantId) }),
);

/** Brand owner (a company owning brands). Tenant-scoped under RLS. */
export const brandOwner = pgTable(
  'brand_owner',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    name: text('name').notNull(),
    gln: text('gln'),
    country: text('country').notNull().default('India'),
    status: text('status').notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ tenantIdx: index('brand_owner_tenant_idx').on(t.tenantId) }),
);

/**
 * Batch — a produced lot of a product with its own mfg/expiry dates and quantity.
 * UUID pk (#1); tenant-scoped under RLS. `expiry_date` powers FEFO advisory.
 */
export const batch = pgTable(
  'batch',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    productId: uuid('product_id').notNull(),
    batchNumber: text('batch_number').notNull(),
    mfgDate: text('mfg_date'), // DATE — kept as ISO string on the wire
    expiryDate: text('expiry_date'),
    quantity: integer('quantity').notNull().default(0),
    manufacturingUnitId: uuid('manufacturing_unit_id'),
    status: text('status').notNull().default('active'),
    attributes: jsonb('attributes').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    productIdx: index('batch_product_idx').on(t.productId),
    expiryIdx: index('batch_tenant_expiry_idx').on(t.tenantId, t.expiryDate),
  }),
);

/**
 * Event — append-only trace spine (data-model §6.2). Never updated; corrections
 * are new compensating events. Tenant-scoped under RLS. `occurred_at` = business
 * time, `recorded_at` = ingest time.
 */
export const event = pgTable(
  'event',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    eventType: text('event_type').notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
    recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
    actor: text('actor'),
    subjectKind: text('subject_kind').notNull().default('batch'),
    subjectId: uuid('subject_id'),
    subjectLabel: text('subject_label'),
    location: text('location'),
    quantity: integer('quantity'),
    detail: text('detail'),
    payload: jsonb('payload').notNull().default({}),
    lineage: jsonb('lineage'),
    idempotencyKey: text('idempotency_key'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    timeIdx: index('event_tenant_time_idx').on(t.tenantId, t.occurredAt),
    subjectIdx: index('event_subject_idx').on(t.subjectId),
    typeIdx: index('event_tenant_type_idx').on(t.tenantId, t.eventType),
  }),
);

/** A configurable, tenant-scoped role with a resource→CRUD permission map. */
export const role = pgTable(
  'role',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    name: text('name').notNull(),
    description: text('description').notNull().default(''),
    permissions: jsonb('permissions').notNull().default({}),
    isSystem: boolean('is_system').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ tenantIdx: index('role_tenant_idx').on(t.tenantId) }),
);

/** A tenant user (auth is the x-tenant-id stand-in until OIDC). */
export const tenantUser = pgTable(
  'tenant_user',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    roleId: uuid('role_id'),
    status: text('status').notNull().default('invited'),
    lastActiveAt: timestamp('last_active_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ roleIdx: index('tenant_user_role_idx').on(t.roleId) }),
);

/** Tenant identity schemes (GTIN/UUID standard cards + custom coded schemes). */
export const identityScheme = pgTable(
  'identity_scheme',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    kind: text('kind').notNull(),
    name: text('name').notNull(),
    short: text('short').notNull().default(''),
    summary: text('summary').notNull().default(''),
    tone: text('tone').notNull().default('info'),
    isPrimary: boolean('is_primary').notNull().default(false),
    enabled: boolean('enabled').notNull().default(true),
    rules: jsonb('rules').notNull().default([]),
    allocation: jsonb('allocation').notNull().default([]),
    pattern: text('pattern'),
    example: text('example'),
    scope: text('scope'),
    issued: integer('issued').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ tenantIdx: index('identity_scheme_tenant_idx').on(t.tenantId) }),
);

/** The approvals queue — field-promotion & workflow-publish sign-offs. */
export const approvalRequest = pgTable(
  'approval_request',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    kind: text('kind').notNull(),
    title: text('title').notNull(),
    target: text('target').notNull().default(''),
    detail: text('detail').notNull().default(''),
    requester: text('requester').notNull().default(''),
    status: text('status').notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    decidedAt: timestamp('decided_at', { withTimezone: true }),
  },
  (t) => ({ tenantIdx: index('approval_request_tenant_idx').on(t.tenantId, t.status) }),
);

/** Append-only audit log (invariant #2 — every change auditable). */
export const auditEntry = pgTable(
  'audit_entry',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
    actor: text('actor').notNull().default('System'),
    actorRole: text('actor_role').notNull().default(''),
    action: text('action').notNull(),
    entity: text('entity').notNull(),
    entityId: text('entity_id').notNull().default(''),
    version: text('version').notNull().default(''),
    diff: text('diff').notNull().default(''),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ timeIdx: index('audit_entry_tenant_time_idx').on(t.tenantId, t.occurredAt) }),
);

/** Notification rule — "if trigger event then notify via channels". */
export const notificationRule = pgTable(
  'notification_rule',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    name: text('name').notNull(),
    trigger: text('trigger').notNull(),
    channels: jsonb('channels').notNull().default([]),
    recipients: text('recipients').notNull().default(''),
    enabled: boolean('enabled').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ tenantIdx: index('notification_rule_tenant_idx').on(t.tenantId) }),
);

/** Delivery log entry for a fired notification. */
export const notificationDelivery = pgTable(
  'notification_delivery',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    rule: text('rule').notNull(),
    channel: text('channel').notNull(),
    recipient: text('recipient').notNull(),
    status: text('status').notNull().default('delivered'),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ timeIdx: index('notification_delivery_tenant_time_idx').on(t.tenantId, t.occurredAt) }),
);

export const schema = {
  tenant,
  fieldDefinition,
  product,
  manufacturingUnit,
  brandOwner,
  batch,
  event,
  role,
  tenantUser,
  identityScheme,
  approvalRequest,
  auditEntry,
  notificationRule,
  notificationDelivery,
};

/** External receiving party (dealer/distributor). Tenant-scoped. */
export const dealer = pgTable(
  'dealer',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    name: text('name').notNull(),
    city: text('city').notNull().default(''),
    identifier: text('identifier').notNull().default(''),
    status: text('status').notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ tenantIdx: index('dealer_tenant_idx').on(t.tenantId) }),
);

/** A dispatch of a batch, split into per-dealer legs. */
export const shipment = pgTable(
  'shipment',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    code: text('code').notNull(),
    batchId: uuid('batch_id'),
    batchLabel: text('batch_label').notNull().default(''),
    productLabel: text('product_label').notNull().default(''),
    totalUnits: integer('total_units').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ tenantIdx: index('shipment_tenant_idx').on(t.tenantId, t.createdAt), batchIdx: index('shipment_batch_idx').on(t.batchId) }),
);

/** One dealer's portion of a shipment (the receive surface + recall fan-out). */
export const shipmentLeg = pgTable(
  'shipment_leg',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    shipmentId: uuid('shipment_id').notNull(),
    dealerId: uuid('dealer_id').notNull(),
    units: integer('units').notNull().default(0),
    receivedUnits: integer('received_units').notNull().default(0),
    status: text('status').notNull().default('loading'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ shipmentIdx: index('shipment_leg_shipment_idx').on(t.shipmentId), dealerIdx: index('shipment_leg_dealer_idx').on(t.dealerId) }),
);

/** A label template (WYSIWYG design + barcode payload). Zint render is a sidecar. */
export const labelTemplate = pgTable(
  'label_template',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    name: text('name').notNull(),
    symbology: text('symbology').notNull().default(''),
    size: text('size').notNull().default(''),
    payload: text('payload').notNull().default(''),
    fields: jsonb('fields').notNull().default([]),
    status: text('status').notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ tenantIdx: index('label_template_tenant_idx').on(t.tenantId) }),
);

/** A workflow (stable identity); its graph lives in versioned rows. */
export const workflowDefinition = pgTable(
  'workflow_definition',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    name: text('name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ tenantIdx: index('workflow_definition_tenant_idx').on(t.tenantId) }),
);

/** An immutable workflow version (draft/published/retired) with a graph. */
export const workflowVersion = pgTable(
  'workflow_version',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    definitionId: uuid('definition_id').notNull(),
    version: integer('version').notNull().default(1),
    state: text('state').notNull().default('draft'),
    graph: jsonb('graph').notNull().default({}),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    graceUntil: timestamp('grace_until', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ defIdx: index('workflow_version_def_idx').on(t.definitionId, t.version) }),
);

Object.assign(schema, {
  dealer,
  shipment,
  shipmentLeg,
  labelTemplate,
  workflowDefinition,
  workflowVersion,
});
