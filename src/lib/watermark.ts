import type { PageSettings } from '../types'

/** वॉटरमार्क पाठ — 'none' हो तो रिक्त */
export function watermarkOf(page: PageSettings): string {
  if (!page.watermark || page.watermark === 'none') return ''
  if (page.watermark === 'custom') return page.watermarkText || ''
  return page.watermark
}
