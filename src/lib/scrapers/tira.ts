import { getBrowserHeaders } from './headers'
import { PriceListing, ScraperResult } from './types'

export async function scrapeTira(
  productName: string,
  brand: string
): Promise<ScraperResult> {
  try {
    const query = encodeURIComponent(`${brand} ${productName}`)

    const searchEndpoint =
      `https://www.tirabeauty.com/search/suggest.json` +
      `?q=${query}` +
      `&resources[type]=product` +
      `&resources[limit]=8` +
      `&resources[options][unavailable_products]=last` +
      `&resources[options][fields]=title,variants.price,variants.compare_at_price,handle,vendor`

    const res = await fetch(searchEndpoint, {
      headers: {
        ...getBrowserHeaders('https://www.tirabeauty.com/'),
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) {
      return { success: false, error: `Tira: HTTP ${res.status}` }
    }

    const data = await res.json()
    const products = data?.resources?.results?.products || []

    if (!products.length) {
      return { success: false, error: 'Tira: no products found' }
    }

    const brandLower = brand.toLowerCase()
    const nameWords  = productName.toLowerCase()
      .split(' ')
      .filter(w => w.length > 3)

    const scored = products.map((p: any) => {
      const title  = (p.title || '').toLowerCase()
      const vendor = (p.vendor || '').toLowerCase()
      let score = 0

      if (vendor.includes(brandLower)) score += 5
      if (title.includes(brandLower))  score += 3

      nameWords.forEach(w => {
        if (title.includes(w)) score += 2
      })

      if (title.length < 10) score -= 5

      const priceRaw = parseFloat(p.price || p.variants?.[0]?.price || '0')
      if (priceRaw < 200) score -= 3

      return { p, score }
    })

    scored.sort((a: any, b: any) => b.score - a.score)

    if (scored[0].score < 2) {
      return { success: false, error: 'Tira: no confident product match found' }
    }

    const best = scored[0].p

    const priceStr = best.price || best.variants?.[0]?.price || '0'
    const price    = Math.round(parseFloat(priceStr))

    if (!price || price < 50 || price > 100000) {
      return { success: false, error: `Tira: price ${price} out of valid range` }
    }

    const compareStr    = best.compare_at_price || best.variants?.[0]?.compare_at_price
    const originalPrice = compareStr ? Math.round(parseFloat(compareStr)) : undefined
    const discountPct   = originalPrice && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : undefined

    const handle     = best.handle || best.url?.replace('/products/', '').split('?')[0]
    const productUrl = handle
      ? `https://www.tirabeauty.com/products/${handle}`
      : `https://www.tirabeauty.com/search?q=${query}`

    if (!productUrl.includes('/products/')) {
      return { success: false, error: 'Tira: could not build valid product URL' }
    }

    const imageUrl = best.image || best.featured_image || undefined

    return {
      success: true,
      listing: {
        store: 'tira',
        storeName: 'tirabeauty.com',
        storeDisplayName: 'Tira Beauty',
        logoEmoji: '✨',
        price,
        originalPrice: originalPrice && originalPrice > price ? originalPrice : undefined,
        discountPercent: discountPct,
        currencySymbol: '₹',
        formattedPrice: `₹${price.toLocaleString('en-IN')}`,
        productUrl,
        productTitle: best.title || `${brand} ${productName}`,
        imageUrl,
        inStock: best.available !== false,
        isBestPrice: false,
        scrapedAt: new Date().toISOString(),
      }
    }

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: `Tira: ${message}` }
  }
}
