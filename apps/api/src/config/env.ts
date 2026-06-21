import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(4000),
  WEB_ORIGIN: z.string().default('http://localhost:3000'),
  DATABASE_URL: z
    .string()
    .default('postgres://tracewell_app:tracewell_app@localhost:5432/tracewell'),
  MIGRATION_DATABASE_URL: z
    .string()
    .default('postgres://tracewell:tracewell@localhost:5432/tracewell'),
});

export const env = schema.parse(process.env);
export type Env = z.infer<typeof schema>;
