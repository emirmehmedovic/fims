'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Plus, Trash2, Thermometer, Droplets, Calculator, Ruler, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'

export interface TankMeasurement {
  tankNumber: string // R1-R10
  // Sonda (električna)
  initialSonde: string
  finalSonde: string
  // Letva (ručno mjerenje)
  initialLetva: string
  finalLetva: string
  // Temperatura i faktor
  initialTemp: string
  finalTemp: string
  initialFactor: string
  finalFactor: string
  // Izračunato na 15°C
  initialLiters15Sonde: string
  finalLiters15Sonde: string
  initialLiters15Letva: string
  finalLiters15Letva: string
}

interface Props {
  measurements: TankMeasurement[]
  onChange: (measurements: TankMeasurement[]) => void
  productName: string
}

const TANK_OPTIONS = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'R9', 'R10']

const emptyMeasurement: TankMeasurement = {
  tankNumber: '',
  initialSonde: '',
  finalSonde: '',
  initialLetva: '',
  finalLetva: '',
  initialTemp: '',
  finalTemp: '',
  initialFactor: '',
  finalFactor: '',
  initialLiters15Sonde: '',
  finalLiters15Sonde: '',
  initialLiters15Letva: '',
  finalLiters15Letva: ''
}

// Calculate liters at 15°C (pure function, no dependencies)
function calculateLiters15(value: string, factor: string): string {
  const val = parseFloat(value)
  const factorValue = parseFloat(factor)

  if (isNaN(val) || isNaN(factorValue) || factorValue === 0) {
    return ''
  }

  const result = Math.round(val * factorValue)
  return result.toString()
}

// Helper function to apply calculations when factor changes (pure function, no dependencies)
function applyFactorCalculations(m: TankMeasurement, field: keyof TankMeasurement, value: string): TankMeasurement {
  const updated = { ...m, [field]: value }

  // Auto-calculate liters at 15°C for Sonda
  if (field === 'initialSonde' || field === 'initialFactor') {
    const sonde = field === 'initialSonde' ? value : updated.initialSonde
    const factor = field === 'initialFactor' ? value : updated.initialFactor
    updated.initialLiters15Sonde = calculateLiters15(sonde, factor)
  }
  if (field === 'finalSonde' || field === 'finalFactor') {
    const sonde = field === 'finalSonde' ? value : updated.finalSonde
    const factor = field === 'finalFactor' ? value : updated.finalFactor
    updated.finalLiters15Sonde = calculateLiters15(sonde, factor)
  }

  // Auto-calculate liters at 15°C for Letva
  if (field === 'initialLetva' || field === 'initialFactor') {
    const letva = field === 'initialLetva' ? value : updated.initialLetva
    const factor = field === 'initialFactor' ? value : updated.initialFactor
    updated.initialLiters15Letva = calculateLiters15(letva, factor)
  }
  if (field === 'finalLetva' || field === 'finalFactor') {
    const letva = field === 'finalLetva' ? value : updated.finalLetva
    const factor = field === 'finalFactor' ? value : updated.finalFactor
    updated.finalLiters15Letva = calculateLiters15(letva, factor)
  }

  return updated
}

