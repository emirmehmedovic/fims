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
    fetchWarehouses()
    fetchEntries()
  }, [page, warehouseFilter, productNameFilter, deliveryNoteFilter, registrationNumberFilter, dateFromFilter, dateToFilter])

  const fetchWarehouses = async () => {
    try {
      const res = await fetch('/api/warehouses')
      const data = await res.json()
      if (data.success) {
        setWarehouses(data.data)
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
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-text-primary">Evidencija goriva</h1>
          <p className="text-text-secondary mt-1">
            Upravljaj prijavama ulaza goriva u skladište
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleBulkExport}
            disabled={exportingBulk || total === 0}
            className="px-4 py-2 text-sm font-medium text-text-primary bg-bg-secondary rounded-lg hover:bg-bg-tertiary disabled:opacity-50 flex items-center gap-2"
          >
            {exportingBulk ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-blue"></div>
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
              className="btn-primary"
            >
              + Nova prijava
            </button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="text-text-secondary text-sm mb-1">Ukupno prijava</div>
          <div className="text-2xl font-semibold text-text-primary">{total}</div>
        </div>
        <div className="card">
          <div className="text-text-secondary text-sm mb-1">Aktivne prijave</div>
          <div className="text-2xl font-semibold text-status-success">
            {entries.filter(e => e.isActive).length}
          </div>
        </div>
        <div className="card">
          <div className="text-text-secondary text-sm mb-1">Ukupna količina</div>
          <div className="text-2xl font-semibold text-text-primary">
            {entries.reduce((sum, e) => sum + (e.isActive ? e.quantity : 0), 0).toLocaleString()} L
          </div>
        </div>
        <div className="card">
          <div className="text-text-secondary text-sm mb-1">Viša kvaliteta</div>
          <div className="text-2xl font-semibold text-primary-blue">
            {entries.filter(e => e.isActive && e.isHigherQuality).length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-text-primary">Filteri</h2>
          <button
            onClick={clearFilters}
            className="text-sm text-primary-blue hover:text-primary-blue-hover"
          >
            Očisti filtere
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
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
            <label className="block text-sm font-medium text-text-secondary mb-2">
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
            <label className="block text-sm font-medium text-text-secondary mb-2">
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
            <label className="block text-sm font-medium text-text-secondary mb-2">
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
            <label className="block text-sm font-medium text-text-secondary mb-2">
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
            <label className="block text-sm font-medium text-text-secondary mb-2">
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
      <div className="card">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-blue"></div>
            <p className="text-text-secondary mt-4">Učitavanje...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-secondary">Nema prijava koje odgovaraju kriterijima</p>
          </div>
        ) : (
          <>
            <FuelEntryTable
              entries={entries}
              onEntryDeleted={handleEntryDeleted}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-6 pt-6 border-t border-border">
                <div className="text-sm text-text-secondary">
                  Prikazano {((page - 1) * limit) + 1} - {Math.min(page * limit, total)} od {total}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 text-sm font-medium text-text-primary bg-bg-secondary rounded-lg hover:bg-bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Prethodna
                  </button>
                  <span className="px-4 py-2 text-sm text-text-secondary">
                    Stranica {page} od {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 text-sm font-medium text-text-primary bg-bg-secondary rounded-lg hover:bg-bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed"
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
