import { Edit2, Trash2, CheckCircle, XCircle, MapPin, Users, Package } from 'lucide-react'

interface Warehouse {
  id: string
  name: string
  code: string
  location: string
  capacity: number
  description: string | null
  isActive: boolean
  _count?: {
    users: number
    fuelEntries: number
  }
}

interface WarehouseTableProps {
  warehouses: Warehouse[]
  loading: boolean
  onEdit: (warehouse: Warehouse) => void
  onDelete: (warehouseId: string) => void
  canManage?: boolean
}

export default function WarehouseTable({ warehouses, loading, onEdit, onDelete, canManage = true }: WarehouseTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-[var(--shadow-soft)] border border-dark-100 p-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  if (warehouses.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-[var(--shadow-soft)] border border-dark-100 p-8">
        <div className="text-center py-12">
          <p className="text-dark-500">Nema skladišta za prikaz</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {warehouses.map((warehouse) => (
        <div
          key={warehouse.id}
          className={`bg-white rounded-2xl p-6 shadow-[var(--shadow-soft)] border transition-all hover:shadow-[var(--shadow-soft-xl)] ${
            warehouse.isActive ? 'border-dark-100' : 'border-dark-200 opacity-75'
          }`}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-dark-900 mb-1">{warehouse.name}</h3>
              <p className="text-sm text-dark-500 font-mono">{warehouse.code}</p>
            </div>
            {warehouse.isActive ? (
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold flex items-center gap-1">
                <CheckCircle size={14} />
                Aktivno
              </span>
            ) : (
              <span className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-semibold flex items-center gap-1">
                <XCircle size={14} />
                Neaktivno
              </span>
            )}
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 mb-4 text-dark-600">
            <MapPin size={16} className="text-dark-400" />
            <span className="text-sm">{warehouse.location}</span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-dark-50 rounded-xl p-3 border border-dark-100">
              <div className="text-xs text-dark-500 font-medium mb-1">Kapacitet</div>
              <div className="text-lg font-bold text-dark-900">{(warehouse.capacity / 1000).toFixed(0)}k</div>
              <div className="text-[10px] text-dark-400">litara</div>
            </div>
            <div className="bg-dark-50 rounded-xl p-3 border border-dark-100">
              <div className="text-xs text-dark-500 font-medium mb-1 flex items-center gap-1">
                <Users size={12} />
                Korisnici
              </div>
              <div className="text-lg font-bold text-dark-900">{warehouse._count?.users || 0}</div>
            </div>
            <div className="bg-dark-50 rounded-xl p-3 border border-dark-100">
              <div className="text-xs text-dark-500 font-medium mb-1 flex items-center gap-1">
                <Package size={12} />
                Ulazi
              </div>
              <div className="text-lg font-bold text-dark-900">{warehouse._count?.fuelEntries || 0}</div>
            </div>
          </div>

          {/* Description */}
          {warehouse.description && (
            <p className="text-xs text-dark-500 mb-4 line-clamp-2">{warehouse.description}</p>
          )}

          {/* Actions */}
          {canManage && (
            <div className="flex gap-2 pt-4 border-t border-dark-100">
              <button
                onClick={() => onEdit(warehouse)}
                className="flex-1 px-4 py-2 bg-dark-900 text-white rounded-xl font-medium text-sm hover:bg-dark-800 transition-colors flex items-center justify-center gap-2"
              >
                <Edit2 size={16} />
                Uredi
              </button>
              <button
                onClick={() => onDelete(warehouse.id)}
                disabled={!warehouse.isActive}
                className="flex-1 px-4 py-2 bg-dark-100 text-dark-600 rounded-xl font-medium text-sm hover:bg-dark-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Trash2 size={16} />
                Deaktiviraj
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
