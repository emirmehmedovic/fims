import { withAuth } from '@/lib/api/withAuth'
import { successResponse, errorResponse } from '@/lib/api/response'
import { prisma } from '@/lib/prisma'
import { guideKey, FUEL_ENTRY_GUIDE_VERSION } from '@/lib/onboarding/fuel-entry-guide'
import { logger } from '@/lib/utils/logger'

export const GET = withAuth(async (_req, _context, session) => {
  try {
    const completion = await prisma.userGuideCompletion.findUnique({
      where: { userId_guideKey: { userId: session.user.id, guideKey: guideKey(session.user.role) } },
      select: { completedAt: true },
    })
    return successResponse({ completed: Boolean(completion), version: FUEL_ENTRY_GUIDE_VERSION })
  } catch (error) {
    logger.error('Cannot read fuel entry guide completion', error)
    return errorResponse('Status vodiča trenutno nije dostupan.', 503)
  }
}, ['OPERATOR', 'PUMPA'])

export const POST = withAuth(async (req, _context, session) => {
  const body = await req.json().catch(() => null)
  if (body?.version !== FUEL_ENTRY_GUIDE_VERSION) return errorResponse('Osvježite stranicu kako biste otvorili aktuelni vodič.', 400)
  try {
    const key = { userId: session.user.id, guideKey: guideKey(session.user.role) }
    await prisma.userGuideCompletion.upsert({ where: { userId_guideKey: key }, create: key, update: {} })
    return successResponse({ completed: true })
  } catch (error) {
    logger.error('Cannot save fuel entry guide completion', error)
    return errorResponse('Završetak vodiča nije spremljen. Pokušajte ponovo.', 503)
  }
}, ['OPERATOR', 'PUMPA'])
