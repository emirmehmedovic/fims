'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface CreateUserModalProps {
  onClose: () => void
  onSuccess: () => void
}

export default function CreateUserModal({ onClose, onSuccess }: CreateUserModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [warehouses, setWarehouses] = useState<any[]>([])

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'OPERATOR',
    warehouseIds: [] as string[]
  })

  useEffect(() => {
    fetchWarehouses()
  }, [])

  const fetchWarehouses = async () => {
    try {
      const response = await fetch('/api/warehouses')
      const data = await response.json()
      if (data.success) {
        setWarehouses(data.data)
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.warehouseIds.length === 0) {
      setError('Morate dodijeliti najmanje jedno skladište')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        onSuccess()
      } else {
        setError(data.error || 'Greška pri kreiranju korisnika')
      }
    } catch (error) {
      setError('Greška pri kreiranju korisnika')
    } finally {
      setLoading(false)
    }
  }

  const toggleWarehouse = (warehouseId: string) => {
    setFormData(prev => ({
      ...prev,
      warehouseIds: prev.warehouseIds.includes(warehouseId)
        ? prev.warehouseIds.filter((id: string) => id !== warehouseId)
        : [...prev.warehouseIds, warehouseId]
    }))
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Novi Korisnik</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-bg-secondary rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Ime i prezime <span className="text-status-danger">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input w-full"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Email <span className="text-status-danger">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input w-full"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Password <span className="text-status-danger">*</span>
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="input w-full"
              minLength={8}
              required
            />
            <p className="text-xs text-primary-gray mt-1">Minimalno 8 karaktera</p>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Uloga <span className="text-status-danger">*</span>
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="input w-full"
              required
            >
              <option value="OPERATOR">Operator</option>
              <option value="VIEWER">Preglednik</option>
              <option value="ADMIN">Administrator</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
          </div>

          {/* Warehouses */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Skladišta <span className="text-status-danger">*</span>
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto border border-bg-tertiary rounded-lg p-3">
              {warehouses.map(warehouse => (
                <label key={warehouse.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.warehouseIds.includes(warehouse.id)}
                    onChange={() => toggleWarehouse(warehouse.id)}
                    className="rounded"
                  />
                  <span className="text-sm">{warehouse.code} - {warehouse.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-status-danger/10 text-status-danger px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-bg-secondary rounded-xl font-semibold hover:bg-bg-tertiary transition-colors"
            >
              Otkaži
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary"
            >
              {loading ? 'Kreiranje...' : 'Kreiraj Korisnika'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
