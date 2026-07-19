// Template marketplace — community-curated template definitions.
// In production this could be fetched from a JSON endpoint or GitHub repo.

import type { Template } from './templates'

export interface CommunityTemplate extends Template {
  author: string
  tags: string[]
  downloads: number
  thumbnail: string // data URL or relative path
}

export const COMMUNITY_TEMPLATES: CommunityTemplate[] = [
  {
    id: 'comic-3panel',
    titleKey: 'template.comic',
    gridId: '3-vertical',
    boardWidth: 1200,
    boardHeight: 600,
    gridGap: 4,
    gridRadius: 2,
    author: 'PicCollage Team',
    tags: ['comic', 'story', 'social'],
    downloads: 12840,
    thumbnail: '',
  },
  {
    id: 'travel-mood',
    titleKey: 'template.travel',
    gridId: '4-grid',
    boardWidth: 1080,
    boardHeight: 1080,
    gridGap: 8,
    gridRadius: 12,
    author: 'Wanderlust Designs',
    tags: ['travel', 'mood', 'instagram'],
    downloads: 5620,
    thumbnail: '',
  },
  {
    id: 'family-wall',
    titleKey: 'template.family',
    gridId: '4-pinwheel',
    boardWidth: 1200,
    boardHeight: 800,
    gridGap: 6,
    gridRadius: 8,
    author: 'HomeStudio',
    tags: ['family', 'memories', 'print'],
    downloads: 3400,
    thumbnail: '',
  },
  {
    id: 'recipe-card',
    titleKey: 'template.recipe',
    gridId: '2-vertical',
    boardWidth: 800,
    boardHeight: 1200,
    gridGap: 0,
    gridRadius: 16,
    author: 'KitchenCraft',
    tags: ['food', 'recipe', 'pinterest'],
    downloads: 8900,
    thumbnail: '',
  },
]

export function getCommunityTemplates(filter?: string): CommunityTemplate[] {
  if (!filter) return COMMUNITY_TEMPLATES
  const f = filter.toLowerCase()
  return COMMUNITY_TEMPLATES.filter(
    (t) =>
      t.titleKey.toLowerCase().includes(f) ||
      t.tags.some((tag) => tag.toLowerCase().includes(f)) ||
      t.author.toLowerCase().includes(f),
  )
}
