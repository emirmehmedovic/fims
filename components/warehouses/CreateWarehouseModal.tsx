'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface CreateWarehouseModalProps {
  onClose: () => void
  onSuccess: () => void
}

export default function CreateWarehouseModal({ onClose, onSuccess }: CreateWarehouseModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    location: '',
    capacity: '',
    description: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/warehouses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          capacity: parseInt(formData.capacity)
        })
      })

      const data = await response.json()

      if (data.success) {
        onSuccess()
      } else {
        setError(data.error || 'Greška pri kreiranju skladišta')
      }
    } catch (error) {
      setError('Greška pri kreiranju skladišta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Novo Skladište</h2>
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
              Naziv skladišta <span className="text-status-danger">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input w-full"
              placeholder="npr. Glavni rezervoar"
              required
            />
          </div>

          {/* Code */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Šifra <span className="text-status-danger">*</span>
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="input w-full"
              placeholder="npr. WH-001"
              required
            />
            <p className="text-xs text-primary-gray mt-1">Jedinstvena šifra skladišta</p>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Lokacija <span className="text-status-danger">*</span>
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="input w-full"
              placeholder="npr. Hotonj bb, 71320 Vogošća"
              required
            />
          </div>

          {/* Capacity */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Kapacitet (litara) <span className="text-status-danger">*</span>
            </label>
            <input
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              className="input w-full"
              placeholder="npr. 50000"
              min="1"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Opis (opciono)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input w-full"
              rows={3}
              placeholder="Dodatne informacije o skladištu..."
            />
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
              {loading ? 'Kreiranje...' : 'Kreiraj Skladište'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
