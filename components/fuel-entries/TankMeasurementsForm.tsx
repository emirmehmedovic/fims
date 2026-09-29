'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Thermometer, Droplets, Ruler, ChevronDown, Truck } from 'lucide-react'

export interface TankMeasurement {
  tankNumber: string // R1-R10
  // Sonda i Letva na 15°C (direktan unos)
  initialSonde15: string
  finalSonde15: string
  initialLetva15: string
  finalLetva15: string
  // Temperatura (default 15°C)
  initialTemp: string
  finalTemp: string
  // Faktor korekcije (koristi se samo ako temp ≠ 15)
  initialFactor: string
  finalFactor: string
  // Sirove vrijednosti (koristi se samo ako temp ≠ 15)
  initialSondeRaw: string
  finalSondeRaw: string
  initialLetvaRaw: string
  finalLetvaRaw: string
}

interface Props {
  measurements: TankMeasurement[]
  onChange: (measurements: TankMeasurement[]) => void
  productName: string
  tankerRegistration: string
  onTankerRegistrationChange: (value: string) => void
}

const TANK_OPTIONS = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'R9', 'R10']

export const emptyMeasurement: TankMeasurement = {
  tankNumber: 'R1',
  initialSonde15: '',
  finalSonde15: '',
  initialLetva15: '',
  finalLetva15: '',
  initialTemp: '15',
  finalTemp: '15',
  initialFactor: '1',
  finalFactor: '1',
  initialSondeRaw: '',
  finalSondeRaw: '',
  initialLetvaRaw: '',
  finalLetvaRaw: ''
}

// Calculate liters at 15°C from raw value and factor
function calculateLiters15(rawValue: string, factor: string): string {
  const val = parseFloat(rawValue)
  const factorValue = parseFloat(factor)

  if (isNaN(val) || isNaN(factorValue) || factorValue === 0) {
    return ''
  }

  const result = Math.round(val * factorValue)
  return result.toString()
}

