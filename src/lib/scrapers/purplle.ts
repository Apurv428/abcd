import * as cheerio from 'cheerio'
import { getBrowserHeaders, randomDelay } from './headers'
import { PriceListing, ScraperResult } from './types'

export async function scrapePurplle(
  productName: string,
  brand: string
): Promise<ScraperResult> {
  try {
    const query = encodeURIComponent(`${brand} ${productName}`)
    const searchUrl = `https://www.purplle.com/search?q=${query}&type=product`

    await randomDelay(100, 400)

    const res = await fetch(searchUrl, {
      headers: getBrowserHeaders('https://www.purplle.com/'),
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) {
      return { success: false, error: `Purplle returned ${res.status}` }
    }

    const html = await res.text()

    if (html.length < 1500) {
      return { success: false, error: 'Purplle: response too short, likely blocked' }
    }

    const $ = cheerio.load(html)

    const productCard = $(
      '.product-card, [class*="product-card"], [class*="productCard"], [data-product-id]'
    ).first()

    if (!productCard.length) {
      const priceMatch = html.match(/₹\s*([0-9,]+)/)
      const linkMatch = html.match(/href="(\/product\/[^"]+)"/)
      if (priceMatch && linkMatch) {
        const price = parseInt(priceMatch[1].replace(',', ''))
        const productUrl = `https://www.purplle.com${linkMatch[1]}`
        return {
          success: true,
          listing: buildPurpllleListing(price, `${brand} ${productName}`, productUrl, undefined)
        }
      }
      return { success: false, error: 'Purplle: no products found' }
    }

    const priceEl = productCard.find(
      '[class*="price"]:not([class*="original"]):not([class*="mrp"]), .price'
    ).first()
    
    let priceText = priceEl.text().trim()

    if (!priceText.includes('₹') && !priceText.match(/[0-9]+/)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
      productCard.find('*').each((_: unknown, el: any) => {
        const t = $(el).text().trim()
        if (t.match(/^₹\s*[0-9,]+$/) && t.length < 12) {
          priceText = t
          return false
        }
      })
    }

    let price = parseInt(priceText.replace(/[^0-9]/g, ''))
    if (!price || price < 10 || price > 100000) {
      return { success: false, error: 'Purplle: invalid price extracted' }
    }

    // Reject suspicious round numbers that likely came from UI elements
    if (price % 500 === 0 && price <= 1000) {
      const specificMatch = html.match(/₹\s*([1-9][0-9]{2,3}(?:\.[0-9]{2})?)/g)
      const validPrices = specificMatch
        ?.map(m => parseInt(m.replace(/[^0-9]/g, '')))
        .filter(p => p > 99 && p < 50000 && p % 500 !== 0)
      
      if (validPrices && validPrices.length > 0) {
        const priceFreq: Record<number, number> = {}
        validPrices.forEach(p => { priceFreq[p] = (priceFreq[p] || 0) + 1 })
        const mostCommon = Object.entries(priceFreq).sort((a, b) => b[1] - a[1])[0]
        const correctedPrice = parseInt(mostCommon[0])
        
        if (correctedPrice > 99 && correctedPrice < 50000) {
          price = correctedPrice
        } else {
          return { success: false, error: 'Purplle: could not extract reliable price' }
        }
      } else {
        return { success: false, error: 'Purplle: price looks like UI element (₹500)' }
      }
    }

    const mrpEl = productCard.find('[class*="mrp"], [class*="original"], del, s').first()
    const originalPrice = mrpEl.length
      ? parseInt(mrpEl.text().replace(/[^0-9]/g, ''))
      : undefined

    let href = productCard.find('a[href*="/product/"]').first().attr('href')
      || productCard.find('a').first().attr('href')
    
    let productUrl = href?.startsWith('http') 
      ? href 
      : href ? `https://www.purplle.com${href}` : ''

    // Validate product URL
    const isValidProductUrl = productUrl.includes('/product/') || 
                              productUrl.includes('/p/') ||
                              (productUrl !== 'https://www.purplle.com' && 
                               productUrl !== 'https://www.purplle.com/')

    if (!isValidProductUrl || !productUrl) {
      productUrl = `https://www.purplle.com/search?q=${encodeURIComponent(brand + ' ' + productName)}`
    }

    const title = productCard.find('[class*="title"], [class*="name"], h3, p')
      .first().text().trim() || `${brand} ${productName}`

    const imageUrl = productCard.find('img').first().attr('src') 
      || productCard.find('img').first().attr('data-src')
      || undefined

    const discountPercent = originalPrice && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : undefined

    return {
      success: true,
      listing: buildPurpllleListing(price, title, productUrl, imageUrl, originalPrice, discountPercent)
    }

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: `Purplle: ${message}` }
  }
}

function buildPurpllleListing(
  price: number,
  title: string,
  url: string,
  imageUrl?: string,
  originalPrice?: number,
  discountPercent?: number
): PriceListing {
  return {
    store: 'purplle',
    storeName: 'purplle.com',
    storeDisplayName: 'Purplle',
    logoEmoji: '💜',
    price,
    originalPrice,
    discountPercent,
    currencySymbol: '₹',
    formattedPrice: `₹${price.toLocaleString('en-IN')}`,
    productUrl: url,
    productTitle: title,
    imageUrl,
    inStock: true,
    isBestPrice: false,
    scrapedAt: new Date().toISOString(),
  }
}
