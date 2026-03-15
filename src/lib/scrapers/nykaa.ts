import { getBrowserHeaders } from './headers'
import { PriceListing, ScraperResult } from './types'

export async function scrapeNykaa(
  productName: string,
  brand: string
): Promise<ScraperResult> {

  const endpoints = [
    `https://www.nykaa.com/api/2/products/search?` +
      `q=${encodeURIComponent(brand + ' ' + productName)}` +
      `&page_no=1&page_size=8&platform=website`,

    `https://www.nykaa.com/app-api/index.php/products/search?` +
      `q=${encodeURIComponent(brand + ' ' + productName)}` +
      `&page_no=1&page_size=8`,

    `https://www.nykaa.com/api/2/search/products?` +
      `q=${encodeURIComponent(brand + ' ' + productName)}` +
      `&limit=8`,
  ]

  for (const url of endpoints) {
    try {
      const result = await tryNykaaEndpoint(url, productName, brand)
      if (result.success) return result
      console.warn(`[Nykaa] Endpoint failed: ${url.split('?')[0]} — ${result.error}`)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      console.warn(`[Nykaa] Endpoint threw: ${msg}`)
    }
  }

  return { success: false, error: 'Nykaa: all endpoints failed' }
}

async function tryNykaaEndpoint(
  url: string,
  productName: string,
  brand: string
): Promise<ScraperResult> {
  const res = await fetch(url, {
    headers: {
      ...getBrowserHeaders('https://www.nykaa.com/'),
      'Accept': 'application/json, text/plain, */*',
      'X-Requested-With': 'XMLHttpRequest',
      'Origin': 'https://www.nykaa.com',
    },
    signal: AbortSignal.timeout(7000),
  })

  if (!res.ok) return { success: false, error: `HTTP ${res.status}` }

  const ct = res.headers.get('content-type') || ''
  if (!ct.includes('json')) return { success: false, error: 'Not JSON response' }

  const data = await res.json()

  const products: any[] =
    data?.response?.products ||
    data?.products ||
    data?.data?.products ||
    data?.results ||
    data?.data ||
    []

  if (!Array.isArray(products) || products.length === 0) {
    return { success: false, error: 'No products in response' }
  }

  const brandLower = brand.toLowerCase()
  const nameWords  = productName.toLowerCase()
    .split(' ')
    .filter(w => w.length > 3)

  const scored = products.map(p => {
    const title = (p.name || p.title || p.productName || '').toLowerCase()
    const pBrand = (p.brand || p.brandName || '').toLowerCase()
    let score = 0

    if (pBrand === brandLower) score += 6
    if (pBrand.includes(brandLower)) score += 4
    if (title.includes(brandLower)) score += 3

    nameWords.forEach(w => { if (title.includes(w)) score += 2 })

    if (p.inStock === false || p.is_in_stock === 0) score -= 2

    return { p, score }
  })

  scored.sort((a, b) => b.score - a.score)

  if (scored[0].score < 3) {
    return { success: false, error: 'No confident brand match in results' }
  }

  const product = scored[0].p

  const priceRaw =
    product.offer_price ??
    product.selling_price ??
    product.discounted_price ??
    product.salePrice ??
    product.price ??
    null

  const price = priceRaw !== null ? Math.round(parseFloat(String(priceRaw))) : 0

  if (!price || price < 50 || price > 100000) {
    return { success: false, error: `Bad price: ${price}` }
  }

  const mrpRaw = product.mrp ?? product.market_price ?? product.original_price ?? null
  const originalPrice = mrpRaw ? Math.round(parseFloat(String(mrpRaw))) : undefined
  const discountPct = originalPrice && originalPrice > price
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : undefined

  const productUrl = buildNykaaUrl(product, brand, productName)

  return {
    success: true,
    listing: {
      store: 'nykaa',
      storeName: 'nykaa.com',
      storeDisplayName: 'Nykaa',
      logoEmoji: '🛍️',
      price,
      originalPrice: originalPrice && originalPrice > price ? originalPrice : undefined,
      discountPercent: discountPct,
      currencySymbol: '₹',
      formattedPrice: `₹${price.toLocaleString('en-IN')}`,
      productUrl,
      productTitle: product.name || product.title || `${brand} ${productName}`,
      imageUrl: product.images?.[0] || product.image_url || product.thumbnail || undefined,
      inStock: product.inStock !== false && product.is_in_stock !== 0,
      isBestPrice: false,
      scrapedAt: new Date().toISOString(),
    }
  }
}

function buildNykaaUrl(product: any, brand: string, productName: string): string {
  const directUrl = product.url || product.product_url || product.pdp_url
  if (directUrl) {
    if (directUrl.startsWith('http')) return directUrl
    if (directUrl.startsWith('/')) return `https://www.nykaa.com${directUrl}`
  }

  const slug = product.slug || product.url_key || product.name_slug
  const id   = product.id || product.product_id || product.productId

  if (slug && id) {
    const cleanSlug = slug.replace(/^\//, '').replace(/\/$/, '')
    return `https://www.nykaa.com/${cleanSlug}/p/${id}?productId=${id}`
  }

  if (slug) {
    return `https://www.nykaa.com/${slug.replace(/^\//, '')}`
  }

  if (id) {
    return `https://www.nykaa.com/p/${id}`
  }

  const q = encodeURIComponent(`${brand} ${productName}`)
  return `https://www.nykaa.com/search/result/?q=${q}&ptype=product`
}
