import { z, type ZodType } from 'zod'

const companySummarySchema = z.object({
  ticker: z.string(),
  name: z.string(),
  sector: z.string().nullable(),
  last_price: z.number().nullable(),
  change_pct: z.number().nullable(),
  day_high: z.number().nullable(),
  day_low: z.number().nullable(),
  volume: z.number().nullable(),
  market_cap: z.number().nullable(),
  currency: z.string().nullable(),
  price_updated_at: z.string().nullable(),
  previous_close: z.number().nullable().optional(),
  absolute_change: z.number().nullable().optional(),
  change_window: z.string().nullable().optional(),
  market_status: z.string().nullable().optional(),
  is_stale: z.boolean().optional(),
  as_of: z.string().nullable().optional(),
  previous_close_as_of: z.string().nullable().optional(),
})

export const companySummaryResponseSchema = z.object({
  data: z.array(companySummarySchema),
  total: z.number().int().nonnegative(),
})

export const stockQuoteResponseSchema = z.object({
  ticker: z.string(),
  price: z.number(),
  previous_close: z.number().nullable(),
  absolute_change: z.number().nullable(),
  change_pct: z.number().nullable(),
  as_of: z.string().nullable(),
  previous_close_as_of: z.string().nullable(),
  market_status: z.string(),
  is_stale: z.boolean(),
  change_window: z.string(),
  interval: z.string(),
})

export const favoritesResponseSchema = z.object({
  favorites: z.array(z.string()),
})

export const newsItemsSchema = z.array(z.object({
  url: z.string(),
  title: z.string(),
  lang: z.string().nullable(),
  date: z.string().nullable(),
}))

export const announcementsResponseSchema = z.object({
  announcements: z.array(z.object({
    id: z.number(),
    title: z.string(),
    content: z.string(),
    sent_by: z.union([z.string(), z.number()]).nullable(),
    created_at: z.string(),
    updated_at: z.string(),
    is_unread: z.boolean(),
  })),
})

export function parseApi<T>(schema: ZodType<T>, data: unknown): T {
  return schema.parse(data)
}
