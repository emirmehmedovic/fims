import { NextResponse } from 'next/server'

export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json({
    success: true,
    data
  }, { status })
}

export function errorResponse(error: string, status: number = 400, details?: any) {
  const response: any = {
    success: false,
    error
  }

  if (details) {
    response.details = details
  }

  return NextResponse.json(response, { status })
}

export function paginatedResponse<T>(
  items: T[],
  pagination: {
    total: number
    page: number
    limit: number
  }
) {
  return NextResponse.json({
    success: true,
    data: {
      items,
      pagination: {
        ...pagination,
        totalPages: Math.ceil(pagination.total / pagination.limit)
      }
    }
  })
}
