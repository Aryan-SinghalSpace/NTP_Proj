import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/all-exceptions.filter';
import { LoggingInterceptor } from '../src/common/logging.interceptor';

const ACME = '00000000-0000-0000-0000-000000000001';

describe('API e2e — full Nest app (middleware + RLS + error envelope)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(new LoggingInterceptor());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());

  it('GET /api/health → ok', async () => {
    const res = await http().get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('scopes products by x-tenant-id and echoes x-request-id', async () => {
    const res = await http().get('/api/products').set('x-tenant-id', ACME);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0); // Acme is seeded
    expect(res.headers['x-request-id']).toBeTruthy();
  });

  it('no tenant header → RLS returns an empty set', async () => {
    const res = await http().get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('a different tenant cannot see Acme products (RLS isolation)', async () => {
    const res = await http().get('/api/products').set('x-tenant-id', '000000ff-0000-0000-0000-0000000000ff');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('a not-found id returns the friendly, stack-free error envelope', async () => {
    const res = await http().get('/api/products/11111111-1111-1111-1111-111111111111').set('x-tenant-id', ACME);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('TW-PROD-404');
    expect(res.body.error.message).toMatch(/couldn.t be found/i);
    expect(res.body.error.requestId).toBeTruthy();
    expect(res.body.error).not.toHaveProperty('stack');
  });

  it('validation errors return TW-GEN-400 with field details', async () => {
    const res = await http().post('/api/products').set('x-tenant-id', ACME).send({ name: '' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('TW-GEN-400');
    expect(Array.isArray(res.body.error.details)).toBe(true);
  });

  it('a malformed uuid in the path → friendly 400 (not a 500)', async () => {
    const res = await http().get('/api/products/not-a-uuid').set('x-tenant-id', ACME);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('TW-GEN-400');
  });

  it('admin endpoints require the platform role → 403 without x-platform', async () => {
    const res = await http().get('/api/admin/tenants').set('x-tenant-id', ACME);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('TW-TENANT-403');
  });
});
