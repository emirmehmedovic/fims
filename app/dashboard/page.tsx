'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { FileText, Droplets, Building2, Calendar, TrendingUp, Users } from 'lucide-react'
import { formatDateSarajevo } from '@/lib/utils/date'

interface DashboardStats {
  totalWarehouses: number
  totalEntries: number
  totalVolume: number
  entriesLast7Days: number
  entriesLast30Days: number
  entriesByWarehouse: Array<{
    warehouseId: string
    name: string
    code: string
    count: number
    volume: number
  }>
  entriesByProduct: Array<{
    productName: string
    count: number
    volume: number
  }>
  recentActivity: Array<{
    id: string
    registrationNumber: number
    entryDate: string
    warehouse: string
    warehouseCode: string
    productName: string
    quantity: number
    operator: string
    createdAt: string
  }>
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/dashboard/stats')
      const data = await res.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => formatDateSarajevo(dateString)

  const todayLabel = formatDateSarajevo(new Date())

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
            <p className="text-dark-500">Učitavam statistiku...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      {/* Hero Section */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Stats Card */}
        <div className="bg-gradient-to-br from-dark-900 to-dark-800 rounded-3xl p-8 text-white shadow-[var(--shadow-soft-xl)] relative overflow-hidden flex flex-col justify-between h-[340px]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-500 opacity-10 rounded-full blur-3xl -ml-12 -mb-12"></div>

