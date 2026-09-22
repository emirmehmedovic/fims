'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import {
  Calculator,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Upload,
  Download,
  Thermometer,
  Fuel
} from 'lucide-react'

interface CorrectionFactor {
  id: string
  productName: string
  temperature: number
  factor: number
  isActive: boolean
}

export default function CorrectionFactorsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [factors, setFactors] = useState<CorrectionFactor[]>([])
  const [availableProducts, setAvailableProducts] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ productName: '', temperature: '', factor: '' })
  const [showAddForm, setShowAddForm] = useState(false)
  const [newFactor, setNewFactor] = useState({ productName: '', temperature: '', factor: '' })
  const [filterProduct, setFilterProduct] = useState('')

  // Fetch available products from all fuel entries
  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/correction-factors/products')
      const data = await res.json()
      if (data.success) {
        setAvailableProducts(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  // Check access
  useEffect(() => {
    if (session && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }
    fetchFactors()
    fetchProducts()
  }, [session, router])

  const fetchFactors = async () => {
    try {
      const res = await fetch('/api/correction-factors?pageSize=500')
      const data = await res.json()
      if (data.success) {
        setFactors(data.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching correction factors:', error)
      toast.error('Greška pri učitavanju faktora korekcije')
    } finally {
      setLoading(false)
    }
  }

  const handleAddFactor = async () => {
    if (!newFactor.productName || !newFactor.temperature || !newFactor.factor) {
      toast.error('Sva polja su obavezna')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/correction-factors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: newFactor.productName,
          temperature: parseFloat(newFactor.temperature),
          factor: parseFloat(newFactor.factor)
        })
      })
      const data = await res.json()

      if (data.success) {
        toast.success('Faktor korekcije dodan')
        setNewFactor({ productName: '', temperature: '', factor: '' })
        setShowAddForm(false)
        fetchFactors()
      } else {
        toast.error(data.error || 'Greška pri dodavanju')
      }
    } catch (error) {
      toast.error('Greška pri dodavanju faktora')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateFactor = async (id: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/correction-factors/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: editForm.productName,
          temperature: parseFloat(editForm.temperature),
          factor: parseFloat(editForm.factor)
        })
      })
      const data = await res.json()

      if (data.success) {
        toast.success('Faktor ažuriran')
        setEditingId(null)
        fetchFactors()
      } else {
        toast.error(data.error || 'Greška pri ažuriranju')
      }
    } catch (error) {
      toast.error('Greška pri ažuriranju faktora')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteFactor = async (id: string) => {
    if (!confirm('Jeste li sigurni da želite obrisati ovaj faktor?')) return

    try {
      const res = await fetch(`/api/correction-factors/${id}`, {
        method: 'DELETE'
      })
      const data = await res.json()

      if (data.success) {
        toast.success('Faktor obrisan')
        fetchFactors()
      } else {
        toast.error(data.error || 'Greška pri brisanju')
      }
    } catch (error) {
      toast.error('Greška pri brisanju faktora')
    }
  }

  const handleSeedData = async () => {
    if (!confirm('Ovo će dodati standardne faktore korekcije. Nastaviti?')) return

    setSaving(true)
    try {
      // First get the sample data
      const sampleRes = await fetch('/api/correction-factors/bulk')
      const sampleData = await sampleRes.json()

      if (!sampleData.success) {
        throw new Error('Failed to get sample data')
      }

      // Then import it
      const res = await fetch('/api/correction-factors/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          factors: sampleData.data.factors,
          replaceExisting: false
        })
      })
      const data = await res.json()

      if (data.success) {
        toast.success(`Dodano ${data.data.count} faktora korekcije`)
        fetchFactors()
      } else {
        toast.error(data.error || 'Greška pri unosu')
      }
    } catch (error) {
      toast.error('Greška pri unosu standardnih faktora')
    } finally {
      setSaving(false)
    }
  }

  const startEditing = (factor: CorrectionFactor) => {
    setEditingId(factor.id)
    setEditForm({
      productName: factor.productName,
      temperature: factor.temperature.toString(),
      factor: factor.factor.toString()
    })
  }

  // Get unique product names for filter
  const productNames = [...new Set(factors.map(f => f.productName))].sort()

  // Filter factors
  const filteredFactors = filterProduct
    ? factors.filter(f => f.productName === filterProduct)
    : factors

  // Group by product
  const groupedFactors = filteredFactors.reduce((acc, factor) => {
    if (!acc[factor.productName]) {
      acc[factor.productName] = []
    }
    acc[factor.productName].push(factor)
    return acc
  }, {} as Record<string, CorrectionFactor[]>)

  // Sort each group by temperature
  Object.keys(groupedFactors).forEach(product => {
    groupedFactors[product].sort((a, b) => a.temperature - b.temperature)
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-dark-500">Učitavanje...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center shadow-lg">
            <Calculator className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-dark-900">Faktori korekcije</h1>
            <p className="text-dark-500">Upravljanje faktorima korekcije po proizvodu i temperaturi</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSeedData}
            disabled={saving}
            className="px-4 py-2 bg-amber-100 text-amber-700 rounded-xl hover:bg-amber-200 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Učitaj standardne faktore
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm font-semibold"
          >
            <Plus className="w-4 h-4" />
            Dodaj faktor
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <select
          value={filterProduct}
          onChange={(e) => setFilterProduct(e.target.value)}
          className="input w-64"
        >
          <option value="">Svi proizvodi</option>
          {productNames.map(product => (
            <option key={product} value={product}>{product}</option>
          ))}
        </select>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="mb-6 bg-indigo-50 rounded-xl p-5 border border-indigo-200">
          <h3 className="text-sm font-bold text-indigo-800 mb-4">Novi faktor korekcije</h3>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-slate-600 mb-1">Naziv proizvoda</label>
              <select
                value={newFactor.productName}
                onChange={(e) => setNewFactor({ ...newFactor, productName: e.target.value })}
                className="input w-full"
              >
                <option value="">-- Odaberi proizvod --</option>
                {availableProducts.map(product => (
                  <option key={product} value={product}>{product}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">Temperatura (°C)</label>
              <input
                type="number"
                step="0.1"
                value={newFactor.temperature}
                onChange={(e) => setNewFactor({ ...newFactor, temperature: e.target.value })}
                className="input w-full"
                placeholder="15"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">Faktor</label>
              <input
                type="number"
                step="0.000001"
                value={newFactor.factor}
                onChange={(e) => setNewFactor({ ...newFactor, factor: e.target.value })}
                className="input w-full"
                placeholder="1.000000"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleAddFactor}
                disabled={saving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Spremi
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Factors Table */}
      {Object.keys(groupedFactors).length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl">
          <Calculator className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Nema faktora korekcije</p>
          <p className="text-sm text-slate-400 mt-1">Kliknite "Učitaj standardne faktore" za početne vrijednosti</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedFactors).map(([productName, productFactors]) => (
            <div key={productName} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
                <Fuel className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800">{productName}</h3>
                <span className="text-sm text-slate-500">({productFactors.length} temperatura)</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Temperatura</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Faktor</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Akcije</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {productFactors.map((factor) => (
                      <tr key={factor.id} className="hover:bg-slate-50">
                        {editingId === factor.id ? (
                          <>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                step="0.1"
                                value={editForm.temperature}
                                onChange={(e) => setEditForm({ ...editForm, temperature: e.target.value })}
                                className="input w-24"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                step="0.000001"
                                value={editForm.factor}
                                onChange={(e) => setEditForm({ ...editForm, factor: e.target.value })}
                                className="input w-32"
                              />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => handleUpdateFactor(factor.id)}
                                  disabled={saving}
                                  className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                                >
                                  <Save className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="p-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Thermometer className="w-4 h-4 text-slate-400" />
                                <span className="font-medium">{Number(factor.temperature)}°C</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-mono font-semibold text-indigo-700">
                                {Number(factor.factor).toFixed(6)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => startEditing(factor)}
                                  className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteFactor(factor.id)}
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
