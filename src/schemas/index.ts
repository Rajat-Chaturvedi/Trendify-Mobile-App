// Zod schemas for API response validation
// Requirements: 12.6, 12.7

import { z } from 'zod';

export const TrendItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  source: z.string(),
  // Use offset:true to accept both Z and +00:00 formats
  publishedAt: z.string().datetime({ offset: true }),
  imageUrl: z.string().optional().nullable(),
  url: z.string(),
  category: z.enum([
    'technology',
    'sports',
    'finance',
    'entertainment',
    'health',
    'science',
  ]),
  regionCode: z.string().nullable().optional(),
  locale: z.string().nullable().optional(),
  strapiId: z.string().nullable().optional(),
});

export const TrendItemPageSchema = z.object({
  items: z.array(TrendItemSchema),
  nextCursor: z.string().nullable().optional(),
  totalCount: z.number().int().nonnegative(),
});

export const AuthTokenSchema = z.object({
  accessToken: z.string(),
  expiresAt: z.number().int().positive(),
});

// Inferred types (source of truth for schema-validated shapes)
export type TrendItem = z.infer<typeof TrendItemSchema>;
export type TrendItemPage = z.infer<typeof TrendItemPageSchema>;
export type AuthToken = z.infer<typeof AuthTokenSchema>;
