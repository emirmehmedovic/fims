import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/withAuth"
import { successResponse, errorResponse } from "@/lib/api/response"

export const GET = withAuth(async (req: NextRequest, context, session) => {
  try {
    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || '6months' // 1month, 3months, 6months, 1year

    // Calculate date range
    const now = new Date()
    let startDate: Date

    switch (period) {
      case '1month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
        break
      case '3months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
        break
      case '6months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
        break
      case '1year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
    }

    // Generate all months in range
    const allMonths: string[] = []
    const current = new Date(startDate)
    while (current <= now) {
      allMonths.push(`${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`)
      current.setMonth(current.getMonth() + 1)
    }

    const outlierThreshold = 2
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const lastYearMonthStart = new Date(now.getFullYear() - 1, now.getMonth(), 1)
    const lastYearMonthEnd = new Date(now.getFullYear() - 1, now.getMonth() + 1, 1)

    const [
      warehouseMonthRows,
      supplierRows,
      transporterRows,
      productRows,
      countryRows,
      monthlyTotalsRows,
      characteristicRows,
      hqTrendRows,
      locationRows,
      labRows,
      driverRows,
      dayRows,
      lastYearRows,
      documentationRows,
      inactiveWarehouseRows,
      outlierRows,
      summaryRows
    ] = await Promise.all([
      prisma.$queryRaw<{ id: string, name: string, code: string, month: string, quantity: number }[]>`
        SELECT fe.warehouse_id AS id,
               w.name AS name,
               w.code AS code,
               to_char(date_trunc('month', fe.entry_date), 'YYYY-MM') AS month,
               SUM(fe.quantity)::int AS quantity
        FROM fuel_entries fe
        JOIN warehouses w ON w.id = fe.warehouse_id
        WHERE fe.entry_date >= ${startDate} AND fe.is_active = true
        GROUP BY fe.warehouse_id, w.name, w.code, month
        ORDER BY w.name, month
      `,
      prisma.$queryRaw<{ id: string, name: string, code: string, quantity: number, count: number }[]>`
        SELECT s.id AS id,
               s.name AS name,
               s.code AS code,
               SUM(fe.quantity)::int AS quantity,
               COUNT(*)::int AS count
        FROM fuel_entries fe
        JOIN suppliers s ON s.id = fe.supplier_id
        WHERE fe.entry_date >= ${startDate} AND fe.is_active = true
        GROUP BY s.id, s.name, s.code
        ORDER BY quantity DESC
      `,
      prisma.$queryRaw<{ id: string, name: string, code: string, quantity: number, count: number }[]>`
        SELECT t.id AS id,
               t.name AS name,
               t.code AS code,
               SUM(fe.quantity)::int AS quantity,
               COUNT(*)::int AS count
        FROM fuel_entries fe
        JOIN transporters t ON t.id = fe.transporter_id
        WHERE fe.entry_date >= ${startDate} AND fe.is_active = true
        GROUP BY t.id, t.name, t.code
        ORDER BY quantity DESC
      `,
      prisma.$queryRaw<{ name: string, quantity: number, count: number }[]>`
        SELECT fe.product_name AS name,
               SUM(fe.quantity)::int AS quantity,
               COUNT(*)::int AS count
        FROM fuel_entries fe
        WHERE fe.entry_date >= ${startDate} AND fe.is_active = true
        GROUP BY fe.product_name
        ORDER BY quantity DESC
      `,
      prisma.$queryRaw<{ name: string, quantity: number, count: number }[]>`
        SELECT COALESCE(fe.country_of_origin, 'Nepoznato') AS name,
               SUM(fe.quantity)::int AS quantity,
               COUNT(*)::int AS count
        FROM fuel_entries fe
        WHERE fe.entry_date >= ${startDate} AND fe.is_active = true
        GROUP BY name
        ORDER BY quantity DESC
      `,
      prisma.$queryRaw<{ month: string, quantity: number, count: number }[]>`
        SELECT to_char(date_trunc('month', entry_date), 'YYYY-MM') AS month,
               SUM(quantity)::int AS quantity,
               COUNT(*)::int AS count
        FROM fuel_entries
        WHERE entry_date >= ${startDate} AND is_active = true
        GROUP BY month
        ORDER BY month
      `,
      prisma.$queryRaw<{ name: string, count: number }[]>`
        SELECT char AS name,
               COUNT(*)::int AS count
        FROM fuel_entries fe,
             unnest(fe.improved_characteristics) AS char
        WHERE fe.entry_date >= ${startDate} AND fe.is_active = true
        GROUP BY char
        ORDER BY count DESC
      `,
      prisma.$queryRaw<{ month: string, count: number, total: number }[]>`
        SELECT to_char(date_trunc('month', entry_date), 'YYYY-MM') AS month,
               SUM(CASE WHEN is_higher_quality THEN 1 ELSE 0 END)::int AS count,
               COUNT(*)::int AS total
        FROM fuel_entries
        WHERE entry_date >= ${startDate} AND is_active = true
        GROUP BY month
        ORDER BY month
      `,
      prisma.$queryRaw<{ name: string, quantity: number, count: number }[]>`
        SELECT COALESCE(pickup_location, 'Nepoznato') AS name,
               SUM(quantity)::int AS quantity,
               COUNT(*)::int AS count
        FROM fuel_entries
        WHERE entry_date >= ${startDate} AND is_active = true
        GROUP BY name
        ORDER BY quantity DESC
      `,
      prisma.$queryRaw<{ name: string, count: number }[]>`
        SELECT COALESCE(laboratory_name, 'Nepoznato') AS name,
               COUNT(*)::int AS count
        FROM fuel_entries
        WHERE entry_date >= ${startDate} AND is_active = true
        GROUP BY name
        ORDER BY count DESC
      `,
      prisma.$queryRaw<{ name: string, count: number, quantity: number }[]>`
        SELECT COALESCE(driver_name, 'Nepoznato') AS name,
               COUNT(*)::int AS count,
               SUM(quantity)::int AS quantity
        FROM fuel_entries
        WHERE entry_date >= ${startDate} AND is_active = true
        GROUP BY name
        HAVING COALESCE(driver_name, 'Nepoznato') <> 'Nepoznato'
        ORDER BY count DESC
        LIMIT 10
      `,
      prisma.$queryRaw<{ day: number, count: number, quantity: number }[]>`
        SELECT EXTRACT(DOW FROM entry_date)::int AS day,
               COUNT(*)::int AS count,
               SUM(quantity)::int AS quantity
        FROM fuel_entries
        WHERE entry_date >= ${startDate} AND is_active = true
        GROUP BY day
        ORDER BY day
      `,
      prisma.$queryRaw<{ quantity: number }[]>`
        SELECT COALESCE(SUM(quantity), 0)::int AS quantity
        FROM fuel_entries
        WHERE entry_date >= ${lastYearMonthStart}
          AND entry_date < ${lastYearMonthEnd}
          AND is_active = true
      `,
      prisma.$queryRaw<{ total: number, with_certificate: number, with_customs: number }[]>`
        SELECT COUNT(*)::int AS total,
               SUM(CASE WHEN certificate_path IS NOT NULL THEN 1 ELSE 0 END)::int AS with_certificate,
               SUM(CASE WHEN customs_declaration_number IS NOT NULL THEN 1 ELSE 0 END)::int AS with_customs
        FROM fuel_entries
        WHERE entry_date >= ${startDate} AND is_active = true
      `,
      prisma.$queryRaw<{ name: string, code: string }[]>`
        SELECT w.name AS name,
               w.code AS code
        FROM warehouses w
        LEFT JOIN fuel_entries fe
          ON fe.warehouse_id = w.id
         AND fe.entry_date >= ${thirtyDaysAgo}
         AND fe.is_active = true
        WHERE w.is_active = true
        GROUP BY w.id, w.name, w.code
        HAVING COUNT(fe.id) = 0
        ORDER BY w.name
      `,
      prisma.$queryRaw<{ registrationNumber: number, quantity: number, warehouse: string, date: Date, type: string }[]>`
        WITH stats AS (
          SELECT AVG(quantity)::float AS avg_qty,
                 STDDEV_POP(quantity)::float AS stddev_qty
          FROM fuel_entries
          WHERE entry_date >= ${startDate} AND is_active = true
        ),
        entries AS (
          SELECT fe.registration_number,
                 fe.quantity,
                 w.code AS warehouse,
                 fe.entry_date
          FROM fuel_entries fe
          JOIN warehouses w ON w.id = fe.warehouse_id
          WHERE fe.entry_date >= ${startDate} AND fe.is_active = true
        )
        SELECT e.registration_number AS "registrationNumber",
               e.quantity AS quantity,
               e.warehouse AS warehouse,
               e.entry_date AS date,
               CASE WHEN e.quantity > s.avg_qty THEN 'high' ELSE 'low' END AS type
        FROM entries e
        CROSS JOIN stats s
        WHERE s.stddev_qty IS NOT NULL
          AND s.stddev_qty > 0
          AND ABS(e.quantity - s.avg_qty) > ${outlierThreshold} * s.stddev_qty
        ORDER BY ABS(e.quantity - s.avg_qty) DESC
        LIMIT 10
      `,
      prisma.$queryRaw<{
        total_quantity: number,
        total_entries: number,
        avg_quantity: number,
        higher_quality_count: number,
        warehouse_count: number,
        supplier_count: number,
        transporter_count: number,
        product_count: number
      }[]>`
        SELECT COALESCE(SUM(quantity), 0)::int AS total_quantity,
               COUNT(*)::int AS total_entries,
               COALESCE(AVG(quantity), 0)::float AS avg_quantity,
               SUM(CASE WHEN is_higher_quality THEN 1 ELSE 0 END)::int AS higher_quality_count,
               COUNT(DISTINCT warehouse_id)::int AS warehouse_count,
               COUNT(DISTINCT supplier_id)::int AS supplier_count,
               COUNT(DISTINCT transporter_id)::int AS transporter_count,
               COUNT(DISTINCT product_name)::int AS product_count
        FROM fuel_entries
        WHERE entry_date >= ${startDate} AND is_active = true
      `
    ])

    const warehouseMap = new Map<string, { name: string, code: string, data: Map<string, number> }>()
    warehouseMonthRows.forEach(row => {
      if (!warehouseMap.has(row.id)) {
        warehouseMap.set(row.id, { name: row.name, code: row.code, data: new Map() })
      }
      warehouseMap.get(row.id)!.data.set(row.month, row.quantity)
    })

    const entriesByWarehouse = Array.from(warehouseMap.entries()).map(([id, wh]) => ({
      id,
      name: wh.name,
      code: wh.code,
      data: allMonths.map(month => ({
        month,
        quantity: wh.data.get(month) || 0
      }))
    }))

    const monthlyTotalsMap = new Map<string, { quantity: number, count: number }>()
    monthlyTotalsRows.forEach(row => {
      monthlyTotalsMap.set(row.month, { quantity: row.quantity, count: row.count })
    })

    const monthlyTotals = allMonths.map(month => ({
      month,
      quantity: monthlyTotalsMap.get(month)?.quantity || 0,
      count: monthlyTotalsMap.get(month)?.count || 0
    }))

    const entriesBySupplier = supplierRows
    const entriesByTransporter = transporterRows
    const entriesByProduct = productRows
    const entriesByCountry = countryRows

    const entriesByCharacteristic = characteristicRows.map(row => ({
      name: row.name,
      count: row.count
    }))

    const hqTrendMap = new Map<string, { count: number, total: number }>()
    hqTrendRows.forEach(row => {
      hqTrendMap.set(row.month, { count: row.count, total: row.total })
    })

    const higherQualityTrend = allMonths.map(month => {
      const data = hqTrendMap.get(month)
      const count = data?.count || 0
      const total = data?.total || 0
      const percent = total > 0 ? Math.round((count / total) * 100) : 0
      return { month, count, total, percent }
    })

    const entriesByLocation = locationRows
    const entriesByLaboratory = labRows
    const topDrivers = driverRows

    const dayNames = ['Nedjelja', 'Ponedjeljak', 'Utorak', 'Srijeda', 'Četvrtak', 'Petak', 'Subota']
    const entriesByDayOfWeek = dayRows
      .map(row => ({ day: row.day, name: dayNames[row.day], count: row.count, quantity: row.quantity }))
      .sort((a, b) => a.day - b.day)

    // ============================================
    // 12. TREND COMPARISON (MoM, YoY)
    // ============================================
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const prevMonth = now.getMonth() === 0
      ? `${now.getFullYear() - 1}-12`
      : `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`

    const currentMonthData = monthlyTotals.find(m => m.month === currentMonth)
    const prevMonthData = monthlyTotals.find(m => m.month === prevMonth)

    const momChange = prevMonthData && prevMonthData.quantity > 0
      ? Math.round(((currentMonthData?.quantity || 0) - prevMonthData.quantity) / prevMonthData.quantity * 100)
      : 0

    const lastYearQuantity = lastYearRows[0]?.quantity || 0
    const yoyChange = lastYearQuantity > 0
      ? Math.round(((currentMonthData?.quantity || 0) - lastYearQuantity) / lastYearQuantity * 100)
      : 0

    // ============================================
    // 13. DOCUMENTATION & COMPLIANCE
    // ============================================
    const documentation = documentationRows[0]
    const totalEntriesCount = documentation?.total || 0
    const withCertificate = documentation?.with_certificate || 0
    const withCustomsDeclaration = documentation?.with_customs || 0
    const certificatePercent = totalEntriesCount > 0 ? Math.round((withCertificate / totalEntriesCount) * 100) : 0
    const customsPercent = totalEntriesCount > 0 ? Math.round((withCustomsDeclaration / totalEntriesCount) * 100) : 0

    // ============================================
    // 14. ALERTS - Inactive warehouses/suppliers
    // ============================================
    const inactiveWarehouses = inactiveWarehouseRows.map(wh => ({ name: wh.name, code: wh.code }))
    const outlierEntries = outlierRows

    // ============================================
    // 15. SUMMARY STATS
    // ============================================
    const summary = summaryRows[0]
    const totalQuantity = summary?.total_quantity || 0
    const totalEntries = summary?.total_entries || 0
    const avgQuantityPerEntry = totalEntries > 0 ? Math.round(totalQuantity / totalEntries) : 0
    const higherQualityCount = summary?.higher_quality_count || 0
    const higherQualityPercent = totalEntries > 0 ? Math.round((higherQualityCount / totalEntries) * 100) : 0

    return successResponse({
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      months: allMonths,
      summary: {
        totalQuantity,
        totalEntries,
        avgQuantityPerEntry,
        higherQualityCount,
        higherQualityPercent,
        warehouseCount: summary?.warehouse_count || 0,
        supplierCount: summary?.supplier_count || 0,
        transporterCount: summary?.transporter_count || 0,
        productCount: summary?.product_count || 0,
        // New stats
        certificatePercent,
        customsPercent,
        withCertificate,
        withCustomsDeclaration,
        momChange,
        yoyChange
      },
      monthlyTotals,
      entriesByWarehouse,
      entriesBySupplier,
      entriesByTransporter,
      entriesByProduct,
      entriesByCountry,
      // New data
      entriesByCharacteristic,
      higherQualityTrend,
      entriesByLocation,
      entriesByLaboratory,
      topDrivers,
      entriesByDayOfWeek,
      alerts: {
        inactiveWarehouses,
        outlierEntries
      }
    })

  } catch (error) {
    console.error('Error fetching statistics:', error)
    return errorResponse('Failed to fetch statistics', 500)
  }
})
