import type { CourtKey, TemplateDef } from '../types'
import { TEMPLATES_BAIL } from './templates1'
import { TEMPLATES_TRIAL } from './templates2'
import { TEMPLATES_APPEAL } from './templates3'

export const TEMPLATES: TemplateDef[] = [...TEMPLATES_BAIL, ...TEMPLATES_TRIAL, ...TEMPLATES_APPEAL]

export const TEMPLATE_CATEGORIES = [
  'सभी',
  ...Array.from(new Set(TEMPLATES.map((t) => t.category))),
]

export const templateById = (id: string) => TEMPLATES.find((t) => t.id === id)

export function templatesForCourt(court: CourtKey): TemplateDef[] {
  return TEMPLATES.filter((t) => t.courts.includes(court))
}

export function searchTemplates(q: string, cat = 'सभी'): TemplateDef[] {
  const n = q.trim().toLowerCase()
  return TEMPLATES.filter((t) => {
    if (cat !== 'सभी' && t.category !== cat) return false
    if (!n) return true
    return `${t.title} ${t.subtitle} ${t.tags} ${t.statute} ${t.useWhen}`.toLowerCase().includes(n)
  })
}
