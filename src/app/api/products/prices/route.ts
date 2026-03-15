import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getProductPrices } from '@/lib/scrapers'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { productName, brand, forceRefresh = false } = body

    if (!productName || !brand) {
      return NextResponse.json(
        { error: 'productName and brand are required' },
        { status: 400 }
      )
    }

    const cleanName  = String(productName).slice(0, 100).trim()
    const cleanBrand = String(brand).slice(0, 50).trim()

    const result = await getProductPrices(cleanName, cleanBrand, forceRefresh)
    return NextResponse.json(result)

  } catch (err: unknown) {
    console.error('[/api/products/prices]', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Price lookup failed', details: message },
      { status: 500 }
    )
  }
}
