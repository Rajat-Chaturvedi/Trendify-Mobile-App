// Zod schemas for API response validation
// Requirements: 12.6, 12.7

import { z } from 'zod';

export const TrendItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  source: z.string(),
  publishedAt: z.string().datetime(),
  imageUrl: z.string().url().optional().nullable(),
  url: z.string().url(),
  category: z.enum([
    'technology',
    'sports',
    'finance',
    'entertainment',
    'health',
    'science',
  ]),
  regionCode: z.string().optional(),
  locale: z.string().optional(),    // returned by real API
  strapiId: z.string().optional(),  // returned by real API
});

export const TrendItemPageSchema = z.object({
  items: z.array(TrendItemSchema),
  nextCursor: z.string().optional(),
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
