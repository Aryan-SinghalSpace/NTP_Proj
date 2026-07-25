import { HttpStatus } from '@nestjs/common';

/**
 * The single source of truth for application errors. Every error the API can
 * deliberately return has a stable code (TW-<AREA>-<n>), an HTTP status, a
 * CUSTOMER-FRIENDLY message (shown in the UI), and an internal note (for logs +
 * docs). Keep docs/error-handling.md in sync with this file.
 *
 * AREAS: GEN (generic), AUTH, TENANT, PROD (product), MD (master data),
 * BATCH, EVENT, SYS (system/infra).
 */
export interface ErrorDef {
  code: string;
  httpStatus: HttpStatus;
  /** Shown to the customer in the UI. Friendly, non-technical, no internals. */
  message: string;
  /** Internal note — appears in logs and the error-handling doc, never to the client. */
  internal: string;
}

export const ERROR_CATALOG = {
  // ---- generic ----
  'TW-GEN-400': {
    code: 'TW-GEN-400',
    httpStatus: HttpStatus.BAD_REQUEST,
    message: 'Some of the information provided isn’t valid. Please review the highlighted fields and try again.',
    internal: 'Generic bad request / validation failure (details carry field-level issues).',
  },
  'TW-GEN-404': {
    code: 'TW-GEN-404',
    httpStatus: HttpStatus.NOT_FOUND,
    message: 'We couldn’t find what you were looking for. It may have been moved or removed.',
    internal: 'Generic not-found.',
  },
  'TW-GEN-409': {
    code: 'TW-GEN-409',
    httpStatus: HttpStatus.CONFLICT,
    message: 'This action conflicts with data that already exists.',
    internal: 'Generic conflict.',
  },
  'TW-GEN-500': {
    code: 'TW-GEN-500',
    httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
    message: 'Something went wrong on our end. The team has been notified — please try again shortly.',
    internal: 'Unhandled/unknown server error. Inspect stack + requestId.',
  },
  // ---- auth / tenancy ----
  'TW-AUTH-401': {
    code: 'TW-AUTH-401',
    httpStatus: HttpStatus.UNAUTHORIZED,
    message: 'You need to sign in to continue.',
    internal: 'Missing/invalid credentials (currently the x-tenant-id header stand-in).',
  },
  'TW-TENANT-403': {
    code: 'TW-TENANT-403',
    httpStatus: HttpStatus.FORBIDDEN,
    message: 'You don’t have access to this resource.',
    internal: 'Tenant/role check failed (RLS is the backstop).',
  },
  // ---- product ----
  'TW-PROD-404': {
    code: 'TW-PROD-404',
    httpStatus: HttpStatus.NOT_FOUND,
    message: 'That product couldn’t be found.',
    internal: 'product id not visible to tenant (RLS) or does not exist.',
  },
  'TW-PROD-400-GTIN': {
    code: 'TW-PROD-400-GTIN',
    httpStatus: HttpStatus.BAD_REQUEST,
    message: 'That GTIN isn’t valid — please check the digits (it failed the GS1 check-digit test).',
    internal: 'isValidGtin() false: wrong length or bad mod-10 check digit.',
  },
  'TW-PROD-409-COMMITTED': {
    code: 'TW-PROD-409-COMMITTED',
    httpStatus: HttpStatus.CONFLICT,
    message: 'This product is already committed, so its identity is locked and can’t be changed.',
    internal: 'Attempt to commit an already-committed product (invariant #7).',
  },
  'TW-PROD-409-GTIN-TAKEN': {
    code: 'TW-PROD-409-GTIN-TAKEN',
    httpStatus: HttpStatus.CONFLICT,
    message: 'That GTIN is already assigned to another product in your account.',
    internal: 'unique_violation on product (tenant_id, gtin) partial index.',
  },
  // ---- batch ----
  'TW-BATCH-409-DUP': {
    code: 'TW-BATCH-409-DUP',
    httpStatus: HttpStatus.CONFLICT,
    message: 'A batch with that number already exists for this product.',
    internal: 'unique_violation on batch (tenant_id, product_id, batch_number).',
  },
  'TW-BATCH-400-PRODUCT': {
    code: 'TW-BATCH-400-PRODUCT',
    httpStatus: HttpStatus.BAD_REQUEST,
    message: 'We couldn’t link that batch to a product — the product wasn’t found.',
    internal: 'foreign_key_violation (23503) on batch.product_id.',
  },
  // ---- event ----
  'TW-EVENT-409-IDEMPOTENT': {
    code: 'TW-EVENT-409-IDEMPOTENT',
    httpStatus: HttpStatus.CONFLICT,
    message: 'This event was already recorded, so we didn’t add it again.',
    internal: 'unique_violation on event (tenant_id, idempotency_key) — duplicate replay.',
  },
  // ---- system / infra ----
  'TW-SYS-503-DB': {
    code: 'TW-SYS-503-DB',
    httpStatus: HttpStatus.SERVICE_UNAVAILABLE,
    message: 'The service is briefly unavailable. Your work is safe — please try again in a moment.',
    internal: 'Database unreachable / connection error.',
  },
} as const satisfies Record<string, ErrorDef>;

export type ErrorCode = keyof typeof ERROR_CATALOG;
