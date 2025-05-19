import { z } from 'zod';

const identifyRequestSchema = z.object({
  email: z.string().email().nullable().optional(),
  phoneNumber: z.string().nullable().optional(),
}).refine(data => data.email !== null || data.phoneNumber !== null, {
  message: 'Either email or phoneNumber must be provided',
});

export function validateIdentifyRequest(body: any): { email: string | null, phoneNumber: string | null } {
  const result = identifyRequestSchema.safeParse(body);
  
  if (!result.success) {
    throw new Error(result.error.errors.map(e => e.message).join(', '));
  }
  
  return {
    email: result.data.email ?? null,
    phoneNumber: result.data.phoneNumber ?? null,
  };
}