          <div className="relative z-10 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-dark-300 text-sm font-medium mb-1">Ukupna količina goriva</p>
                <h3 className="text-4xl font-bold tracking-tight">{(stats?.totalVolume || 0).toLocaleString()} L</h3>
                <p className="text-xs text-dark-300 mt-1">{stats?.totalVolume?.toLocaleString() || 0} litara ukupno</p>
              </div>
              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                <Droplets className="w-6 h-6 text-white" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              {[
                { label: 'Ukupno prijava', value: stats?.totalEntries || 0, accent: 'text-primary-200' },
                { label: 'Zadnjih 7 dana', value: `+${stats?.entriesLast7Days || 0}`, accent: 'text-emerald-200' },
                { label: 'Skladišta', value: stats?.totalWarehouses || 0, accent: 'text-amber-200' },
              ].map((item) => (
                <div key={item.label} className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-[11px] uppercase tracking-wide text-dark-200 font-semibold">{item.label}</p>
                  <p className={`text-xl font-bold ${item.accent}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 mt-auto">
            <p className="text-xs text-dark-300 mb-2">{todayLabel}</p>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-white text-dark-900 flex items-center justify-center font-bold shadow-[var(--shadow-soft)]">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-dark-200">Dobrodošli, {session?.user?.name}</p>
                <p className="text-xs text-dark-300">Fuel Inventory Management</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex flex-wrap gap-6">
            {[
              {
                title: 'Ukupno prijava',
                value: stats?.totalEntries?.toLocaleString() || '0',
                icon: FileText,
                trend: `+${stats?.entriesLast7Days || 0} (7d)`,
                color: 'text-blue-600',
                bgColor: 'bg-blue-50',
                badge: 'Sve vrijeme',
              },
              {
                title: 'Ukupna količina',
                value: `${(stats?.totalVolume || 0).toLocaleString()} L`,
                icon: Droplets,
                trend: 'Litara',
                color: 'text-emerald-600',
                bgColor: 'bg-emerald-50',
                badge: 'Gorivo',
              },
              {
                title: 'Aktivna skladišta',
                value: stats?.totalWarehouses || '0',
                icon: Building2,
                trend: 'Operativno',
                color: 'text-amber-600',
                bgColor: 'bg-amber-50',
                badge: 'Status',
              },
              {
                title: 'Zadnjih 30 dana',
                value: stats?.entriesLast30Days || '0',
                icon: Calendar,
                trend: 'Prijava',
                color: 'text-indigo-600',
                bgColor: 'bg-indigo-50',
                badge: 'Mjesečno',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="stat-card flex flex-col justify-between h-[160px] basis-full md:basis-[calc(50%-12px)] flex-grow"
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
        </div>
      </section>

      {/* Charts Row */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Entries by Warehouse */}
        <div className="bg-white rounded-3xl p-8 shadow-[var(--shadow-soft)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-white/70 to-primary-100/50 opacity-70"></div>
          <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-primary-200 rounded-full blur-3xl opacity-50"></div>
          
          <div className="relative z-10">
            <h3 className="text-lg font-bold text-dark-900 mb-6">Prijave po skladištu</h3>
            {stats?.entriesByWarehouse && stats.entriesByWarehouse.length > 0 ? (
              <div className="space-y-4">
                {stats.entriesByWarehouse.map((item) => {
                  const maxCount = Math.max(...stats.entriesByWarehouse.map(w => w.count))
                  const percentage = (item.count / maxCount) * 100
                  return (
                    <div key={item.warehouseId} className="p-3 rounded-2xl bg-dark-50 border border-dark-100">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-dark-900 font-semibold">{item.code} - {item.name}</span>
                        <span className="text-dark-500">{item.count} prijava</span>
                      </div>
                      <div className="h-2 bg-dark-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary-600 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="text-xs text-dark-500 mt-2">
                        {item.volume.toLocaleString()} L
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-dark-400">Nema podataka</div>
            )}
          </div>
        </div>

        {/* Entries by Product */}
        <div className="bg-white rounded-3xl p-8 shadow-[var(--shadow-soft)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white/70 to-blue-100/50 opacity-70"></div>
          <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-blue-200 rounded-full blur-3xl opacity-50"></div>
          
          <div className="relative z-10">
            <h3 className="text-lg font-bold text-dark-900 mb-6">Prijave po proizvodu</h3>
            {stats?.entriesByProduct && stats.entriesByProduct.length > 0 ? (
              <div className="space-y-4">
                {stats.entriesByProduct.slice(0, 5).map((item, index) => {
                  const colors = ['bg-primary-600', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-pink-500']
                  const maxCount = Math.max(...stats.entriesByProduct.map(p => p.count))
                  const percentage = (item.count / maxCount) * 100
                  return (
                    <div key={item.productName} className="p-3 rounded-2xl bg-dark-50 border border-dark-100 hover:border-primary-200 hover:bg-primary-50 transition-all">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-dark-900 font-semibold">{item.productName}</span>
                        <span className="text-dark-500">{item.count} prijava</span>
                      </div>
                      <div className="h-2 bg-dark-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${colors[index % colors.length]} rounded-full transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="text-xs text-dark-500 mt-2">
                        {item.volume.toLocaleString()} L
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-dark-400">Nema podataka</div>
            )}
          </div>
        </div>
      </section>

      {/* Recent Activity */}
      <section className="bg-white rounded-3xl p-8 shadow-[var(--shadow-soft)]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-dark-900">Nedavna aktivnost</h3>
          <a href="/dashboard/fuel-entries" className="px-4 py-2 rounded-xl text-sm font-medium bg-dark-50 text-dark-600 hover:bg-dark-100 hover:text-dark-900 transition-colors">
            Vidi sve
          </a>
        </div>
        
        {stats?.recentActivity && stats.recentActivity.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-100">
                  <th className="table-header">Reg. broj</th>
                  <th className="table-header">Datum</th>
                  <th className="table-header">Skladište</th>
                  <th className="table-header">Proizvod</th>
                  <th className="table-header text-right">Količina</th>
                  <th className="table-header">Operator</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentActivity.map((entry) => (
                  <tr key={entry.id} className="table-row">
                    <td className="table-cell">
                      <span className="font-mono font-bold text-primary-600">
                        {entry.registrationNumber}
                      </span>
                    </td>
                    <td className="table-cell">
                      {formatDate(entry.entryDate)}
                    </td>
                    <td className="table-cell">
                      <div className="font-semibold text-dark-900">{entry.warehouseCode}</div>
                      <div className="text-xs text-dark-500">{entry.warehouse}</div>
                    </td>
                    <td className="table-cell">
                      {entry.productName}
                    </td>
                    <td className="table-cell text-right">
                      <span className="font-bold text-dark-900">
                        {entry.quantity.toLocaleString()} L
                      </span>
                    </td>
                    <td className="table-cell text-dark-500">
                      {entry.operator}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-dark-400">
            Nema nedavne aktivnosti
          </div>
        )}
      </section>
    </div>
  )
}
