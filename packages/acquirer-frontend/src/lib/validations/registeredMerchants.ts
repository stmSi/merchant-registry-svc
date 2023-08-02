import { z } from 'zod'

export type RegisteredMerchants = z.infer<typeof registeredMerchantsSchema>

export const registeredMerchantsSchema = z.object({
  addedBy: z.string().optional(),
  approvedBy: z.string().optional(),
  addedTime: z.string().optional(),
  updatedTime: z.string().optional(),
  dabName: z.string().optional(),
  merchantId: z.string().optional(),
  payintoId: z.string().optional(),
  registrationStatus: z
    .union([z.literal('approved'), z.literal('pending'), z.literal('rejected')])
    .or(z.null()),
})