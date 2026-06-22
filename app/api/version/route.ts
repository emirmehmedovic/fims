import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api/withAuth"

// GET /api/version - Get application version information
export const GET = withAuth(async (req: NextRequest, context, session) => {
  try {
    // Read package.json to get versions
    const packageJson = require('@/../package.json')

    const versionInfo = {
      application: {
        name: packageJson.name,
        version: packageJson.version
      },
      dependencies: {
        nextjs: packageJson.dependencies.next,
        react: packageJson.dependencies.react,
        reactDom: packageJson.dependencies['react-dom'],
        prisma: packageJson.dependencies['@prisma/client']
      },
      environment: process.env.NODE_ENV,
      nodeVersion: process.version,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      data: versionInfo
    })
  } catch (error) {
    console.error('Error fetching version info:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch version info' },
      { status: 500 }
    )
  }
}, ['SUPER_ADMIN', 'ADMIN'])
