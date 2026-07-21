export type Platform = 'instagram' | 'twitter' | 'pinterest' | 'original'

const LIMITS: Record<Platform, number> = {
  instagram: 8 * 1024 * 1024, // 8MB
  twitter: 5 * 1024 * 1024,   // 5MB
  pinterest: 10 * 1024 * 1024, // 10MB
  original: Infinity,
}

export function getPlatformLimit(platform: Platform): number {
  return LIMITS[platform]
}

export function suggestPlatform(fileSizeBytes: number): Platform {
  if (fileSizeBytes <= LIMITS.twitter) return 'twitter'
  if (fileSizeBytes <= LIMITS.instagram) return 'instagram'
  if (fileSizeBytes <= LIMITS.pinterest) return 'pinterest'
  return 'original'
}