export default function TankMeasurementsForm({
  measurements,
  onChange,
  productName,
  tankerRegistration,
  onTankerRegistrationChange
}: Props) {
  const [loadingFactors, setLoadingFactors] = useState<Record<string, boolean>>({})
  const [availableTemperatures, setAvailableTemperatures] = useState<number[]>([])
  const [loadingTemperatures, setLoadingTemperatures] = useState(false)

  // Use ref to always have latest measurements for async operations
  const measurementsRef = useRef(measurements)
  useEffect(() => {
    measurementsRef.current = measurements
  }, [measurements])

  // Single measurement - always use index 0
  const measurement = measurements[0] || emptyMeasurement

  // Check if we need to show conversion fields
  const showInitialConversion = measurement.initialTemp !== '15' && measurement.initialTemp !== ''
  const showFinalConversion = measurement.finalTemp !== '15' && measurement.finalTemp !== ''

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

  const updateMeasurement = useCallback((field: keyof TankMeasurement, value: string) => {
    const updated = { ...measurement, [field]: value }

    // Auto-calculate 15°C values when raw values or factors change
    if (field === 'initialSondeRaw' || field === 'initialFactor') {
      const raw = field === 'initialSondeRaw' ? value : updated.initialSondeRaw
      const factor = field === 'initialFactor' ? value : updated.initialFactor
      updated.initialSonde15 = calculateLiters15(raw, factor)
    }
    if (field === 'finalSondeRaw' || field === 'finalFactor') {
      const raw = field === 'finalSondeRaw' ? value : updated.finalSondeRaw
      const factor = field === 'finalFactor' ? value : updated.finalFactor
      updated.finalSonde15 = calculateLiters15(raw, factor)
    }
    if (field === 'initialLetvaRaw' || field === 'initialFactor') {
      const raw = field === 'initialLetvaRaw' ? value : updated.initialLetvaRaw
      const factor = field === 'initialFactor' ? value : updated.initialFactor
      updated.initialLetva15 = calculateLiters15(raw, factor)
    }
    if (field === 'finalLetvaRaw' || field === 'finalFactor') {
      const raw = field === 'finalLetvaRaw' ? value : updated.finalLetvaRaw
      const factor = field === 'finalFactor' ? value : updated.finalFactor
      updated.finalLetva15 = calculateLiters15(raw, factor)
    }

    // If temp changes to 15, reset factor to 1 and clear raw values
    if (field === 'initialTemp' && value === '15') {
      updated.initialFactor = '1'
      updated.initialSondeRaw = ''
      updated.initialLetvaRaw = ''
    }
    if (field === 'finalTemp' && value === '15') {
      updated.finalFactor = '1'
      updated.finalSondeRaw = ''
      updated.finalLetvaRaw = ''
    }

    onChange([updated])
  }, [measurement, onChange])

  // Auto-lookup correction factor when temperature changes
  const lookupFactor = useCallback(async (
    productName: string,
    temperature: string,
    type: 'initial' | 'final'
  ) => {
    if (!productName || !temperature || temperature === '15') return

    const tempValue = parseFloat(temperature)
    if (isNaN(tempValue)) return

    const key = `0-${type}`
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
        updateMeasurement(field, factor)
      }
    } catch (error) {
      console.error('Error looking up correction factor:', error)
    } finally {
      setLoadingFactors(prev => ({ ...prev, [key]: false }))
    }
  }, [updateMeasurement])

  // Handle temperature change and trigger factor lookup
  const handleTempChange = (type: 'initial' | 'final', value: string) => {
    updateMeasurement(type === 'initial' ? 'initialTemp' : 'finalTemp', value)

    // Lookup factor when temperature is selected (but not for 15°C)
    if (value && value !== '15') {
      lookupFactor(productName, value, type)
    }
  }

  return (
    <div className="space-y-4">
      {/* Tanker Registration */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <div className="flex items-center gap-3 mb-3">
          <Truck className="w-5 h-5 text-indigo-600" />
          <label className="text-sm font-bold text-slate-700">Registarska oznaka cisterne</label>
        </div>
        <input
          type="text"
          value={tankerRegistration}
          onChange={(e) => onTankerRegistrationChange(e.target.value.toUpperCase())}
          className="input w-full text-sm uppercase"
          placeholder="npr. A12-B-345"
        />
      </div>

      {/* Tank Measurement - Single Tank */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <div className="flex items-center gap-3 mb-4">
          <select
            value={measurement.tankNumber}
            onChange={(e) => updateMeasurement('tankNumber', e.target.value)}
            className="input w-24 font-semibold text-indigo-700 bg-white"
          >
            {TANK_OPTIONS.map(tank => (
              <option key={tank} value={tank}>{tank}</option>
            ))}
          </select>
          <span className="text-sm text-slate-500">Rezervoar</span>
        </div>

        {/* POČETNO STANJE */}
        <div className="mb-4">
          <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            Početno stanje
          </h4>

          <div className="space-y-3">
            {/* Main row - 15°C values */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  <Droplets className="w-3 h-3 inline mr-1" />
                  Sonda (L na 15°C)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={measurement.initialSonde15}
                  onChange={(e) => updateMeasurement('initialSonde15', e.target.value)}
                  className="input w-full text-sm bg-green-50 font-semibold text-green-700"
                  placeholder="0"
                  disabled={showInitialConversion}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  <Ruler className="w-3 h-3 inline mr-1" />
                  Letva (L na 15°C)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={measurement.initialLetva15}
                  onChange={(e) => updateMeasurement('initialLetva15', e.target.value)}
                  className="input w-full text-sm bg-green-50 font-semibold text-green-700"
                  placeholder="0"
                  disabled={showInitialConversion}
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
                    onChange={(e) => handleTempChange('initial', e.target.value)}
                    className="input w-full text-sm appearance-none pr-8"
                  >
                    <option value="15">15°C (default)</option>
                    {availableTemperatures
                      .filter(t => t !== 15)
                      .map(temp => (
                        <option key={temp} value={temp}>{temp}°C</option>
                      ))
                    }
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Conversion fields - only show if temp ≠ 15 */}
            {showInitialConversion && (
              <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                <p className="text-xs text-amber-700 mb-2 font-medium">Preračunavanje na 15°C:</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Sonda sirovo (L)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={measurement.initialSondeRaw}
                      onChange={(e) => updateMeasurement('initialSondeRaw', e.target.value)}
                      className="input w-full text-sm"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Letva sirovo (L)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={measurement.initialLetvaRaw}
                      onChange={(e) => updateMeasurement('initialLetvaRaw', e.target.value)}
                      className="input w-full text-sm"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      Faktor
                      {loadingFactors['0-initial'] && (
                        <span className="ml-1 inline-block w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></span>
                      )}
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={measurement.initialFactor}
                      onChange={(e) => updateMeasurement('initialFactor', e.target.value)}
                      className="input w-full text-sm"
                      placeholder="1.0000"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ZAVRŠNO STANJE */}
        <div>
          <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            Završno stanje
          </h4>

          <div className="space-y-3">
            {/* Main row - 15°C values */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  <Droplets className="w-3 h-3 inline mr-1" />
                  Sonda (L na 15°C)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={measurement.finalSonde15}
                  onChange={(e) => updateMeasurement('finalSonde15', e.target.value)}
                  className="input w-full text-sm bg-green-50 font-semibold text-green-700"
                  placeholder="0"
                  disabled={showFinalConversion}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  <Ruler className="w-3 h-3 inline mr-1" />
                  Letva (L na 15°C)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={measurement.finalLetva15}
                  onChange={(e) => updateMeasurement('finalLetva15', e.target.value)}
                  className="input w-full text-sm bg-green-50 font-semibold text-green-700"
                  placeholder="0"
                  disabled={showFinalConversion}
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
                    onChange={(e) => handleTempChange('final', e.target.value)}
                    className="input w-full text-sm appearance-none pr-8"
                  >
                    <option value="15">15°C (default)</option>
                    {availableTemperatures
                      .filter(t => t !== 15)
                      .map(temp => (
                        <option key={temp} value={temp}>{temp}°C</option>
                      ))
                    }
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Conversion fields - only show if temp ≠ 15 */}
            {showFinalConversion && (
              <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                <p className="text-xs text-amber-700 mb-2 font-medium">Preračunavanje na 15°C:</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Sonda sirovo (L)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={measurement.finalSondeRaw}
                      onChange={(e) => updateMeasurement('finalSondeRaw', e.target.value)}
                      className="input w-full text-sm"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Letva sirovo (L)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={measurement.finalLetvaRaw}
                      onChange={(e) => updateMeasurement('finalLetvaRaw', e.target.value)}
                      className="input w-full text-sm"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      Faktor
                      {loadingFactors['0-final'] && (
                        <span className="ml-1 inline-block w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></span>
                      )}
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={measurement.finalFactor}
                      onChange={(e) => updateMeasurement('finalFactor', e.target.value)}
                      className="input w-full text-sm"
                      placeholder="1.0000"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Per-tank summary */}
        {(measurement.initialSonde15 && measurement.finalSonde15) ||
         (measurement.initialLetva15 && measurement.finalLetva15) ? (
          <div className="mt-3 pt-3 border-t border-slate-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              {measurement.initialSonde15 && measurement.finalSonde15 && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Istočeno (sonda):</span>
                  <span className="font-bold text-indigo-700">
                    {(parseInt(measurement.finalSonde15) - parseInt(measurement.initialSonde15)).toLocaleString()} L
                  </span>
                </div>
              )}
              {measurement.initialLetva15 && measurement.finalLetva15 && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Istočeno (letva):</span>
                  <span className="font-bold text-emerald-700">
                    {(parseInt(measurement.finalLetva15) - parseInt(measurement.initialLetva15)).toLocaleString()} L
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
