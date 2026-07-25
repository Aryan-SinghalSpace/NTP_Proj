import { z } from 'zod';

const crud = z.object({
  create: z.boolean(),
  read: z.boolean(),
  update: z.boolean(),
  delete: z.boolean(),
});
const permissions = z.record(crud);

export const createRoleSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().optional(),
  permissions: permissions.optional(),
});
export type CreateRoleInput = z.infer<typeof createRoleSchema>;

export const updateRoleSchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().trim().optional(),
  permissions: permissions.optional(),
});
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;

export const createUserSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  roleId: z.string().uuid().optional(),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;
