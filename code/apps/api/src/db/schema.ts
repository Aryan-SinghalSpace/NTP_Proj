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

export const schema = { tenant, fieldDefinition };
