export type FuelDocumentKind = 'compliance' | 'additive' | 'receipt'

// The authenticated exporting user determines the mark, not the entry's author.
export function documentMark(kind: FuelDocumentKind, role: string): 'pecat.png' | 'potpis.png' | null {
  if (kind === 'receipt') return null
  if (role === 'ADMIN' || role === 'SUPER_ADMIN') return 'pecat.png'
  if (kind === 'compliance' && (role === 'OPERATOR' || role === 'PUMPA')) return 'potpis.png'
  return null
}
