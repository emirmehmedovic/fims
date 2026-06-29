import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api/withAuth"
import fs from 'fs'
import path from 'path'

// GET /api/version - Get application version information
export const GET = withAuth(async (req: NextRequest, context, session) => {
  try {
    // Read package.json from project root
    const packageJsonPath = path.join(process.cwd(), 'package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))

    const versionInfo = {
      application: {
        name: packageJson.name || 'fims',
        version: packageJson.version || '1.0.0'
      },
      dependencies: {
        nextjs: packageJson.dependencies?.next || 'unknown',
        react: packageJson.dependencies?.react || 'unknown',
        reactDom: packageJson.dependencies?.['react-dom'] || 'unknown',
        prisma: packageJson.dependencies?.['@prisma/client'] || 'unknown'
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
