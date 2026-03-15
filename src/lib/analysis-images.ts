import { createClient } from '@/lib/supabase'

export async function getAnalysisImageUrl(
  imagePath: string | null
): Promise<string | null> {
  if (!imagePath) return null

  const supabase = createClient()

  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      console.error('[ImageUrl] No active session')
      return null
    }

    const { data, error } = await supabase.storage
      .from('skin-analyses')
      .createSignedUrl(imagePath, 3600)

    if (error) {
      console.error('[ImageUrl] Signed URL error:', error.message)
      return null
    }

    console.log('[ImageUrl] Generated for path:', imagePath)
    return data.signedUrl
  } catch (err: any) {
    console.error('[ImageUrl] Exception:', err.message)
    return null
  }
}

export async function getAnalysisImageUrls(
  imagePaths: (string | null)[]
): Promise<(string | null)[]> {
  const supabase = createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    console.error('[ImageUrls] No active session')
    return imagePaths.map(() => null)
  }

  const results = await Promise.all(
    imagePaths.map(async (path) => {
      if (!path) return null
      try {
        const { data, error } = await supabase.storage
          .from('skin-analyses')
          .createSignedUrl(path, 3600)
        
        if (error) {
          console.error('[ImageUrls] Failed for path:', path, error.message)
          return null
        }
        console.log('[ImageUrls] Generated for path:', path)
        return data?.signedUrl || null
      } catch (err: any) {
        console.error('[ImageUrls] Exception:', err.message)
        return null
      }
    })
  )

  results.forEach((url, i) => {
    console.log(`[ImageUrls] Signed URL ${i}:`, url ? 'generated' : 'null')
  })

  return results
}

export async function deleteAnalysisImage(imagePath: string): Promise<void> {
  const supabase = createClient()
  try {
    const { error } = await supabase.storage.from('skin-analyses').remove([imagePath])
    if (error) {
      console.error('[ImageDelete] Error:', error.message)
    } else {
      console.log('[ImageDelete] Deleted:', imagePath)
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[ImageDelete]', message)
  }
}
