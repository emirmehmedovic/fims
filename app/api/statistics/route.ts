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

    // Get all fuel entries in the period
    const entries = await prisma.fuelEntry.findMany({
      where: {
        entryDate: { gte: startDate },
        isActive: true
      },
      include: {
        warehouse: { select: { id: true, name: true, code: true } },
        supplier: { select: { id: true, name: true, code: true } },
        transporter: { select: { id: true, name: true, code: true } }
      },
      orderBy: { entryDate: 'asc' }
    })

    // ============================================
    // 1. ENTRIES BY WAREHOUSE (for line chart)
    // ============================================
    const warehouseMap = new Map<string, { name: string, code: string, data: Map<string, number> }>()
    
    entries.forEach(entry => {
      const whId = entry.warehouse.id
      const monthKey = `${entry.entryDate.getFullYear()}-${String(entry.entryDate.getMonth() + 1).padStart(2, '0')}`
      
      if (!warehouseMap.has(whId)) {
        warehouseMap.set(whId, {
          name: entry.warehouse.name,
          code: entry.warehouse.code,
          data: new Map()
        })
      }
      
      const wh = warehouseMap.get(whId)!
      wh.data.set(monthKey, (wh.data.get(monthKey) || 0) + entry.quantity)
    })

    // Generate all months in range
    const allMonths: string[] = []
    const current = new Date(startDate)
    while (current <= now) {
      allMonths.push(`${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`)
      current.setMonth(current.getMonth() + 1)
    }

    const entriesByWarehouse = Array.from(warehouseMap.entries()).map(([id, wh]) => ({
      id,
      name: wh.name,
      code: wh.code,
      data: allMonths.map(month => ({
        month,
        quantity: wh.data.get(month) || 0
      }))
    }))

    // ============================================
    // 2. ENTRIES BY SUPPLIER
    // ============================================
    const supplierMap = new Map<string, { name: string, code: string, quantity: number, count: number }>()
    
    entries.forEach(entry => {
      if (entry.supplier) {
        const key = entry.supplier.id
        if (!supplierMap.has(key)) {
          supplierMap.set(key, {
            name: entry.supplier.name,
            code: entry.supplier.code,
            quantity: 0,
            count: 0
          })
        }
        const sup = supplierMap.get(key)!
        sup.quantity += entry.quantity
        sup.count++
      }
    })

    const entriesBySupplier = Array.from(supplierMap.values())
      .sort((a, b) => b.quantity - a.quantity)

    // ============================================
    // 3. ENTRIES BY TRANSPORTER
    // ============================================
    const transporterMap = new Map<string, { name: string, code: string, quantity: number, count: number }>()
    
    entries.forEach(entry => {
      if (entry.transporter) {
        const key = entry.transporter.id
        if (!transporterMap.has(key)) {
          transporterMap.set(key, {
            name: entry.transporter.name,
            code: entry.transporter.code,
            quantity: 0,
            count: 0
          })
        }
        const trans = transporterMap.get(key)!
        trans.quantity += entry.quantity
        trans.count++
      }
    })

    const entriesByTransporter = Array.from(transporterMap.values())
      .sort((a, b) => b.quantity - a.quantity)

    // ============================================
    // 4. ENTRIES BY PRODUCT
    // ============================================
    const productMap = new Map<string, { quantity: number, count: number }>()
    
    entries.forEach(entry => {
      if (!productMap.has(entry.productName)) {
        productMap.set(entry.productName, { quantity: 0, count: 0 })
      }
      const prod = productMap.get(entry.productName)!
      prod.quantity += entry.quantity
      prod.count++
    })

    const entriesByProduct = Array.from(productMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.quantity - a.quantity)

    // ============================================
    // 5. ENTRIES BY COUNTRY
    // ============================================
    const countryMap = new Map<string, { quantity: number, count: number }>()
    
    entries.forEach(entry => {
      const country = entry.countryOfOrigin || 'Nepoznato'
      if (!countryMap.has(country)) {
        countryMap.set(country, { quantity: 0, count: 0 })
      }
      const c = countryMap.get(country)!
      c.quantity += entry.quantity
      c.count++
    })

    const entriesByCountry = Array.from(countryMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.quantity - a.quantity)

    // ============================================
    // 6. MONTHLY TOTALS (for main line chart)
    // ============================================
    const monthlyTotals = allMonths.map(month => {
      const monthEntries = entries.filter(e => {
        const entryMonth = `${e.entryDate.getFullYear()}-${String(e.entryDate.getMonth() + 1).padStart(2, '0')}`
        return entryMonth === month
      })
      
      return {
        month,
        quantity: monthEntries.reduce((sum, e) => sum + e.quantity, 0),
        count: monthEntries.length
      }
    })

    // ============================================
    // 7. FUEL CHARACTERISTICS DISTRIBUTION
    // ============================================
    const characteristicsMap = new Map<string, number>()
    
    entries.forEach(entry => {
      if (entry.improvedCharacteristics && entry.improvedCharacteristics.length > 0) {
        entry.improvedCharacteristics.forEach(char => {
          characteristicsMap.set(char, (characteristicsMap.get(char) || 0) + 1)
        })
      }
    })

    const entriesByCharacteristic = Array.from(characteristicsMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    // Higher quality trend by month
    const higherQualityTrend = allMonths.map(month => {
      const monthEntries = entries.filter(e => {
        const entryMonth = `${e.entryDate.getFullYear()}-${String(e.entryDate.getMonth() + 1).padStart(2, '0')}`
        return entryMonth === month
      })
      const hqCount = monthEntries.filter(e => e.isHigherQuality).length
      const percent = monthEntries.length > 0 ? Math.round((hqCount / monthEntries.length) * 100) : 0
      return { month, count: hqCount, total: monthEntries.length, percent }
    })

    // ============================================
    // 8. PICKUP LOCATIONS
    // ============================================
    const locationMap = new Map<string, { quantity: number, count: number }>()
    
    entries.forEach(entry => {
      const location = entry.pickupLocation || 'Nepoznato'
      if (!locationMap.has(location)) {
        locationMap.set(location, { quantity: 0, count: 0 })
      }
      const loc = locationMap.get(location)!
      loc.quantity += entry.quantity
      loc.count++
    })

    const entriesByLocation = Array.from(locationMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.quantity - a.quantity)

    // ============================================
    // 9. LABORATORIES
    // ============================================
    const labMap = new Map<string, number>()
    
    entries.forEach(entry => {
      const lab = entry.laboratoryName || 'Nepoznato'
      labMap.set(lab, (labMap.get(lab) || 0) + 1)
    })

    const entriesByLaboratory = Array.from(labMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    // ============================================
    // 10. DRIVERS (Top 10)
    // ============================================
    const driverMap = new Map<string, { count: number, quantity: number }>()
    
    entries.forEach(entry => {
      const driver = entry.driverName || 'Nepoznato'
      if (!driverMap.has(driver)) {
        driverMap.set(driver, { count: 0, quantity: 0 })
      }
      const d = driverMap.get(driver)!
      d.count++
      d.quantity += entry.quantity
    })

    const topDrivers = Array.from(driverMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .filter(d => d.name !== 'Nepoznato')
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // ============================================
    // 11. ENTRIES BY DAY OF WEEK
    // ============================================
    const dayOfWeekMap = new Map<number, { count: number, quantity: number }>()
    const dayNames = ['Nedjelja', 'Ponedjeljak', 'Utorak', 'Srijeda', 'Četvrtak', 'Petak', 'Subota']
    
    entries.forEach(entry => {
      const day = entry.entryDate.getDay()
      if (!dayOfWeekMap.has(day)) {
        dayOfWeekMap.set(day, { count: 0, quantity: 0 })
      }
      const d = dayOfWeekMap.get(day)!
      d.count++
      d.quantity += entry.quantity
    })

    const entriesByDayOfWeek = Array.from(dayOfWeekMap.entries())
      .map(([day, data]) => ({ day, name: dayNames[day], ...data }))
      .sort((a, b) => a.day - b.day)

    // ============================================
    // 12. TREND COMPARISON (MoM, YoY)
    // ============================================
    // Current month vs previous month
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const prevMonth = now.getMonth() === 0 
      ? `${now.getFullYear() - 1}-12`
      : `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`
    
    const currentMonthData = monthlyTotals.find(m => m.month === currentMonth)
    const prevMonthData = monthlyTotals.find(m => m.month === prevMonth)
    
    const momChange = prevMonthData && prevMonthData.quantity > 0
      ? Math.round(((currentMonthData?.quantity || 0) - prevMonthData.quantity) / prevMonthData.quantity * 100)
      : 0

    // Year over year (same month last year)
    const lastYearMonth = `${now.getFullYear() - 1}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const lastYearEntries = await prisma.fuelEntry.findMany({
      where: {
        entryDate: {
          gte: new Date(now.getFullYear() - 1, now.getMonth(), 1),
          lt: new Date(now.getFullYear() - 1, now.getMonth() + 1, 1)
        },
        isActive: true
      },
      select: { quantity: true }
    })
    const lastYearQuantity = lastYearEntries.reduce((sum, e) => sum + e.quantity, 0)
    const yoyChange = lastYearQuantity > 0
      ? Math.round(((currentMonthData?.quantity || 0) - lastYearQuantity) / lastYearQuantity * 100)
      : 0

    // ============================================
    // 13. DOCUMENTATION & COMPLIANCE
    // ============================================
    const withCertificate = entries.filter(e => e.certificatePath).length
    const withCustomsDeclaration = entries.filter(e => e.customsDeclarationNumber).length
    const totalEntriesCount = entries.length
    const certificatePercent = totalEntriesCount > 0 ? Math.round((withCertificate / totalEntriesCount) * 100) : 0
    const customsPercent = totalEntriesCount > 0 ? Math.round((withCustomsDeclaration / totalEntriesCount) * 100) : 0

    // ============================================
    // 14. ALERTS - Inactive warehouses/suppliers
    // ============================================
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    // Get all active warehouses
    const allWarehouses = await prisma.warehouse.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true }
    })
    
    // Find warehouses with no entries in last 30 days
    const recentWarehouseIds = new Set(
      entries
        .filter(e => e.entryDate >= thirtyDaysAgo)
        .map(e => e.warehouse.id)
    )
    
    const inactiveWarehouses = allWarehouses
      .filter(wh => !recentWarehouseIds.has(wh.id))
      .map(wh => ({ name: wh.name, code: wh.code }))

    // Outliers - entries with unusually high/low quantities
    const quantities = entries.map(e => e.quantity)
    const avgQty = quantities.reduce((a, b) => a + b, 0) / quantities.length
    const stdDev = Math.sqrt(quantities.reduce((sum, q) => sum + Math.pow(q - avgQty, 2), 0) / quantities.length)
    const outlierThreshold = 2 // 2 standard deviations
    
    const outlierEntries = entries
      .filter(e => Math.abs(e.quantity - avgQty) > outlierThreshold * stdDev)
      .map(e => ({
        registrationNumber: e.registrationNumber,
        quantity: e.quantity,
        warehouse: e.warehouse.code,
        date: e.entryDate,
        type: e.quantity > avgQty ? 'high' : 'low'
      }))
      .slice(0, 10)

    // ============================================
    // 15. SUMMARY STATS
    // ============================================
    const totalQuantity = entries.reduce((sum, e) => sum + e.quantity, 0)
    const totalEntries = entries.length
    const avgQuantityPerEntry = totalEntries > 0 ? Math.round(totalQuantity / totalEntries) : 0
    const higherQualityCount = entries.filter(e => e.isHigherQuality).length
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
        warehouseCount: warehouseMap.size,
        supplierCount: supplierMap.size,
        transporterCount: transporterMap.size,
        productCount: productMap.size,
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
