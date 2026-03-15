import { scrapeNykaa }   from './nykaa'
import { scrapePurplle } from './purplle'
import { scrapeTira }    from './tira'
import { PriceComparisonResult, PriceListing } from './types'
import { createServerSupabaseClient } from '../supabase-server'

const CACHE_TTL_HOURS = 12

function buildCacheKey(productName: string, brand: string): string {
  return `${brand}:${productName}:IN`
    .toLowerCase().trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9:\-]/g, '')
    .slice(0, 180)
}

export async function getProductPrices(
  productName: string,
  brand: string,
  forceRefresh = false
): Promise<PriceComparisonResult> {
  const cacheKey = buildCacheKey(productName, brand)

  console.log(`[PriceScraper] Starting search: "${brand} ${productName}"`)

  // 1. Check cache
  if (!forceRefresh) {
    try {
      const supabase = await createServerSupabaseClient()
      const { data } = await supabase
        .from('product_price_cache')
        .select('result_json, cached_at')
        .eq('product_key', cacheKey)
        .single()

      if (data) {
        const ageHours = (Date.now() - new Date(data.cached_at).getTime()) / 3600000
        if (ageHours < CACHE_TTL_HOURS) {
          console.log(`[PriceScraper] Cache hit for "${brand} ${productName}"`)
          return { ...data.result_json, fromCache: true }
        }
      }
    } catch { /* cache miss — continue */ }
  }

  // 2. Run all 3 scrapers in parallel
  const [nykaaRes, purplleRes, tiraRes] = await Promise.allSettled([
    scrapeNykaa(productName, brand),
    scrapePurplle(productName, brand),
    scrapeTira(productName, brand),
  ])

  // 3. Collect results and errors
  const listings: PriceListing[] = []
  const errors: { store: string; error: string }[] = []

  const scrapers = [
    { name: 'Nykaa',       result: nykaaRes   },
    { name: 'Purplle',     result: purplleRes  },
    { name: 'Tira Beauty', result: tiraRes     },
  ]

  for (const { name, result } of scrapers) {
    if (result.status === 'fulfilled' && result.value.success && result.value.listing) {
      listings.push(result.value.listing)
    } else {
      const msg = result.status === 'rejected'
        ? result.reason?.message
        : result.value.error
      errors.push({ store: name, error: msg || 'Unknown error' })
      console.warn(`[PriceScraper] ${name} failed:`, msg)
    }
  }

  console.log(`[PriceScraper] Results:`, {
    nykaa:   nykaaRes.status === 'fulfilled'   ? nykaaRes.value : 'rejected',
    purplle: purplleRes.status === 'fulfilled' ? purplleRes.value : 'rejected',
    tira:    tiraRes.status === 'fulfilled'    ? tiraRes.value : 'rejected',
  })
  console.log(`[PriceScraper] Found ${listings.length} valid listings`)

  listings.forEach(l => {
    console.log(`[PriceScraper] ✓ ${l.storeDisplayName}: ${l.formattedPrice} → ${l.productUrl}`)
  })
  errors.forEach(e => {
    console.log(`[PriceScraper] ✗ ${e.store}: ${e.error}`)
  })

  // 4. Sort by price, mark best
  listings.sort((a, b) => a.price - b.price)
  if (listings.length > 0) listings[0].isBestPrice = true

  // 5. Build result
  const result: PriceComparisonResult = {
    productQuery: `${brand} ${productName}`,
    brand,
    listings,
    bestListing: listings[0] || null,
    totalStoresChecked: 3,
    totalStoresFound: listings.length,
    scrapedAt: new Date().toISOString(),
    fromCache: false,
    errors,
  }

  // 6. Cache if we got anything (fire and forget)
  if (listings.length > 0) {
    createServerSupabaseClient().then(supabase =>
      supabase.from('product_price_cache').upsert(
        { product_key: cacheKey, region: 'IN', result_json: result, cached_at: new Date().toISOString() },
        { onConflict: 'product_key' }
      )
    ).catch(console.error)
  }

  return result
}