export default function TankMeasurementsForm({ measurements, onChange, productName }: Props) {
  const [loadingFactors, setLoadingFactors] = useState<Record<string, boolean>>({})
  const [availableTemperatures, setAvailableTemperatures] = useState<number[]>([])
  const [loadingTemperatures, setLoadingTemperatures] = useState(false)

  // Use ref to always have latest measurements for async operations
  const measurementsRef = useRef(measurements)
  useEffect(() => {
    measurementsRef.current = measurements
  }, [measurements])

  // Fetch available temperatures when productName changes
  useEffect(() => {
    const fetchTemperatures = async () => {
      if (!productName) {
        setAvailableTemperatures([])
        return
      }

      setLoadingTemperatures(true)
      try {
        const res = await fetch(`/api/correction-factors/temperatures?productName=${encodeURIComponent(productName)}`)
        if (!res.ok) {
          console.error('Failed to fetch temperatures:', res.status)
          setAvailableTemperatures([])
          return
        }
        const data = await res.json()
        if (data.success && data.data.temperatures) {
          setAvailableTemperatures(data.data.temperatures)
        } else {
          setAvailableTemperatures([])
        }
      } catch (error) {
        console.error('Error fetching temperatures:', error)
        setAvailableTemperatures([])
      } finally {
        setLoadingTemperatures(false)
      }
    }

    fetchTemperatures()
  }, [productName])

  const updateMeasurement = useCallback((index: number, field: keyof TankMeasurement, value: string) => {
    const newMeasurements = [...measurements]
    newMeasurements[index] = applyFactorCalculations(newMeasurements[index], field, value)
    onChange(newMeasurements)
  }, [measurements, onChange])

  // Auto-lookup correction factor when temperature changes
  const lookupFactor = useCallback(async (
    productName: string,
    temperature: string,
    measurementIndex: number,
    type: 'initial' | 'final'
  ) => {
    if (!productName || !temperature) return

    const tempValue = parseFloat(temperature)
    if (isNaN(tempValue)) return

    const key = `${measurementIndex}-${type}`
    setLoadingFactors(prev => ({ ...prev, [key]: true }))

    try {
      const res = await fetch(
        `/api/correction-factors/lookup?productName=${encodeURIComponent(productName)}&temperature=${tempValue}`
      )
      if (!res.ok) {
        console.error('Failed to lookup correction factor:', res.status)
        return
      }
      const data = await res.json()

      if (data.success && data.data.factor !== undefined) {
        const factor = data.data.factor.toString()
        const field = type === 'initial' ? 'initialFactor' : 'finalFactor'

        // Use ref to get latest measurements to avoid stale closure
        const currentMeasurements = [...measurementsRef.current]
        currentMeasurements[measurementIndex] = applyFactorCalculations(
          currentMeasurements[measurementIndex],
          field,
          factor
        )
        onChange(currentMeasurements)
      }
    } catch (error) {
      console.error('Error looking up correction factor:', error)
    } finally {
      setLoadingFactors(prev => ({ ...prev, [key]: false }))
    }
  }, [onChange])

  // Handle temperature change and trigger factor lookup
  const handleTempChange = (index: number, type: 'initial' | 'final', value: string) => {
    updateMeasurement(index, type === 'initial' ? 'initialTemp' : 'finalTemp', value)

    // Immediately lookup factor when temperature is selected from dropdown
    if (value) {
      lookupFactor(productName, value, index, type)
    }
  }

  const addMeasurement = () => {
    if (measurements.length >= 10) {
      toast.error('Maksimalno 10 rezervoara')
      return
    }

    const usedTanks = measurements.map(m => m.tankNumber)
    const availableTank = TANK_OPTIONS.find(t => !usedTanks.includes(t)) || ''

    onChange([...measurements, { ...emptyMeasurement, tankNumber: availableTank }])
  }

  const removeMeasurement = (index: number) => {
    if (measurements.length <= 1) {
      toast.error('Mora postojati barem jedno mjerenje')
      return
    }
    onChange(measurements.filter((_, i) => i !== index))
  }

  const usedTanks = measurements.map(m => m.tankNumber)

  return (
    <div className="space-y-4">
      {measurements.map((measurement, index) => (
        <div key={index} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <select
                value={measurement.tankNumber}
                onChange={(e) => updateMeasurement(index, 'tankNumber', e.target.value)}
                className="input w-24 font-semibold text-indigo-700 bg-white"
              >
                <option value="">Odaberi</option>
                {TANK_OPTIONS.map(tank => (
                  <option
                    key={tank}
                    value={tank}
                    disabled={usedTanks.includes(tank) && measurement.tankNumber !== tank}
                  >
                    {tank}
                  </option>
                ))}
              </select>
              <span className="text-sm text-slate-500">Rezervoar</span>
            </div>
            {measurements.length > 1 && (
              <button
                type="button"
                onClick={() => removeMeasurement(index)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Ukloni rezervoar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* POČETNO STANJE */}
          <div className="mb-4">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Početno stanje
            </h4>

            <div className="grid grid-cols-6 gap-2">
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  <Droplets className="w-3 h-3 inline mr-1" />
                  Sonda (L)
                </label>
                <input
                  type="number"
                  value={measurement.initialSonde}
                  onChange={(e) => updateMeasurement(index, 'initialSonde', e.target.value)}
                  className="input w-full text-sm"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  <Ruler className="w-3 h-3 inline mr-1" />
                  Letva (L)
                </label>
                <input
                  type="number"
                  value={measurement.initialLetva}
                  onChange={(e) => updateMeasurement(index, 'initialLetva', e.target.value)}
                  className="input w-full text-sm"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  <Thermometer className="w-3 h-3 inline mr-1" />
                  Temp (°C)
                  {loadingTemperatures && (
                    <span className="ml-1 inline-block w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></span>
                  )}
                </label>
                <div className="relative">
                  <select
                    value={measurement.initialTemp}
                    onChange={(e) => handleTempChange(index, 'initial', e.target.value)}
                    className="input w-full text-sm appearance-none pr-8"
                    disabled={availableTemperatures.length === 0}
                  >
                    <option value="">Odaberi</option>
                    {availableTemperatures.map(temp => (
                      <option key={temp} value={temp}>
                        {temp}°C
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  Faktor
                  {loadingFactors[`${index}-initial`] && (
                    <span className="ml-1 inline-block w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></span>
                  )}
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={measurement.initialFactor}
                  onChange={(e) => updateMeasurement(index, 'initialFactor', e.target.value)}
                  className="input w-full text-sm bg-amber-50"
                  placeholder="1.0000"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  <Calculator className="w-3 h-3 inline mr-1" />
                  Sonda 15°C
                </label>
                <input
                  type="number"
                  value={measurement.initialLiters15Sonde}
                  readOnly
                  className="input w-full text-sm bg-green-50 font-semibold text-green-700"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  <Calculator className="w-3 h-3 inline mr-1" />
                  Letva 15°C
                </label>
                <input
                  type="number"
                  value={measurement.initialLiters15Letva}
                  readOnly
                  className="input w-full text-sm bg-green-50 font-semibold text-green-700"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* ZAVRŠNO STANJE */}
          <div>
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              Završno stanje
            </h4>

            <div className="grid grid-cols-6 gap-2">
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  <Droplets className="w-3 h-3 inline mr-1" />
                  Sonda (L)
                </label>
                <input
                  type="number"
                  value={measurement.finalSonde}
                  onChange={(e) => updateMeasurement(index, 'finalSonde', e.target.value)}
                  className="input w-full text-sm"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  <Ruler className="w-3 h-3 inline mr-1" />
                  Letva (L)
                </label>
                <input
                  type="number"
                  value={measurement.finalLetva}
                  onChange={(e) => updateMeasurement(index, 'finalLetva', e.target.value)}
                  className="input w-full text-sm"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  <Thermometer className="w-3 h-3 inline mr-1" />
                  Temp (°C)
                </label>
                <div className="relative">
                  <select
                    value={measurement.finalTemp}
                    onChange={(e) => handleTempChange(index, 'final', e.target.value)}
                    className="input w-full text-sm appearance-none pr-8"
                    disabled={availableTemperatures.length === 0}
                  >
                    <option value="">Odaberi</option>
                    {availableTemperatures.map(temp => (
                      <option key={temp} value={temp}>
                        {temp}°C
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  Faktor
                  {loadingFactors[`${index}-final`] && (
                    <span className="ml-1 inline-block w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></span>
                  )}
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={measurement.finalFactor}
                  onChange={(e) => updateMeasurement(index, 'finalFactor', e.target.value)}
                  className="input w-full text-sm bg-amber-50"
                  placeholder="1.0000"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  <Calculator className="w-3 h-3 inline mr-1" />
                  Sonda 15°C
                </label>
                <input
                  type="number"
                  value={measurement.finalLiters15Sonde}
                  readOnly
                  className="input w-full text-sm bg-green-50 font-semibold text-green-700"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  <Calculator className="w-3 h-3 inline mr-1" />
                  Letva 15°C
                </label>
                <input
                  type="number"
                  value={measurement.finalLiters15Letva}
                  readOnly
                  className="input w-full text-sm bg-green-50 font-semibold text-green-700"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Per-tank summary */}
          {(measurement.initialLiters15Sonde && measurement.finalLiters15Sonde) ||
           (measurement.initialLiters15Letva && measurement.finalLiters15Letva) ? (
            <div className="mt-3 pt-3 border-t border-slate-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                {measurement.initialLiters15Sonde && measurement.finalLiters15Sonde && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Istočeno (sonda):</span>
                    <span className="font-bold text-indigo-700">
                      {(parseInt(measurement.finalLiters15Sonde) - parseInt(measurement.initialLiters15Sonde)).toLocaleString()} L
                    </span>
                  </div>
                )}
                {measurement.initialLiters15Letva && measurement.finalLiters15Letva && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Istočeno (letva):</span>
                    <span className="font-bold text-emerald-700">
                      {(parseInt(measurement.finalLiters15Letva) - parseInt(measurement.initialLiters15Letva)).toLocaleString()} L
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      ))}

      {measurements.length < 10 && (
        <button
          type="button"
          onClick={addMeasurement}
          className="w-full py-3 px-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Dodaj rezervoar
        </button>
      )}
    </div>
  )
}
