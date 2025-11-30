'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, X, Check, Package, Globe, MapPin, Sparkles, Truck, Building2 } from 'lucide-react'

interface LookupItem {
  id: string
  name: string
  description?: string
  code?: string
  address?: string
  contactPerson?: string
  phone?: string
  email?: string
  isActive: boolean
}

type LookupType = 'products' | 'countries' | 'pickupLocations' | 'fuelCharacteristics' | 'suppliers' | 'transporters'

interface TabConfig {
  type: LookupType
  label: string
  icon: React.ReactNode
  fields: { key: string; label: string; placeholder: string; required?: boolean }[]
  apiEndpoint?: string // Custom API endpoint for suppliers/transporters
}

const TABS: TabConfig[] = [
  {
    type: 'products',
    label: 'Proizvodi',
    icon: <Package size={18} />,
    fields: [
      { key: 'name', label: 'Naziv', placeholder: 'npr. Eurodizel', required: true },
      { key: 'description', label: 'Opis', placeholder: 'Opis proizvoda (opciono)' }
    ]
  },
  {
    type: 'countries',
    label: 'Zemlje',
    icon: <Globe size={18} />,
    fields: [
      { key: 'name', label: 'Naziv', placeholder: 'npr. Bosna i Hercegovina', required: true },
      { key: 'code', label: 'Kod', placeholder: 'npr. BiH' }
    ]
  },
  {
    type: 'pickupLocations',
    label: 'Lokacije',
    icon: <MapPin size={18} />,
    fields: [
      { key: 'name', label: 'Naziv', placeholder: 'npr. Rafinerija Brod', required: true },
      { key: 'address', label: 'Adresa', placeholder: 'Adresa lokacije (opciono)' }
    ]
  },
  {
    type: 'fuelCharacteristics',
    label: 'Karakteristike',
    icon: <Sparkles size={18} />,
    fields: [
      { key: 'name', label: 'Naziv', placeholder: 'npr. Aditivirano', required: true },
      { key: 'description', label: 'Opis', placeholder: 'Opis karakteristike (opciono)' }
    ]
  },
  {
    type: 'suppliers',
    label: 'Dobavljači',
    icon: <Building2 size={18} />,
    apiEndpoint: '/api/suppliers',
    fields: [
      { key: 'name', label: 'Naziv', placeholder: 'npr. HIFA Petrol d.o.o.', required: true },
      { key: 'code', label: 'Šifra', placeholder: 'npr. HIFA-001', required: true },
      { key: 'address', label: 'Adresa', placeholder: 'Adresa dobavljača' },
      { key: 'contactPerson', label: 'Kontakt osoba', placeholder: 'Ime i prezime' },
      { key: 'phone', label: 'Telefon', placeholder: '+387 33 123 456' },
      { key: 'email', label: 'Email', placeholder: 'info@example.com' }
    ]
  },
  {
    type: 'transporters',
    label: 'Prevoznici',
    icon: <Truck size={18} />,
    apiEndpoint: '/api/transporters',
    fields: [
      { key: 'name', label: 'Naziv', placeholder: 'npr. Transport d.o.o.', required: true },
      { key: 'code', label: 'Šifra', placeholder: 'npr. TRANS-001', required: true },
      { key: 'address', label: 'Adresa', placeholder: 'Adresa prevoznika' },
      { key: 'contactPerson', label: 'Kontakt osoba', placeholder: 'Ime i prezime' },
      { key: 'phone', label: 'Telefon', placeholder: '+387 33 123 456' },
      { key: 'email', label: 'Email', placeholder: 'info@example.com' }
    ]
  }
]

