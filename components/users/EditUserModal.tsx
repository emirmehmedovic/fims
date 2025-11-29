'use client'

import { useState, useEffect } from 'react'
import { X, Key } from 'lucide-react'

interface EditUserModalProps {
  user: any
  onClose: () => void
  onSuccess: () => void
}

export default function EditUserModal({ user, onClose, onSuccess }: EditUserModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const [newPassword, setNewPassword] = useState('')

  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    warehouseIds: user.warehouses.map((w: any) => w.id)
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
    setLoading(true)

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        onSuccess()
      } else {
        setError(data.error || 'Greška pri ažuriranju korisnika')
      }
    } catch (error) {
      setError('Greška pri ažuriranju korisnika')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordReset = async () => {
    if (!newPassword || newPassword.length < 8) {
      setError('Password mora imati najmanje 8 karaktera')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/users/${user.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword })
      })

      const data = await response.json()

      if (data.success) {
        setShowPasswordReset(false)
        setNewPassword('')
        alert('Password uspješno resetovan')
      } else {
        setError(data.error || 'Greška pri resetovanju passworda')
      }
    } catch (error) {
      setError('Greška pri resetovanju passworda')
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
          <h2 className="text-2xl font-bold">Uredi Korisnika</h2>
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

          {/* Status */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm font-medium">Aktivan korisnik</span>
            </label>
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

          {/* Password Reset */}
          <div className="border-t border-bg-tertiary pt-4">
            {!showPasswordReset ? (
              <button
                type="button"
                onClick={() => setShowPasswordReset(true)}
                className="flex items-center gap-2 text-primary-blue hover:text-primary-blue-hover"
              >
                <Key size={18} />
                Resetuj Password
              </button>
            ) : (
              <div className="space-y-3">
                <label className="block text-sm font-medium">
                  Novi Password
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input flex-1"
                    placeholder="Minimalno 8 karaktera"
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={handlePasswordReset}
                    disabled={loading}
                    className="px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-primary-blue-hover"
                  >
                    Resetuj
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordReset(false)
                      setNewPassword('')
                    }}
                    className="px-4 py-2 bg-bg-secondary rounded-lg hover:bg-bg-tertiary"
                  >
                    Otkaži
                  </button>
                </div>
              </div>
            )}
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
              {loading ? 'Čuvanje...' : 'Sačuvaj Izmjene'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
