import { z } from 'zod';

export const cartItemSchema = z.object({
  body: z.object({
    productId: z.string().min(1),
    productName: z.string().min(1),
    category: z.string().min(1),
    quantity: z.number().int().min(0, 'Quantity cannot be negative. Set to 0 to remove.'), // 0 means remove item
    unitPrice: z.number().min(0, 'Unit price must be positive'),
    metadata: z.record(z.string(), z.any()).optional(),
  }),
});
