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
}

export default function WarehouseTable({ warehouses, loading, onEdit, onDelete }: WarehouseTableProps) {
  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
        </div>
      </div>
    )
  }

  if (warehouses.length === 0) {
    return (
      <div className="card">
        <div className="text-center py-12">
          <p className="text-primary-gray">Nema skladišta za prikaz</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-bg-secondary border-b border-bg-tertiary">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-gray uppercase tracking-wider">
                Skladište
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-gray uppercase tracking-wider">
                Lokacija
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-gray uppercase tracking-wider">
                Kapacitet
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-gray uppercase tracking-wider">
                Statistika
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-gray uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-primary-gray uppercase tracking-wider">
                Akcije
              </th>
            </tr>
          </thead>
          <tbody className="bg-bg-primary divide-y divide-bg-tertiary">
            {warehouses.map((warehouse) => (
              <tr key={warehouse.id} className="hover:bg-bg-secondary transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-primary-dark">{warehouse.name}</div>
                    <div className="text-sm text-primary-gray">{warehouse.code}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-primary-dark">
                    <MapPin size={16} className="text-primary-gray" />
                    {warehouse.location}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-primary-dark font-medium">
                    {warehouse.capacity.toLocaleString()} L
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1 text-xs">
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-primary-gray" />
                      <span>{warehouse._count?.users || 0} korisnika</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package size={14} className="text-primary-gray" />
                      <span>{warehouse._count?.fuelEntries || 0} ulaza</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {warehouse.isActive ? (
                    <span className="flex items-center gap-1 text-status-success text-sm">
                      <CheckCircle size={16} />
                      Aktivno
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-status-danger text-sm">
                      <XCircle size={16} />
                      Neaktivno
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => onEdit(warehouse)}
                    className="text-primary-blue hover:text-primary-blue-hover mr-4"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => onDelete(warehouse.id)}
                    className="text-status-danger hover:text-red-700"
                    disabled={!warehouse.isActive}
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
