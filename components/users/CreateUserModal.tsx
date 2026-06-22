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
  const [stations, setStations] = useState<any[]>([])
  const [stationSearch, setStationSearch] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'OPERATOR',
    warehouseIds: [] as string[],
    stationIds: [] as string[]
  })

  useEffect(() => {
    fetchWarehouses()
    fetchStations()
  }, [])

  const fetchWarehouses = async () => {
    try {
      const response = await fetch('/api/warehouses?pageSize=1000')
      const data = await response.json()
      if (data.success) {
        setWarehouses(data.data.data || data.data)
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error)
    }
  }

  const fetchStations = async () => {
    try {
      const response = await fetch('/api/stations?pageSize=1000')
      const data = await response.json()
      if (data.success) {
        setStations(data.data.data || data.data)
      }
    } catch (error) {
      console.error('Error fetching stations:', error)
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

  const toggleStation = (stationId: string) => {
    setFormData(prev => ({
      ...prev,
      stationIds: prev.stationIds.includes(stationId)
        ? prev.stationIds.filter((id: string) => id !== stationId)
        : [...prev.stationIds, stationId]
    }))
  }

  const toggleAllStations = () => {
    const filteredStations = stations.filter(s =>
      s.name.toLowerCase().includes(stationSearch.toLowerCase()) ||
      s.code.toLowerCase().includes(stationSearch.toLowerCase())
    )
    const allSelected = filteredStations.every(s => formData.stationIds.includes(s.id))

    setFormData(prev => ({
      ...prev,
      stationIds: allSelected
        ? prev.stationIds.filter(id => !filteredStations.find(s => s.id === id))
        : [...new Set([...prev.stationIds, ...filteredStations.map(s => s.id)])]
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

          {/* Stations */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Poslovnice (opciono)
            </label>
            <div className="border border-bg-tertiary rounded-lg p-3">
              {/* Search and Select All */}
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={stationSearch}
                  onChange={(e) => setStationSearch(e.target.value)}
                  placeholder="Pretraži poslovnice..."
                  className="input flex-1"
                />
                <button
                  type="button"
                  onClick={toggleAllStations}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors whitespace-nowrap text-sm"
                >
                  {stations.filter(s =>
                    s.name.toLowerCase().includes(stationSearch.toLowerCase()) ||
                    s.code.toLowerCase().includes(stationSearch.toLowerCase())
                  ).every(s => formData.stationIds.includes(s.id)) ? 'Odznači sve' : 'Odaberi sve'}
                </button>
              </div>

              {/* Stations List */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {stations
                  .filter(station =>
                    station.name.toLowerCase().includes(stationSearch.toLowerCase()) ||
                    station.code.toLowerCase().includes(stationSearch.toLowerCase()) ||
                    station.address.toLowerCase().includes(stationSearch.toLowerCase())
                  )
                  .map(station => (
                    <label key={station.id} className="flex items-center gap-2 cursor-pointer hover:bg-bg-secondary p-2 rounded-lg transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.stationIds.includes(station.id)}
                        onChange={() => toggleStation(station.id)}
                        className="rounded"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{station.code} - {station.name}</div>
                        <div className="text-xs text-primary-gray">{station.address}</div>
                      </div>
                    </label>
                  ))}
                {stations.filter(station =>
                  station.name.toLowerCase().includes(stationSearch.toLowerCase()) ||
                  station.code.toLowerCase().includes(stationSearch.toLowerCase()) ||
                  station.address.toLowerCase().includes(stationSearch.toLowerCase())
                ).length === 0 && (
                  <div className="text-sm text-primary-gray text-center py-4">
                    Nema poslovnica za prikaz
                  </div>
                )}
              </div>

              {/* Selected count */}
              {formData.stationIds.length > 0 && (
                <div className="mt-3 pt-3 border-t border-bg-tertiary text-sm text-primary-gray">
                  Odabrano: {formData.stationIds.length} poslovnica
                </div>
              )}
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
