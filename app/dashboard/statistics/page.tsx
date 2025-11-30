'use client'

import { useState, useEffect } from 'react'
import { 
  BarChart3, TrendingUp, Package, Building2, Truck, Globe, Fuel, 
  Calendar, Loader2, ArrowUpRight, ArrowDownRight, MapPin, FlaskConical,
  Users, Sparkles, FileCheck, AlertTriangle, FileText
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts'

type TabType = 'overview' | 'warehouses' | 'suppliers' | 'transporters' | 'products' | 'quality' | 'operations' | 'alerts'

interface StatisticsData {
  period: string
  months: string[]
  summary: {
    totalQuantity: number
    totalEntries: number
    avgQuantityPerEntry: number
    higherQualityCount: number
    higherQualityPercent: number
    warehouseCount: number
    supplierCount: number
    transporterCount: number
    productCount: number
    certificatePercent: number
    customsPercent: number
    withCertificate: number
    withCustomsDeclaration: number
    momChange: number
    yoyChange: number
  }
  monthlyTotals: { month: string; quantity: number; count: number }[]
  entriesByWarehouse: { id: string; name: string; code: string; data: { month: string; quantity: number }[] }[]
  entriesBySupplier: { name: string; code: string; quantity: number; count: number }[]
  entriesByTransporter: { name: string; code: string; quantity: number; count: number }[]
  entriesByProduct: { name: string; quantity: number; count: number }[]
  entriesByCountry: { name: string; quantity: number; count: number }[]
  entriesByCharacteristic: { name: string; count: number }[]
  higherQualityTrend: { month: string; count: number; total: number; percent: number }[]
  entriesByLocation: { name: string; quantity: number; count: number }[]
  entriesByLaboratory: { name: string; count: number }[]
  topDrivers: { name: string; count: number; quantity: number }[]
  entriesByDayOfWeek: { day: number; name: string; count: number; quantity: number }[]
  alerts: {
    inactiveWarehouses: { name: string; code: string }[]
    outlierEntries: { registrationNumber: number; quantity: number; warehouse: string; date: string; type: string }[]
  }
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

const PERIODS = [
  { value: '1month', label: '1 mjesec' },
  { value: '3months', label: '3 mjeseca' },
  { value: '6months', label: '6 mjeseci' },
  { value: '1year', label: '1 godina' },
]

const TABS = [
  { id: 'overview', label: 'Pregled', icon: TrendingUp },
  { id: 'warehouses', label: 'Skladišta', icon: Package },
  { id: 'suppliers', label: 'Dobavljači', icon: Building2 },
  { id: 'transporters', label: 'Prevoznici', icon: Truck },
  { id: 'products', label: 'Proizvodi', icon: Fuel },
  { id: 'quality', label: 'Kvaliteta', icon: Sparkles },
  { id: 'operations', label: 'Operacije', icon: Users },
  { id: 'alerts', label: 'Upozorenja', icon: AlertTriangle },
]

export default function StatisticsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [period, setPeriod] = useState('6months')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<StatisticsData | null>(null)

  useEffect(() => {
    fetchStatistics()
  }, [period])

  const fetchStatistics = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/statistics?period=${period}`)
      const json = await res.json()
      if (json.success) {
        setData(json.data)
      }
    } catch (error) {
      console.error('Error fetching statistics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatQuantity = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
    return value.toString()
  }

  const formatMonth = (month: string) => {
    const [year, m] = month.split('-')
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec']
    return `${months[parseInt(m) - 1]} ${year.slice(2)}`
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-dark-900 to-dark-800 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-500 opacity-10 rounded-full blur-3xl -ml-12 -mb-12"></div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="p-3 sm:p-4 bg-white/10 rounded-xl sm:rounded-2xl backdrop-blur-md">
              <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1">Statistika</h1>
              <p className="text-dark-300 text-sm">Detaljna analiza ulaza goriva</p>
            </div>
          </div>

          {/* Period Selector */}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-white/10 border border-white/20 text-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
          >
            {PERIODS.map(p => (
              <option key={p.value} value={p.value} className="text-dark-900">{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-dark-100 p-1.5 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-dark-900 text-white'
                  : 'text-dark-600 hover:bg-dark-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-dark-400 animate-spin" />
        </div>
      ) : data ? (
        <>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Summary Cards - Row 1 */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Ukupna količina"
                  value={`${formatQuantity(data.summary.totalQuantity)} L`}
                  icon={Fuel}
                  color="blue"
                />
                <StatCard
                  title="Broj ulaza"
                  value={data.summary.totalEntries.toString()}
                  icon={Package}
                  color="green"
                />
                <StatCard
                  title="MoM promjena"
                  value={`${data.summary.momChange > 0 ? '+' : ''}${data.summary.momChange}%`}
                  subtitle="vs prethodni mjesec"
                  icon={data.summary.momChange >= 0 ? ArrowUpRight : ArrowDownRight}
                  color={data.summary.momChange >= 0 ? 'green' : 'amber'}
                />
                <StatCard
                  title="YoY promjena"
                  value={`${data.summary.yoyChange > 0 ? '+' : ''}${data.summary.yoyChange}%`}
                  subtitle="vs prošla godina"
                  icon={data.summary.yoyChange >= 0 ? ArrowUpRight : ArrowDownRight}
                  color={data.summary.yoyChange >= 0 ? 'green' : 'amber'}
                />
              </div>

              {/* Summary Cards - Row 2 */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Viša kvaliteta"
                  value={`${data.summary.higherQualityPercent}%`}
                  subtitle={`${data.summary.higherQualityCount} ulaza`}
                  icon={Sparkles}
                  color="purple"
                />
                <StatCard
                  title="Sa certifikatom"
                  value={`${data.summary.certificatePercent}%`}
                  subtitle={`${data.summary.withCertificate} ulaza`}
                  icon={FileCheck}
                  color="blue"
                />
                <StatCard
                  title="Carinska dekl."
                  value={`${data.summary.customsPercent}%`}
                  subtitle={`${data.summary.withCustomsDeclaration} ulaza`}
                  icon={FileText}
                  color="amber"
                />
                <StatCard
                  title="Prosječna količina"
                  value={`${formatQuantity(data.summary.avgQuantityPerEntry)} L`}
                  icon={TrendingUp}
                  color="green"
                />
              </div>

              {/* Main Chart - Monthly Totals */}
              <div className="bg-white rounded-2xl shadow-sm border border-dark-100 p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-dark-900 mb-4">Mjesečni ulazi goriva</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.monthlyTotals}>
                      <defs>
                        <linearGradient id="colorQuantity" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="month" 
                        tickFormatter={formatMonth}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                      />
                      <YAxis 
                        tickFormatter={formatQuantity}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`${value.toLocaleString()} L`, 'Količina']}
                        labelFormatter={formatMonth}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="quantity" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        fill="url(#colorQuantity)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Two Column Charts */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* By Product */}
                <div className="bg-white rounded-2xl shadow-sm border border-dark-100 p-4 sm:p-6">
                  <h3 className="text-lg font-semibold text-dark-900 mb-4">Po proizvodu</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.entriesByProduct}
                          dataKey="quantity"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, percent }) => `${(name || '').toString().split(' ')[0]} ${((percent || 0) * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {data.entriesByProduct.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `${value.toLocaleString()} L`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* By Country */}
                <div className="bg-white rounded-2xl shadow-sm border border-dark-100 p-4 sm:p-6">
                  <h3 className="text-lg font-semibold text-dark-900 mb-4">Po zemlji porijekla</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.entriesByCountry} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis type="number" tickFormatter={formatQuantity} tick={{ fontSize: 11 }} />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          width={120} 
                          tick={{ fontSize: 11 }}
                          tickFormatter={(value) => value.length > 15 ? value.slice(0, 15) + '...' : value}
                        />
                        <Tooltip formatter={(value: number) => `${value.toLocaleString()} L`} />
                        <Bar dataKey="quantity" fill="#10b981" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Warehouses Tab */}
          {activeTab === 'warehouses' && (
            <div className="space-y-6">
              {/* Warehouse Line Chart */}
              <div className="bg-white rounded-2xl shadow-sm border border-dark-100 p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-dark-900 mb-4">Ulazi po skladištima kroz vrijeme</h3>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="month" 
                        tickFormatter={formatMonth}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        allowDuplicatedCategory={false}
                      />
                      <YAxis 
                        tickFormatter={formatQuantity}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                      />
                      <Tooltip 
                        formatter={(value: number) => `${value.toLocaleString()} L`}
                        labelFormatter={formatMonth}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }}
                      />
                      <Legend />
                      {data.entriesByWarehouse.map((wh, index) => (
                        <Line
                          key={wh.id}
                          data={wh.data}
                          type="monotone"
                          dataKey="quantity"
                          name={wh.code}
                          stroke={COLORS[index % COLORS.length]}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Warehouse Cards */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.entriesByWarehouse.map((wh, index) => {
                  const total = wh.data.reduce((sum, d) => sum + d.quantity, 0)
                  return (
                    <div key={wh.id} className="bg-white rounded-xl border border-dark-100 p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <div>
                          <p className="font-medium text-dark-900">{wh.name}</p>
                          <p className="text-xs text-dark-500">{wh.code}</p>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-dark-900">{formatQuantity(total)} L</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Suppliers Tab */}
          {activeTab === 'suppliers' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-dark-100 p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-dark-900 mb-4">Količine po dobavljačima</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.entriesBySupplier}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="code" 
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                      />
                      <YAxis 
                        tickFormatter={formatQuantity}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                      />
                      <Tooltip 
                        formatter={(value: number) => `${value.toLocaleString()} L`}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }}
                      />
                      <Bar dataKey="quantity" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Supplier Table */}
              <div className="bg-white rounded-2xl shadow-sm border border-dark-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-dark-50">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-dark-600 uppercase">Dobavljač</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-dark-600 uppercase">Šifra</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-dark-600 uppercase">Količina</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-dark-600 uppercase">Br. ulaza</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-100">
                      {data.entriesBySupplier.map((sup, i) => (
                        <tr key={i} className="hover:bg-dark-50">
                          <td className="px-4 py-3 font-medium text-dark-900">{sup.name}</td>
                          <td className="px-4 py-3 text-dark-500 font-mono text-sm">{sup.code}</td>
                          <td className="px-4 py-3 text-right font-semibold text-dark-900">{sup.quantity.toLocaleString()} L</td>
                          <td className="px-4 py-3 text-right text-dark-600">{sup.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Transporters Tab */}
          {activeTab === 'transporters' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-dark-100 p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-dark-900 mb-4">Količine po prevoznicima</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.entriesByTransporter}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="code" 
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                      />
                      <YAxis 
                        tickFormatter={formatQuantity}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                      />
                      <Tooltip 
                        formatter={(value: number) => `${value.toLocaleString()} L`}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }}
                      />
                      <Bar dataKey="quantity" fill="#ec4899" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Transporter Table */}
              <div className="bg-white rounded-2xl shadow-sm border border-dark-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-dark-50">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-dark-600 uppercase">Prevoznik</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-dark-600 uppercase">Šifra</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-dark-600 uppercase">Količina</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-dark-600 uppercase">Br. ulaza</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-100">
                      {data.entriesByTransporter.map((trans, i) => (
                        <tr key={i} className="hover:bg-dark-50">
                          <td className="px-4 py-3 font-medium text-dark-900">{trans.name}</td>
                          <td className="px-4 py-3 text-dark-500 font-mono text-sm">{trans.code}</td>
                          <td className="px-4 py-3 text-right font-semibold text-dark-900">{trans.quantity.toLocaleString()} L</td>
                          <td className="px-4 py-3 text-right text-dark-600">{trans.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <div className="bg-white rounded-2xl shadow-sm border border-dark-100 p-4 sm:p-6">
                  <h3 className="text-lg font-semibold text-dark-900 mb-4">Distribucija po proizvodima</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.entriesByProduct}
                          dataKey="quantity"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                        >
                          {data.entriesByProduct.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `${value.toLocaleString()} L`} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Bar Chart */}
                <div className="bg-white rounded-2xl shadow-sm border border-dark-100 p-4 sm:p-6">
                  <h3 className="text-lg font-semibold text-dark-900 mb-4">Količine po proizvodima</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.entriesByProduct} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis type="number" tickFormatter={formatQuantity} tick={{ fontSize: 11 }} />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          width={100} 
                          tick={{ fontSize: 11 }}
                          tickFormatter={(value) => value.length > 12 ? value.slice(0, 12) + '...' : value}
                        />
                        <Tooltip formatter={(value: number) => `${value.toLocaleString()} L`} />
                        <Bar dataKey="quantity" radius={[0, 4, 4, 0]}>
                          {data.entriesByProduct.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Product Cards */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.entriesByProduct.map((prod, index) => (
                  <div key={prod.name} className="bg-white rounded-xl border border-dark-100 p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${COLORS[index % COLORS.length]}20` }}
                      >
                        <Fuel className="w-5 h-5" style={{ color: COLORS[index % COLORS.length] }} />
                      </div>
                      <div>
                        <p className="font-medium text-dark-900">{prod.name}</p>
                        <p className="text-xs text-dark-500">{prod.count} ulaza</p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-dark-900">{formatQuantity(prod.quantity)} L</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quality Tab */}
          {activeTab === 'quality' && (
            <div className="space-y-6">
              {/* Quality Trend */}
              <div className="bg-white rounded-2xl shadow-sm border border-dark-100 p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-dark-900 mb-4">Trend više kvalitete kroz vrijeme</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.higherQualityTrend}>
                      <defs>
                        <linearGradient id="colorPercent" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" tickFormatter={formatMonth} tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 12 }} />
                      <Tooltip 
                        formatter={(value: number, name: string) => [
                          name === 'percent' ? `${value}%` : value,
                          name === 'percent' ? 'Postotak' : 'Broj'
                        ]}
                        labelFormatter={formatMonth}
                      />
                      <Area type="monotone" dataKey="percent" stroke="#8b5cf6" strokeWidth={2} fill="url(#colorPercent)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Characteristics Distribution */}
                <div className="bg-white rounded-2xl shadow-sm border border-dark-100 p-4 sm:p-6">
                  <h3 className="text-lg font-semibold text-dark-900 mb-4">Distribucija karakteristika</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.entriesByCharacteristic} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Broj ulaza" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Laboratories */}
                <div className="bg-white rounded-2xl shadow-sm border border-dark-100 p-4 sm:p-6">
                  <h3 className="text-lg font-semibold text-dark-900 mb-4">Laboratorije</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.entriesByLaboratory}
                          dataKey="count"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                        >
                          {data.entriesByLaboratory.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Pickup Locations */}
              <div className="bg-white rounded-2xl shadow-sm border border-dark-100 p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-dark-900 mb-4">Lokacije preuzimanja</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.entriesByLocation}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} tickFormatter={(v) => v.length > 15 ? v.slice(0, 15) + '...' : v} />
                      <YAxis tickFormatter={formatQuantity} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value: number) => `${value.toLocaleString()} L`} />
                      <Bar dataKey="quantity" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Operations Tab */}
          {activeTab === 'operations' && (
            <div className="space-y-6">
              {/* Day of Week */}
              <div className="bg-white rounded-2xl shadow-sm border border-dark-100 p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-dark-900 mb-4">Ulazi po danima u sedmici</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.entriesByDayOfWeek}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis yAxisId="left" tickFormatter={formatQuantity} tick={{ fontSize: 11 }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                      <Tooltip 
                        formatter={(value: number, name: string) => [
                          name === 'quantity' ? `${value.toLocaleString()} L` : value,
                          name === 'quantity' ? 'Količina' : 'Broj ulaza'
                        ]}
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="quantity" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Količina" />
                      <Bar yAxisId="right" dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} name="Broj ulaza" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Drivers */}
              <div className="bg-white rounded-2xl shadow-sm border border-dark-100 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-dark-100">
                  <h3 className="text-lg font-semibold text-dark-900">Top 10 vozača</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-dark-50">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-dark-600 uppercase">#</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-dark-600 uppercase">Vozač</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-dark-600 uppercase">Br. dostava</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-dark-600 uppercase">Ukupna količina</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-100">
                      {data.topDrivers.map((driver, i) => (
                        <tr key={i} className="hover:bg-dark-50">
                          <td className="px-4 py-3 text-dark-500">{i + 1}</td>
                          <td className="px-4 py-3 font-medium text-dark-900">{driver.name}</td>
                          <td className="px-4 py-3 text-right text-dark-600">{driver.count}</td>
                          <td className="px-4 py-3 text-right font-semibold text-dark-900">{driver.quantity.toLocaleString()} L</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Countries */}
              <div className="bg-white rounded-2xl shadow-sm border border-dark-100 p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-dark-900 mb-4">Zemlje porijekla</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.entriesByCountry}
                        dataKey="quantity"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                      >
                        {data.entriesByCountry.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `${value.toLocaleString()} L`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Alerts Tab */}
          {activeTab === 'alerts' && (
            <div className="space-y-6">
              {/* Inactive Warehouses */}
              <div className="bg-white rounded-2xl shadow-sm border border-dark-100 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-dark-100 flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-dark-900">Neaktivna skladišta</h3>
                    <p className="text-sm text-dark-500">Skladišta bez ulaza u zadnjih 30 dana</p>
                  </div>
                </div>
                {data.alerts.inactiveWarehouses.length > 0 ? (
                  <div className="p-4 sm:p-6">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {data.alerts.inactiveWarehouses.map((wh, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                          <Package className="w-5 h-5 text-amber-600" />
                          <div>
                            <p className="font-medium text-dark-900">{wh.name}</p>
                            <p className="text-xs text-dark-500">{wh.code}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-dark-500">
                    <Package className="w-12 h-12 mx-auto mb-3 text-dark-300" />
                    <p>Sva skladišta su aktivna</p>
                  </div>
                )}
              </div>

              {/* Outlier Entries */}
              <div className="bg-white rounded-2xl shadow-sm border border-dark-100 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-dark-100 flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-dark-900">Neobične količine</h3>
                    <p className="text-sm text-dark-500">Ulazi sa značajno većim ili manjim količinama od prosjeka</p>
                  </div>
                </div>
                {data.alerts.outlierEntries.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-dark-50">
                        <tr>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-dark-600 uppercase">Reg. broj</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-dark-600 uppercase">Skladište</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-dark-600 uppercase">Količina</th>
                          <th className="text-center px-4 py-3 text-xs font-semibold text-dark-600 uppercase">Tip</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dark-100">
                        {data.alerts.outlierEntries.map((entry, i) => (
                          <tr key={i} className="hover:bg-dark-50">
                            <td className="px-4 py-3 font-mono text-dark-900">{entry.registrationNumber}</td>
                            <td className="px-4 py-3 text-dark-600">{entry.warehouse}</td>
                            <td className="px-4 py-3 text-right font-semibold text-dark-900">{entry.quantity.toLocaleString()} L</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                entry.type === 'high' 
                                  ? 'bg-emerald-100 text-emerald-700' 
                                  : 'bg-amber-100 text-amber-700'
                              }`}>
                                {entry.type === 'high' ? 'Visoka' : 'Niska'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-dark-500">
                    <TrendingUp className="w-12 h-12 mx-auto mb-3 text-dark-300" />
                    <p>Nema neobičnih količina</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20 text-dark-500">
          Nema dostupnih podataka
        </div>
      )}
    </div>
  )
}

function StatCard({ title, value, subtitle, icon: Icon, color }: {
  title: string
  value: string
  subtitle?: string
  icon: React.ElementType
  color: 'blue' | 'green' | 'amber' | 'purple'
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
  }

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-dark-100 p-4 sm:p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-xs sm:text-sm text-dark-500 mb-1">{title}</p>
      <p className="text-xl sm:text-2xl font-bold text-dark-900">{value}</p>
      {subtitle && <p className="text-xs text-dark-400 mt-0.5">{subtitle}</p>}
    </div>
  )
}
