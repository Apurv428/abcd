export type StoreName = 'nykaa' | 'purplle' | 'tira'

export interface PriceListing {
  store: StoreName
  storeName: string
  storeDisplayName: string
  logoEmoji: string
  price: number
  originalPrice?: number
  discountPercent?: number
  currencySymbol: string
  formattedPrice: string
  productUrl: string
  productTitle: string
  imageUrl?: string
  inStock: boolean
  isBestPrice: boolean
  scrapedAt: string
}

export interface PriceComparisonResult {
  productQuery: string
  brand: string
  listings: PriceListing[]
  bestListing: PriceListing | null
  totalStoresChecked: number
  totalStoresFound: number
  scrapedAt: string
  fromCache: boolean
  errors: { store: string; error: string }[]
}

export interface ScraperResult {
  success: boolean
  listing?: PriceListing
  error?: string
}
