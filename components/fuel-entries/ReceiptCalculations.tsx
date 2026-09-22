'use client'

import { useMemo } from 'react'
import { Calculator, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react'
import { TankMeasurement } from './TankMeasurementsForm'

interface Props {
  measurements: TankMeasurement[]
  announcedQuantity: string
  meterReading: string
  deliveryNoteQuantity: string
  onAnnouncedQuantityChange: (value: string) => void
  onMeterReadingChange: (value: string) => void
  onDeliveryNoteQuantityChange: (value: string) => void
}

// Warning thresholds for differences
const DIFFERENCE_WARNING_PERCENT = 1 // 1%
const DIFFERENCE_ERROR_PERCENT = 2 // 2%

export default function ReceiptCalculations({
  measurements,
  announcedQuantity,
  meterReading,
  deliveryNoteQuantity,
  onAnnouncedQuantityChange,
  onMeterReadingChange,
  onDeliveryNoteQuantityChange
}: Props) {
  // Calculate total discharged quantity for Sonda
  const dischargedSonda = useMemo(() => {
    let total = 0
    for (const m of measurements) {
      const initial = parseInt(m.initialLiters15Sonde) || 0
      const final = parseInt(m.finalLiters15Sonde) || 0
      total += final - initial
    }
    return total
  }, [measurements])

  // Calculate total discharged quantity for Letva
  const dischargedLetva = useMemo(() => {
    let total = 0
    for (const m of measurements) {
      const initial = parseInt(m.initialLiters15Letva) || 0
      const final = parseInt(m.finalLiters15Letva) || 0
      total += final - initial
    }
    return total
  }, [measurements])

  // Parse input values
  const announced = parseInt(announcedQuantity) || 0
  const meter = parseInt(meterReading) || 0
  const deliveryNote = parseInt(deliveryNoteQuantity) || 0

  // RAZLIKE = Najavljena - Istočena (za Letva na 15°C kao primarni pokazatelj)
  const differenceFromAnnouncedSonda = announced - dischargedSonda
  const differenceFromAnnouncedLetva = announced - dischargedLetva

  // KONAČNI MANJAK/VIŠAK = ISTOVARENO (OTPREMNICA) - Količina istočenog goriva
  const finalDifferenceSonda = deliveryNote - dischargedSonda
  const finalDifferenceLetva = deliveryNote - dischargedLetva

  // Determine if differences are within acceptable range
  const getDifferenceStatus = (difference: number, baseQuantity: number) => {
    if (baseQuantity === 0) return 'neutral'
    const percentDiff = Math.abs(difference / baseQuantity) * 100

    if (percentDiff <= DIFFERENCE_WARNING_PERCENT) return 'ok'
    if (percentDiff <= DIFFERENCE_ERROR_PERCENT) return 'warning'
    return 'error'
  }

  const finalStatusLetva = getDifferenceStatus(finalDifferenceLetva, deliveryNote)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok': return 'text-green-600 bg-green-50 border-green-200'
      case 'warning': return 'text-amber-600 bg-amber-50 border-amber-200'
      case 'error': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-slate-600 bg-slate-50 border-slate-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok': return <CheckCircle className="w-4 h-4" />
      case 'warning': return <AlertTriangle className="w-4 h-4" />
      case 'error': return <AlertTriangle className="w-4 h-4" />
      default: return <Calculator className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-4">
      {/* Input fields */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Najavljena količina (L)
          </label>
          <input
            type="number"
            value={announcedQuantity}
            onChange={(e) => onAnnouncedQuantityChange(e.target.value)}
            className="input w-full"
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Brojčanik cisterne (L)
          </label>
          <input
            type="number"
            value={meterReading}
            onChange={(e) => onMeterReadingChange(e.target.value)}
            className="input w-full"
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Otpremnica (L)
          </label>
          <input
            type="number"
            value={deliveryNoteQuantity}
            onChange={(e) => onDeliveryNoteQuantityChange(e.target.value)}
            className="input w-full"
            placeholder="0"
          />
        </div>
      </div>

      {/* Calculations summary */}
      <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
        <h4 className="text-sm font-bold text-indigo-800 mb-3 flex items-center gap-2">
          <Calculator className="w-4 h-4" />
          Izračuni
        </h4>

        <div className="space-y-3">
          {/* Discharged quantity - dual columns */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-3 border border-indigo-100">
              <div className="text-xs text-indigo-600 mb-1">Istočeno po SONDA (na 15°C)</div>
              <div className="font-bold text-lg text-indigo-900">
                {dischargedSonda.toLocaleString()} L
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-indigo-100">
              <div className="text-xs text-indigo-600 mb-1">Istočeno po LETVA (na 15°C)</div>
              <div className="font-bold text-lg text-indigo-900">
                {dischargedLetva.toLocaleString()} L
              </div>
            </div>
          </div>

          {/* Differences from announced */}
          {announced > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-indigo-100">
                <span className="text-xs text-slate-600">Razlika (sonda):</span>
                <span className={`font-semibold ${differenceFromAnnouncedSonda === 0 ? 'text-green-600' : differenceFromAnnouncedSonda > 0 ? 'text-amber-600' : 'text-red-600'}`}>
                  {differenceFromAnnouncedSonda > 0 ? '+' : ''}{differenceFromAnnouncedSonda.toLocaleString()} L
                </span>
              </div>
              <div className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-indigo-100">
                <span className="text-xs text-slate-600">Razlika (letva):</span>
                <span className={`font-semibold ${differenceFromAnnouncedLetva === 0 ? 'text-green-600' : differenceFromAnnouncedLetva > 0 ? 'text-amber-600' : 'text-red-600'}`}>
                  {differenceFromAnnouncedLetva > 0 ? '+' : ''}{differenceFromAnnouncedLetva.toLocaleString()} L
                </span>
              </div>
            </div>
          )}

          {/* Meter reading */}
          {meter > 0 && (
            <div className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-indigo-100">
              <span className="text-sm text-indigo-700">Istočeno po brojčanicima:</span>
              <span className="font-semibold text-indigo-900">{meter.toLocaleString()} L</span>
            </div>
          )}

          {/* Final difference (KONAČNI MANJAK/VIŠAK) */}
          {deliveryNote > 0 && (
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-indigo-200">
              <div className={`flex items-center justify-between py-3 px-3 rounded-lg border ${getStatusColor(getDifferenceStatus(finalDifferenceSonda, deliveryNote))}`}>
                <div className="flex items-center gap-2">
                  {getStatusIcon(getDifferenceStatus(finalDifferenceSonda, deliveryNote))}
                  <span className="text-xs font-semibold">{finalDifferenceSonda >= 0 ? 'VIŠAK' : 'MANJAK'} (sonda):</span>
                </div>
                <span className="font-bold">
                  {Math.abs(finalDifferenceSonda).toLocaleString()} L
                </span>
              </div>
              <div className={`flex items-center justify-between py-3 px-3 rounded-lg border ${getStatusColor(finalStatusLetva)}`}>
                <div className="flex items-center gap-2">
                  {getStatusIcon(finalStatusLetva)}
                  <span className="text-xs font-semibold">{finalDifferenceLetva >= 0 ? 'VIŠAK' : 'MANJAK'} (letva):</span>
                </div>
                <span className="font-bold">
                  {Math.abs(finalDifferenceLetva).toLocaleString()} L
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Warning message */}
        {(finalStatusLetva === 'warning' || finalStatusLetva === 'error') && (
          <div className="mt-3 p-3 bg-amber-100 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold">Upozorenje: Značajna razlika u količinama</p>
                <p className="mt-1">
                  Razlika veća od {finalStatusLetva === 'error' ? DIFFERENCE_ERROR_PERCENT : DIFFERENCE_WARNING_PERCENT}%
                  može ukazivati na problem s mjerenjem ili gubitak goriva.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
