'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import FuelEntryTable from '@/components/fuel-entries/FuelEntryTable'
import CreateFuelEntryModal from '@/components/fuel-entries/CreateFuelEntryModal'

interface Warehouse {
  id: string
  name: string
  code: string
  isActive: boolean
}

interface FuelEntry {
  id: string
  registrationNumber: number
  entryDate: string
  productName: string
  quantity: number
  deliveryNoteNumber: string | null
  deliveryNoteDate: string | null
  isHigherQuality: boolean
  isActive: boolean
  warehouse: {
    id: string
    name: string
    code: string
  }
  operator: {
    id: string
    name: string
    email: string
  }
  certificatePath: string | null
  certificateFileName: string | null
  createdAt: string
}

export default function FuelEntriesPage() {
  const { data: session } = useSession()
  const [entries, setEntries] = useState<FuelEntry[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Filter states
  const [warehouseFilter, setWarehouseFilter] = useState('')
  const [productNameFilter, setProductNameFilter] = useState('')
  const [deliveryNoteFilter, setDeliveryNoteFilter] = useState('')
  const [registrationNumberFilter, setRegistrationNumberFilter] = useState('')
  const [dateFromFilter, setDateFromFilter] = useState('')
  const [dateToFilter, setDateToFilter] = useState('')

  // Pagination
  const [page, setPage] = useState(1)
  const [limit] = useState(50)
  const [total, setTotal] = useState(0)
  const totalPages = Math.ceil(total / limit)

  const [exportingBulk, setExportingBulk] = useState(false)

  const canCreateEntry = session?.user?.role === 'SUPER_ADMIN' ||
                         session?.user?.role === 'ADMIN' ||
                         session?.user?.role === 'OPERATOR'

  useEffect(() => {
    if (session) {
      fetchWarehouses()
      fetchEntries()
    }
  }, [session, page, warehouseFilter, productNameFilter, deliveryNoteFilter, registrationNumberFilter, dateFromFilter, dateToFilter])

  const fetchWarehouses = async () => {
    try {
      // For OPERATOR/VIEWER, use warehouses from session
      const userRole = session?.user?.role
      const userWarehouses = (session?.user as any)?.warehouses || []
      
      if (userRole === 'OPERATOR' || userRole === 'VIEWER') {
        // Use only assigned warehouses
        setWarehouses(userWarehouses.map((w: any) => ({
          id: w.id,
          name: w.name,
          code: w.code,
          isActive: true
        })))
      } else {
        // Admins can see all warehouses
        const res = await fetch('/api/warehouses')
        const data = await res.json()
        if (data.success) {
          setWarehouses(data.data)
        }
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error)
    }
  }

  const fetchEntries = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(warehouseFilter && { warehouseId: warehouseFilter }),
        ...(productNameFilter && { productName: productNameFilter }),
        ...(deliveryNoteFilter && { deliveryNoteNumber: deliveryNoteFilter }),
        ...(registrationNumberFilter && { registrationNumber: registrationNumberFilter }),
        ...(dateFromFilter && { dateFrom: dateFromFilter }),
        ...(dateToFilter && { dateTo: dateToFilter })
      })

      const res = await fetch(`/api/fuel-entries?${params}`)
      const data = await res.json()

      if (data.success) {
        setEntries(data.data.items || data.data)
        setTotal(data.data.pagination?.total || 0)
      }
    } catch (error) {
      console.error('Error fetching fuel entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEntryCreated = () => {
    setShowCreateModal(false)
    fetchEntries()
  }

  const handleEntryDeleted = () => {
    fetchEntries()
  }

  const clearFilters = () => {
    setWarehouseFilter('')
    setProductNameFilter('')
    setDeliveryNoteFilter('')
    setRegistrationNumberFilter('')
    setDateFromFilter('')
    setDateToFilter('')
    setPage(1)
  }

  const handleBulkExport = async () => {
    if (total === 0) {
      alert('Nema prijava za export')
      return
    }

    if (total > 100) {
      alert('Maksimalno 100 prijava može biti exportovano odjednom. Molimo suzite filtere.')
      return
    }

    setExportingBulk(true)
    try {
      const response = await fetch('/api/exports/bulk-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          warehouseId: warehouseFilter || undefined,
          productName: productNameFilter || undefined,
          dateFrom: dateFromFilter || undefined,
          dateTo: dateToFilter || undefined,
          includeCertificates: true
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate bulk PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Bulk_Export_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error: any) {
      console.error('Error exporting bulk PDF:', error)
      alert(error.message || 'Greška pri generiranju bulk PDF-a')
    } finally {
      setExportingBulk(false)
    }
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-dark-900 to-dark-800 rounded-3xl p-8 text-white shadow-[var(--shadow-soft-xl)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-500 opacity-10 rounded-full blur-3xl -ml-12 -mb-12"></div>

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">Evidencija goriva</h1>
              <p className="text-dark-300 text-sm">
                Upravljaj prijavama ulaza goriva u skladište
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleBulkExport}
              disabled={exportingBulk || total === 0}
              className="px-4 py-2.5 bg-white/10 text-white rounded-2xl font-medium text-sm hover:bg-white/20 disabled:opacity-50 transition-all border border-white/20 backdrop-blur-md flex items-center gap-2"
            >
              {exportingBulk ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Generiranje...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Bulk Export ({total > 100 ? '100+' : total})
                </>
              )}
            </button>
            {canCreateEntry && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-2.5 bg-white text-dark-900 rounded-2xl font-semibold hover:bg-dark-50 transition-all shadow-[var(--shadow-soft)] text-sm"
              >
                + Nova prijava
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="flex flex-wrap gap-6">
        {[
          {
            title: 'Ukupno prijava',
            value: total,
            icon: (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            ),
            trend: 'Total',
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            badge: 'Sve',
          },
          {
            title: 'Aktivne prijave',
            value: entries.filter(e => e.isActive).length,
            icon: (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
            trend: 'Aktivno',
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-50',
            badge: 'Status',
          },
          {
            title: 'Ukupna količina',
            value: `${entries.reduce((sum, e) => sum + (e.isActive ? e.quantity : 0), 0).toLocaleString()} L`,
            icon: (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
            ),
            trend: 'Litara',
            color: 'text-amber-600',
            bgColor: 'bg-amber-50',
            badge: 'Zapremina',
          },
          {
            title: 'Viša kvaliteta',
            value: entries.filter(e => e.isActive && e.isHigherQuality).length,
            icon: (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            ),
            trend: 'Premium',
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            badge: 'Kvalitet',
          },
        ].map((item) => (
          <div
            key={item.title}
            className="stat-card flex flex-col justify-between h-[160px] basis-full md:basis-[calc(50%-12px)] lg:basis-[calc(25%-18px)] flex-grow"
            style={{ minWidth: '200px' }}
          >
            <div className="flex justify-between items-start relative z-10">
              <div className={`p-3.5 rounded-2xl ${item.bgColor} group-hover:scale-110 transition-transform`}>
                <div className={item.color}>{item.icon}</div>
              </div>
              <span className="px-3 py-1 bg-dark-50 rounded-full text-[10px] font-bold text-dark-500 uppercase tracking-wide">
                {item.badge}
              </span>
            </div>
            <div className="relative z-10">
              <h4 className="text-3xl font-bold text-dark-900 mb-1">{item.value}</h4>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-dark-500">{item.title}</span>
                <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full ml-auto">{item.trend}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-[var(--shadow-soft)] border border-dark-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-dark-900">Filteri</h2>
          <button
            onClick={clearFilters}
            className="text-sm font-medium text-dark-600 hover:text-dark-900 transition-colors"
          >
            Očisti filtere
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-dark-600 uppercase tracking-wide mb-2">
              Skladište
            </label>
            <select
              value={warehouseFilter}
              onChange={(e) => {
                setWarehouseFilter(e.target.value)
                setPage(1)
              }}
              className="input w-full"
            >
              <option value="">Sva skladišta</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>
                  {w.code} - {w.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-dark-600 uppercase tracking-wide mb-2">
              Proizvod
            </label>
            <input
              type="text"
              value={productNameFilter}
              onChange={(e) => {
                setProductNameFilter(e.target.value)
                setPage(1)
              }}
              placeholder="Pretraži proizvod..."
              className="input w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-dark-600 uppercase tracking-wide mb-2">
              Broj otpremnice
            </label>
            <input
              type="text"
              value={deliveryNoteFilter}
              onChange={(e) => {
                setDeliveryNoteFilter(e.target.value)
                setPage(1)
              }}
              placeholder="Broj otpremnice..."
              className="input w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-dark-600 uppercase tracking-wide mb-2">
              Registarski broj
            </label>
            <input
              type="text"
              value={registrationNumberFilter}
              onChange={(e) => {
                setRegistrationNumberFilter(e.target.value)
                setPage(1)
              }}
              placeholder="Registarski broj..."
              className="input w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-dark-600 uppercase tracking-wide mb-2">
              Datum od
            </label>
            <input
              type="date"
              value={dateFromFilter}
              onChange={(e) => {
                setDateFromFilter(e.target.value)
                setPage(1)
              }}
              className="input w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-dark-600 uppercase tracking-wide mb-2">
              Datum do
            </label>
            <input
              type="date"
              value={dateToFilter}
              onChange={(e) => {
                setDateToFilter(e.target.value)
                setPage(1)
              }}
              className="input w-full"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-[var(--shadow-soft)] border border-dark-100 overflow-hidden">
        {loading ? (
          <div className="text-center py-12 p-8">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="text-dark-500 mt-4">Učitavanje...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 p-8">
            <p className="text-dark-500">Nema prijava koje odgovaraju kriterijima</p>
          </div>
        ) : (
          <>
            <FuelEntryTable
              entries={entries}
              onEntryDeleted={handleEntryDeleted}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center px-6 py-6 border-t border-dark-100 bg-dark-50">
                <div className="text-sm text-dark-600 font-medium">
                  Prikazano {((page - 1) * limit) + 1} - {Math.min(page * limit, total)} od {total}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-6 py-3 bg-white border border-dark-200 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-dark-50 transition-all shadow-[var(--shadow-soft)] text-sm"
                  >
                    Prethodna
                  </button>
                  <span className="px-6 py-3 bg-white rounded-xl font-medium border border-dark-100 shadow-[var(--shadow-soft)] text-sm">
                    Stranica {page} od {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-6 py-3 bg-white border border-dark-200 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-dark-50 transition-all shadow-[var(--shadow-soft)] text-sm"
                  >
                    Sljedeća
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateFuelEntryModal
          warehouses={warehouses}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleEntryCreated}
        />
      )}
    </div>
  )
}
