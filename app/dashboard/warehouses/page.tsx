'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Warehouse as WarehouseIcon, Plus, BarChart3 } from 'lucide-react'
import WarehouseTable from '@/components/warehouses/WarehouseTable'
import CreateWarehouseModal from '@/components/warehouses/CreateWarehouseModal'
import EditWarehouseModal from '@/components/warehouses/EditWarehouseModal'

export default function WarehousesPage() {
  const { data: session } = useSession()
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null)

  // Check if user can manage warehouses (create/edit/delete)
  const canManageWarehouses = session?.user?.role === 'SUPER_ADMIN' || session?.user?.role === 'ADMIN'

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
    <>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-br from-dark-900 to-dark-800 rounded-3xl p-8 text-white shadow-[var(--shadow-soft-xl)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-500 opacity-10 rounded-full blur-3xl -ml-12 -mb-12"></div>

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md">
                <WarehouseIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Warehouse Management</h1>
                <p className="text-dark-300 text-sm">
                  Upravljanje skladištima
                </p>
              </div>
            </div>

            {canManageWarehouses && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-white text-dark-900 rounded-2xl font-semibold hover:bg-dark-50 transition-all shadow-[var(--shadow-soft)] flex items-center gap-2"
              >
                <Plus size={20} />
                Novo Skladište
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="flex flex-wrap gap-6">
          {[
            {
              title: 'Ukupno skladišta',
              value: stats.total,
              icon: WarehouseIcon,
              trend: 'Sva',
              color: 'text-blue-600',
              bgColor: 'bg-blue-50',
              badge: 'Total',
            },
            {
              title: 'Aktivna skladišta',
              value: stats.active,
              icon: WarehouseIcon,
              trend: 'Operativno',
              color: 'text-emerald-600',
              bgColor: 'bg-emerald-50',
              badge: 'Aktivno',
            },
            {
              title: 'Ukupan kapacitet',
              value: `${(stats.totalCapacity / 1000).toFixed(0)}k L`,
              icon: BarChart3,
              trend: 'Litara',
              color: 'text-amber-600',
              bgColor: 'bg-amber-50',
              badge: 'Kapacitet',
            },
            {
              title: 'Korisnika',
              value: stats.totalUsers,
              icon: WarehouseIcon,
              trend: 'Dodijeljeni',
              color: 'text-purple-600',
              bgColor: 'bg-purple-50',
              badge: 'Users',
            },
            {
              title: 'Ulaza goriva',
              value: stats.totalEntries,
              icon: BarChart3,
              trend: 'Prijave',
              color: 'text-indigo-600',
              bgColor: 'bg-indigo-50',
              badge: 'Entries',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="stat-card flex flex-col justify-between h-[160px] basis-full md:basis-[calc(33.333%-16px)] lg:basis-[calc(20%-19.2px)] flex-grow"
              style={{ minWidth: '200px' }}
            >
              <div className="flex justify-between items-start relative z-10">
                <div className={`p-3.5 rounded-2xl ${item.bgColor} group-hover:scale-110 transition-transform`}>
                  <item.icon className={`w-6 h-6 ${item.color}`} />
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

        {/* Table */}
        <WarehouseTable
          warehouses={warehouses}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          canManage={canManageWarehouses}
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
    </>
  )
}
