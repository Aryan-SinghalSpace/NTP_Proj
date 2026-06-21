import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import type { FieldEntity } from '@tracewell/field-types';
import { TenantDbService } from '../db/tenant-db.service';
import { fieldDefinition } from '../db/schema';

@Injectable()
export class FieldsService {
  constructor(private readonly db: TenantDbService) {}

  /**
   * Active field definitions for an entity. RLS automatically returns
   * Core/Super (tenant_id IS NULL) plus the current tenant's Custom fields —
   * the query never has to filter by tenant itself.
   */
  listByEntity(entity: FieldEntity) {
    return this.db.run((tx) =>
      tx
        .select()
        .from(fieldDefinition)
        .where(and(eq(fieldDefinition.entity, entity), eq(fieldDefinition.status, 'active'))),
    );
  }
}
