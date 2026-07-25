import { z } from 'zod';

/** The 14 v1 event types (data-model §6.2). */
export const EVENT_TYPES = [
  'Commission',
  'Decommission',
  'Aggregate',
  'Disaggregate',
  'Transform',
  'QCHold',
  'Sample',
  'Pack',
  'Store',
  'Dispatch',
  'Receive',
  'Dispense',
  'RejectReturn',
  'Recall',
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

/** Append an event. tenant_id comes from request context, never the body. */
export const createEventSchema = z.object({
  eventType: z.enum(EVENT_TYPES),
  subjectKind: z.enum(['batch', 'unit', 'product', 'logistic_unit']).optional(),
  subjectId: z.string().uuid().optional(),
  subjectLabel: z.string().optional(),
  actor: z.string().optional(),
  location: z.string().optional(),
  quantity: z.number().int().optional(),
  detail: z.string().optional(),
  occurredAt: z.string().datetime().optional(),
  idempotencyKey: z.string().optional(),
  payload: z.record(z.unknown()).optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
