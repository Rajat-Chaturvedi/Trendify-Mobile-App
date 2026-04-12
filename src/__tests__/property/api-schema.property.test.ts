// Feature: trendify, Property 15: Zod schema rejects invalid API responses
// Feature: trendify, Property 16: API serialization round-trip

/**
 * Validates: Requirements 12.6, 12.7
 */

import * as fc from 'fast-check';
import { TrendItemSchema } from '../../schemas/index';

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const categoryArb = fc.constantFrom(
  'technology',
  'sports',
  'finance',
  'entertainment',
  'health',
  'science',
) as fc.Arbitrary<
  'technology' | 'sports' | 'finance' | 'entertainment' | 'health' | 'science'
>;

/** Generates a valid ISO-8601 datetime string accepted by Zod's z.string().datetime() */
const isoDatetimeArb: fc.Arbitrary<string> = fc
  .date({ min: new Date('2000-01-01'), max: new Date('2099-12-31') })
  .map((d) => d.toISOString());

/** Generates a valid URL string */
const urlArb: fc.Arbitrary<string> = fc
  .record({
    host: fc.domain(),
    path: fc.stringOf(fc.char().filter((c) => /[a-z0-9\-_]/.test(c)), {
      minLength: 0,
      maxLength: 20,
    }),
  })
  .map(({ host, path }) => `https://${host}/${path}`);

/** Generates a fully valid TrendItem plain object */
const validTrendItemArb = fc.record({
  id: fc.string({ minLength: 1 }),
  title: fc.string({ minLength: 1 }),
  description: fc.string(),
  source: fc.string({ minLength: 1 }),
  publishedAt: isoDatetimeArb,
  imageUrl: fc.option(urlArb, { nil: undefined }),
  url: urlArb,
  category: categoryArb,
  regionCode: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
});

// ---------------------------------------------------------------------------
// Property 15: Zod schema rejects invalid API responses
// Validates: Requirements 12.6
// ---------------------------------------------------------------------------

describe('Property 15: Zod schema rejects invalid API responses', () => {
  it('rejects objects with missing required fields', () => {
    // Generate a record where each required field is independently omitted
    const requiredFields = [
      'id',
      'title',
      'description',
      'source',
      'publishedAt',
      'url',
      'category',
    ] as const;

    fc.assert(
      fc.property(
        // Pick one required field to omit
        fc.constantFrom(...requiredFields),
        validTrendItemArb,
        (fieldToOmit, item) => {
          const invalid = { ...item } as Record<string, unknown>;
          delete invalid[fieldToOmit];

          const result = TrendItemSchema.safeParse(invalid);
          return result.success === false;
        },
      ),
      { numRuns: 100 },
    );
  });

  it('rejects objects with wrong types for required fields', () => {
    fc.assert(
      fc.property(
        validTrendItemArb,
        // Choose a field to corrupt and a non-string replacement value
        fc.constantFrom('id', 'title', 'description', 'source', 'url'),
        fc.oneof(fc.integer(), fc.boolean(), fc.constant(null), fc.constant([])),
        (item, field, badValue) => {
          const invalid = { ...item, [field]: badValue };
          const result = TrendItemSchema.safeParse(invalid);
          return result.success === false;
        },
      ),
      { numRuns: 100 },
    );
  });

  it('rejects objects with an invalid category value', () => {
    fc.assert(
      fc.property(
        validTrendItemArb,
        // A string that is definitely not a valid category
        fc.string({ minLength: 1 }).filter(
          (s) =>
            !['technology', 'sports', 'finance', 'entertainment', 'health', 'science'].includes(s),
        ),
        (item, badCategory) => {
          const invalid = { ...item, category: badCategory };
          const result = TrendItemSchema.safeParse(invalid);
          return result.success === false;
        },
      ),
      { numRuns: 100 },
    );
  });

  it('rejects objects with a malformed publishedAt (not ISO datetime)', () => {
    fc.assert(
      fc.property(
        validTrendItemArb,
        // A string that is not a valid ISO datetime
        fc.string({ minLength: 1 }).filter((s) => !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(s)),
        (item, badDate) => {
          const invalid = { ...item, publishedAt: badDate };
          const result = TrendItemSchema.safeParse(invalid);
          return result.success === false;
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 16: API serialization round-trip
// Validates: Requirements 12.7
// ---------------------------------------------------------------------------

describe('Property 16: API serialization round-trip', () => {
  it('deserialize(serialize(item)) deeply equals the original item', () => {
    fc.assert(
      fc.property(validTrendItemArb, (item) => {
        // Remove undefined optional fields so JSON round-trip is clean
        const cleanItem = Object.fromEntries(
          Object.entries(item).filter(([, v]) => v !== undefined),
        );

        // serialize: TrendItem → plain JSON payload
        const serialized = JSON.parse(JSON.stringify(cleanItem));

        // deserialize: raw payload → TrendItem via Zod
        const result = TrendItemSchema.safeParse(serialized);

        if (!result.success) {
          return false;
        }

        // The deserialized object must equal the original (sans undefined fields)
        const deserialized = result.data as Record<string, unknown>;
        const keys = Object.keys(cleanItem);
        return keys.every((k) => deserialized[k] === (cleanItem as Record<string, unknown>)[k]);
      }),
      { numRuns: 100 },
    );
  });
});