export default function MasterDataManager() {
  const [activeTab, setActiveTab] = useState<LookupType>('products')
  const [items, setItems] = useState<LookupItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [error, setError] = useState('')

  const currentTab = TABS.find(t => t.type === activeTab)!

  useEffect(() => {
    fetchItems()
  }, [activeTab])

  // Get API endpoint based on tab type
  const getApiEndpoint = () => {
    return currentTab.apiEndpoint || '/api/lookups'
  }

  const fetchItems = async () => {
    setLoading(true)
    try {
      const endpoint = currentTab.apiEndpoint 
        ? `${currentTab.apiEndpoint}?includeInactive=true`
        : `/api/lookups?type=${activeTab}&includeInactive=true`
      
      const res = await fetch(endpoint)
      const data = await res.json()
      if (data.success) {
        setItems(data.data)
      }
    } catch (error) {
      console.error('Error fetching items:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    setError('')
    
    // Validate required fields
    const requiredFields = currentTab.fields.filter(f => f.required)
    for (const field of requiredFields) {
      if (!formData[field.key]?.trim()) {
        setError(`${field.label} je obavezno polje`)
        return
      }
    }

    try {
      const endpoint = currentTab.apiEndpoint || '/api/lookups'
      const body = currentTab.apiEndpoint 
        ? formData 
        : { type: activeTab, ...formData }
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      
      if (data.success) {
        setShowAddForm(false)
        setFormData({})
        fetchItems()
      } else {
        setError(data.error || 'Greška pri dodavanju')
      }
    } catch (error) {
      setError('Greška pri dodavanju')
    }
  }

  const handleUpdate = async (id: string) => {
    setError('')
    
    // Validate required fields
    const requiredFields = currentTab.fields.filter(f => f.required)
    for (const field of requiredFields) {
      if (!formData[field.key]?.trim()) {
        setError(`${field.label} je obavezno polje`)
        return
      }
    }

    try {
      const endpoint = currentTab.apiEndpoint 
        ? `${currentTab.apiEndpoint}/${id}`
        : `/api/lookups/${id}`
      const body = currentTab.apiEndpoint 
        ? formData 
        : { type: activeTab, ...formData }
      
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      
      if (data.success) {
        setEditingId(null)
        setFormData({})
        fetchItems()
      } else {
        setError(data.error || 'Greška pri ažuriranju')
      }
    } catch (error) {
      setError('Greška pri ažuriranju')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Da li ste sigurni da želite deaktivirati ovu stavku?')) return

    try {
      const endpoint = currentTab.apiEndpoint 
        ? `${currentTab.apiEndpoint}/${id}`
        : `/api/lookups/${id}?type=${activeTab}`
      
      const res = await fetch(endpoint, {
        method: 'DELETE'
      })
      const data = await res.json()
      
      if (data.success) {
        fetchItems()
      }
    } catch (error) {
      console.error('Error deleting item:', error)
    }
  }

  const handleToggleActive = async (item: LookupItem) => {
    try {
      const endpoint = currentTab.apiEndpoint 
        ? `${currentTab.apiEndpoint}/${item.id}`
        : `/api/lookups/${item.id}`
      const body = currentTab.apiEndpoint 
        ? { isActive: !item.isActive }
        : { type: activeTab, isActive: !item.isActive }
      
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      
      if (data.success) {
        fetchItems()
      }
    } catch (error) {
      console.error('Error toggling item:', error)
    }
  }

  const startEdit = (item: LookupItem) => {
    setEditingId(item.id)
    setFormData({
      name: item.name,
      description: item.description || '',
      code: item.code || '',
      address: item.address || '',
      contactPerson: item.contactPerson || '',
      phone: item.phone || '',
      email: item.email || ''
    })
    setError('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setFormData({})
    setError('')
  }

  return (
    <div className="bg-white rounded-2xl shadow-[var(--shadow-soft)] overflow-hidden">
      {/* Tabs Header - Responsive */}
      <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-dark-100">
        <div className="flex flex-wrap gap-2">
          {TABS.map(tab => (
            <button
              key={tab.type}
              onClick={() => {
                setActiveTab(tab.type)
                setShowAddForm(false)
                setEditingId(null)
                setFormData({})
                setError('')
              }}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                activeTab === tab.type
                  ? 'bg-dark-900 text-white shadow-[var(--shadow-soft-xl)]'
                  : 'bg-dark-50 text-dark-600 hover:bg-dark-100 hover:text-dark-900'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {/* Add Button */}
        {!showAddForm && !editingId && (
          <button
            onClick={() => {
              setShowAddForm(true)
              setFormData({})
              setError('')
            }}
            className="btn-primary flex items-center gap-2 text-sm mb-4 sm:mb-6"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Dodaj {currentTab.label.slice(0, -1).toLowerCase()}</span>
            <span className="sm:hidden">Dodaj</span>
          </button>
        )}

        {/* Add Form */}
        {showAddForm && (
          <div className="bg-dark-50 p-4 sm:p-5 rounded-2xl mb-4 sm:mb-6 border border-dark-100">
            <h4 className="font-semibold text-dark-900 mb-4 flex items-center gap-2 text-sm sm:text-base">
              <Plus size={18} className="text-dark-900" />
              Novi unos - {currentTab.label}
            </h4>
            {error && (
              <div className="bg-error/10 text-error text-sm px-4 py-2 rounded-xl mb-4 border border-error/20">
                {error}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
              {currentTab.fields.map(field => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-dark-500 uppercase tracking-wide mb-1.5 sm:mb-2">
                    {field.label}
                  </label>
                  <input
                    type="text"
                    placeholder={field.placeholder}
                    value={formData[field.key] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                    className="input w-full"
                  />
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button 
                onClick={handleAdd} 
                className="btn-primary flex items-center justify-center gap-2 text-sm"
              >
                <Check size={16} />
                Sačuvaj
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setFormData({})
                  setError('')
                }}
                className="btn-secondary flex items-center justify-center gap-2 text-sm"
              >
                <X size={16} />
                Odustani
              </button>
            </div>
          </div>
        )}

        {/* Items List */}
        {loading ? (
          <div className="flex justify-center py-8 sm:py-12">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-dark-900"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-dark-100 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 text-dark-400">
              {currentTab.icon}
            </div>
            <p className="text-dark-500 font-medium text-sm sm:text-base">Nema podataka</p>
            <p className="text-dark-400 text-xs sm:text-sm mt-1">Dodajte prvi unos klikom na dugme iznad</p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {items.map(item => (
              <div
                key={item.id}
                className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all ${
                  item.isActive 
                    ? 'bg-white border-dark-100 hover:border-dark-200 hover:shadow-[var(--shadow-soft)]' 
                    : 'bg-dark-50 border-dark-100 opacity-60'
                }`}
              >
                {editingId === item.id ? (
                  <div>
                    {error && (
                      <div className="bg-error/10 text-error text-sm px-3 py-2 rounded-lg mb-3 border border-error/20">
                        {error}
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-3">
                      {currentTab.fields.map(field => (
                        <input
                          key={field.key}
                          type="text"
                          placeholder={field.placeholder}
                          value={formData[field.key] || ''}
                          onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                          className="input text-sm"
                        />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdate(item.id)}
                        className="p-2 bg-success/10 text-success rounded-lg hover:bg-success/20 transition-colors"
                      >
                        <Check size={18} />
                      </button>
                      <button 
                        onClick={cancelEdit} 
                        className="p-2 bg-dark-100 text-dark-600 rounded-lg hover:bg-dark-200 transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${
                        item.isActive ? 'bg-dark-900/5 text-dark-900' : 'bg-dark-100 text-dark-400'
                      }`}>
                        {currentTab.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-dark-900 text-sm sm:text-base truncate">{item.name}</span>
                          {item.code && (
                            <span className="px-2 py-0.5 bg-dark-100 text-dark-600 text-xs rounded-md font-mono">
                              {item.code}
                            </span>
                          )}
                        </div>
                        {(item.description || item.address || item.contactPerson || item.phone || item.email) && (
                          <div className="text-xs sm:text-sm text-dark-500 truncate mt-0.5">
                            {item.description || item.address || 
                              [item.contactPerson, item.phone, item.email].filter(Boolean).join(' • ')}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 ml-12 sm:ml-0">
                      <button
                        onClick={() => handleToggleActive(item)}
                        className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          item.isActive
                            ? 'bg-success/10 text-success hover:bg-success/20'
                            : 'bg-error/10 text-error hover:bg-error/20'
                        }`}
                      >
                        {item.isActive ? 'Aktivno' : 'Neaktivno'}
                      </button>
                      <button
                        onClick={() => startEdit(item)}
                        className="p-1.5 sm:p-2 text-dark-500 hover:text-dark-900 hover:bg-dark-100 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 sm:p-2 text-dark-500 hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
