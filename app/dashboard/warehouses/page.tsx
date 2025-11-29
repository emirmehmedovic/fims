'use client'

import { useState, useEffect } from 'react'
import { Warehouse as WarehouseIcon, Plus, BarChart3 } from 'lucide-react'
import WarehouseTable from '@/components/warehouses/WarehouseTable'
import CreateWarehouseModal from '@/components/warehouses/CreateWarehouseModal'
import EditWarehouseModal from '@/components/warehouses/EditWarehouseModal'

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null)

  const fetchWarehouses = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/warehouses?includeInactive=true')
      const data = await response.json()

      if (data.success) {
        setWarehouses(data.data)
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWarehouses()
  }, [])

  const handleEdit = (warehouse: any) => {
    setSelectedWarehouse(warehouse)
    setShowEditModal(true)
  }

  const handleDelete = async (warehouseId: string) => {
    if (!confirm('Da li ste sigurni da želite deaktivirati ovo skladište?')) return

    try {
      const response = await fetch(`/api/warehouses/${warehouseId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchWarehouses()
      }
    } catch (error) {
      console.error('Error deleting warehouse:', error)
    }
  }

  // Calculate statistics
  const stats = {
    total: warehouses.length,
    active: warehouses.filter(w => w.isActive).length,
    totalCapacity: warehouses.reduce((sum, w) => sum + w.capacity, 0),
    totalUsers: warehouses.reduce((sum, w) => sum + (w._count?.users || 0), 0),
    totalEntries: warehouses.reduce((sum, w) => sum + (w._count?.fuelEntries || 0), 0)
  }

  return (
    <div className="min-h-screen bg-bg-secondary p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <WarehouseIcon size={32} className="text-primary-blue" />
            <div>
              <h1 className="text-3xl font-bold">Warehouse Management</h1>
              <p className="text-primary-gray">Upravljanje skladištima</p>
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Novo Skladište
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary-blue/10 rounded-xl">
                <WarehouseIcon size={24} className="text-primary-blue" />
              </div>
              <div>
                <p className="text-sm text-primary-gray">Ukupno Skladišta</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-status-success/10 rounded-xl">
                <WarehouseIcon size={24} className="text-status-success" />
              </div>
              <div>
                <p className="text-sm text-primary-gray">Aktivna</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-status-info/10 rounded-xl">
                <BarChart3 size={24} className="text-status-info" />
              </div>
              <div>
                <p className="text-sm text-primary-gray">Ukupan Kapacitet</p>
                <p className="text-2xl font-bold">{stats.totalCapacity.toLocaleString()} L</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div>
              <p className="text-sm text-primary-gray">Korisnika</p>
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
            </div>
          </div>

          <div className="card">
            <div>
              <p className="text-sm text-primary-gray">Ulaza Goriva</p>
              <p className="text-2xl font-bold">{stats.totalEntries}</p>
            </div>
          </div>
        </div>

        {/* Table */}
        <WarehouseTable
          warehouses={warehouses}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateWarehouseModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            fetchWarehouses()
          }}
        />
      )}

      {showEditModal && selectedWarehouse && (
        <EditWarehouseModal
          warehouse={selectedWarehouse}
          onClose={() => {
            setShowEditModal(false)
            setSelectedWarehouse(null)
          }}
          onSuccess={() => {
            setShowEditModal(false)
            setSelectedWarehouse(null)
            fetchWarehouses()
          }}
        />
      )}
    </div>
  )
}
