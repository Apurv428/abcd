'use client'
import { useState } from 'react'
import { PriceComparisonResult } from '@/lib/scrapers/types'

interface ProductPricePanelProps {
  productName: string
  brand: string
}

export default function ProductPricePanel({ productName, brand }: ProductPricePanelProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [data, setData] = useState<PriceComparisonResult | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function fetchPrices(forceRefresh = false) {
    setState('loading')
    setError(null)
    try {
      const res = await fetch('/api/products/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName, brand, forceRefresh }),
      })
      if (!res.ok) throw new Error('Request failed')
      const json: PriceComparisonResult = await res.json()
      setData(json)
      setState('done')
    } catch (err: unknown) {
      setError('Could not fetch prices. Try again.')
      setState('error')
    }
  }

  if (state === 'idle') {
    return (
      <button
        onClick={() => fetchPrices()}
        style={{
          width: '100%',
          padding: '8px 0',
          background: 'rgba(45,212,191,0.07)',
          border: '1px solid rgba(45,212,191,0.3)',
          borderRadius: '8px',
          color: '#2dd4bf',
          fontSize: '12px',
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'background 0.2s',
          marginTop: '10px',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(45,212,191,0.14)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(45,212,191,0.07)')}
      >
        🔍 Find Best Price in India
      </button>
    )
  }

  if (state === 'loading') {
    return (
      <div style={{
        marginTop: '10px',
        padding: '14px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '10px',
        fontSize: '12px',
        color: '#8892a4',
        textAlign: 'center',
      }}>
        <div style={{ marginBottom: '8px' }}>
          Checking Nykaa · Purplle · Tira · Amazon.in...
        </div>
        {[1,2,3].map(i => (
          <div key={i} style={{
            height: '36px',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: '6px',
            marginBottom: '6px',
            animation: 'shimmer 1.5s infinite',
          }}/>
        ))}
        <style>{`
          @keyframes shimmer {
            0%,100%{opacity:0.4} 50%{opacity:0.8}
          }
        `}</style>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div style={{
        marginTop: '10px',
        padding: '10px 12px',
        background: 'rgba(234,179,8,0.07)',
        border: '1px solid rgba(234,179,8,0.2)',
        borderRadius: '8px',
        fontSize: '12px',
        color: '#ca8a04',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span>⚠️ {error}</span>
        <button
          onClick={() => fetchPrices()}
          style={{ background: 'none', border: 'none', color: '#2dd4bf', cursor: 'pointer', fontSize: '12px' }}
        >
          Retry
        </button>
      </div>
    )
  }

  if (state === 'done' && (!data || data.listings.length === 0)) {
    return (
      <div style={{
        marginTop: '10px',
        padding: '10px 12px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '8px',
        fontSize: '12px',
        color: '#8892a4',
        textAlign: 'center',
      }}>
        Product not found on Indian stores right now.
        <button
          onClick={() => fetchPrices(true)}
          style={{ display: 'block', margin: '6px auto 0', background: 'none', border: 'none', color: '#2dd4bf', cursor: 'pointer', fontSize: '11px' }}
        >
          Retry ↺
        </button>
      </div>
    )
  }

  const best = data!.bestListing!
  const others = data!.listings.filter(l => l.store !== best.store)
  const displayed = showAll ? others : others.slice(0, 2)
  const cacheAge = data?.fromCache
    ? Math.round((Date.now() - new Date(data.scrapedAt).getTime()) / 60000)
    : null

  return (
    <div style={{ marginTop: '10px' }}>

      <a
        href={best.productUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: 'none', display: 'block' }}
      >
        <div style={{
          padding: '12px 14px',
          background: 'linear-gradient(135deg, rgba(45,212,191,0.10), rgba(45,212,191,0.04))',
          border: '1px solid rgba(45,212,191,0.28)',
          borderRadius: '10px',
          marginBottom: '8px',
          cursor: 'pointer',
          transition: 'border-color 0.2s',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span style={{
                fontSize: '10px', fontWeight: 600,
                background: '#2dd4bf', color: '#060612',
                padding: '1px 7px', borderRadius: '10px',
              }}>
                🏆 BEST PRICE
              </span>
            </div>
            <span style={{ fontSize: '10px', color: '#8892a4' }}>
              {best.logoEmoji} {best.storeDisplayName}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '22px', fontWeight: 600, color: '#2dd4bf' }}>
              {best.formattedPrice}
            </span>
            {best.originalPrice && best.originalPrice > best.price && (
              <>
                <span style={{ fontSize: '13px', color: '#8892a4', textDecoration: 'line-through' }}>
                  ₹{best.originalPrice.toLocaleString('en-IN')}
                </span>
                {best.discountPercent && (
                  <span style={{
                    fontSize: '11px', fontWeight: 600,
                    color: '#4ade80', background: 'rgba(74,222,128,0.1)',
                    padding: '1px 6px', borderRadius: '4px',
                  }}>
                    {best.discountPercent}% off
                  </span>
                )}
              </>
            )}
          </div>
          <div style={{ fontSize: '11px', color: '#2dd4bf', marginTop: '6px' }}>
            Buy on {best.storeDisplayName} →
          </div>
        </div>
      </a>

      {displayed.length > 0 && (
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '8px',
          overflow: 'hidden',
          marginBottom: '6px',
        }}>
          {displayed.map((listing, i) => (
            <a
              key={listing.store}
              href={listing.productUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 12px',
                borderBottom: i < displayed.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                textDecoration: 'none',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ fontSize: '12px', color: '#c8d0db' }}>
                {listing.logoEmoji} {listing.storeDisplayName}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#f0f4ff' }}>
                  {listing.formattedPrice}
                </span>
                <span style={{ fontSize: '11px', color: '#2dd4bf' }}>View →</span>
              </div>
            </a>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {others.length > 2 && (
            <button
              onClick={() => setShowAll(s => !s)}
              style={{ background: 'none', border: 'none', color: '#8892a4', cursor: 'pointer', fontSize: '11px' }}
            >
              {showAll ? 'Show less ↑' : `+${others.length - 2} more stores ↓`}
            </button>
          )}
          {data!.errors.length > 0 && (
            <span style={{ fontSize: '10px', color: '#8892a4' }}>
              {data!.errors.length} store{data!.errors.length > 1 ? 's' : ''} unavailable
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', color: '#8892a4' }}>
            {cacheAge !== null ? `🕒 ${cacheAge}m ago` : '⚡ Live'}
          </span>
          <button
            onClick={() => fetchPrices(true)}
            style={{ background: 'none', border: 'none', color: '#8892a4', cursor: 'pointer', fontSize: '11px' }}
            title="Refresh prices"
          >
            ↺
          </button>
        </div>
      </div>

    </div>
  )
}
