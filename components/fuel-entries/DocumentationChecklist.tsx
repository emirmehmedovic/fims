'use client'

import {
  FileText,
  Award,
  FileCheck,
  Droplet,
  Eye,
  FlaskConical,
  Truck,
  AlertTriangle,
  Search,
  Scale,
  CheckCircle2,
  Circle
} from 'lucide-react'

export interface WeighingData {
  tara: string
  neto: string
  bruto: string
  specificWeight: string
  tempOnTanker: string
  litersWithCorrection: string
  deliveryNoteWeight: string
  weightDifference: string
}

export interface DocumentationValues {
  hasDeliveryNote: boolean
  hasQualityCertificate: boolean
  hasComplianceDeclaration: boolean
  isWaterMeasured: boolean
  hasWaterInTank: boolean
  isVisualInspectionDone: boolean
  hasAdditives: boolean
  isLastUnload: boolean
  isTankCheckedAfterLastUnload: boolean
  fuelFoundOnLastUnload: string
  hasWeighing: boolean
  weighingData: WeighingData
}

interface Props {
  values: DocumentationValues
  onChange: (values: DocumentationValues) => void
}

// Grouped checklist items - names matching Excel template exactly
const DOCUMENTATION_ITEMS = [
  {
    key: 'hasDeliveryNote' as keyof DocumentationValues,
    label: 'Otpremnica',
    icon: FileText
  },
  {
    key: 'hasQualityCertificate' as keyof DocumentationValues,
    label: 'Certifikat o kvalitetu',
    icon: Award
  },
  {
    key: 'hasComplianceDeclaration' as keyof DocumentationValues,
    label: 'Izjava o usklađenosti',
    icon: FileCheck
  }
]

const INSPECTION_ITEMS = [
  {
    key: 'isWaterMeasured' as keyof DocumentationValues,
    label: 'Voda mjerena u cisterni',
    icon: Droplet
  },
  {
    key: 'isVisualInspectionDone' as keyof DocumentationValues,
    label: 'Vizuelni pregled komore',
    icon: Eye
  },
  {
    key: 'hasAdditives' as keyof DocumentationValues,
    label: 'Aditiviranje',
    icon: FlaskConical
  }
]

const UNLOAD_ITEMS = [
  {
    key: 'isLastUnload' as keyof DocumentationValues,
    label: 'Poslijednji istovar',
    icon: Truck
  },
  {
    key: 'isTankCheckedAfterLastUnload' as keyof DocumentationValues,
    label: 'Provjera cisterne na zadnjem istovaru uočeno gorivo',
    icon: Search
  }
]

export default function DocumentationChecklist({ values, onChange }: Props) {
  const handleToggle = (key: keyof DocumentationValues) => {
    if (key === 'weighingData' || key === 'fuelFoundOnLastUnload') return
    onChange({
      ...values,
      [key]: !values[key]
    })
  }

  const handleWeighingChange = (field: keyof WeighingData, value: string) => {
    const updatedWeighingData = {
      ...values.weighingData,
      [field]: value
    }

    // Auto-calculate Neto = Bruto - Tara
    if (field === 'tara' || field === 'bruto') {
      const tara = parseFloat(field === 'tara' ? value : updatedWeighingData.tara || '0') || 0
      const bruto = parseFloat(field === 'bruto' ? value : updatedWeighingData.bruto || '0') || 0
      if (bruto > 0 && tara >= 0) {
        updatedWeighingData.neto = (bruto - tara).toString()
      }
    }

    onChange({
      ...values,
      weighingData: updatedWeighingData
    })
  }

  const renderCheckItem = (item: { key: keyof DocumentationValues; label: string; icon: any }) => {
    const Icon = item.icon
    const isChecked = values[item.key] === true

    return (
      <button
        key={item.key}
        type="button"
        onClick={() => handleToggle(item.key)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all w-full ${
          isChecked
            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
        }`}
      >
        {isChecked ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
        ) : (
          <Circle className="w-5 h-5 text-slate-300 flex-shrink-0" />
        )}
        <Icon className={`w-4 h-4 flex-shrink-0 ${isChecked ? 'text-emerald-600' : 'text-slate-400'}`} />
        <span className="text-sm font-medium">{item.label}</span>
      </button>
    )
  }

  return (
    <div className="space-y-4">
      {/* Documentation & Inspections - Two Column Layout */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Dokumentacija za preuzimanje od vozača
        </h4>

        <div className="grid grid-cols-2 gap-3">
          {/* Left Column - Documentation */}
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Dokumenti</p>
            {DOCUMENTATION_ITEMS.map(renderCheckItem)}
          </div>

          {/* Right Column - Inspections */}
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Provjere</p>
            {INSPECTION_ITEMS.map(renderCheckItem)}
          </div>
        </div>

        {/* Unload section - full width */}
        <div className="mt-3 pt-3 border-t border-slate-200">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Istovar</p>
          <div className="grid grid-cols-2 gap-2">
            {UNLOAD_ITEMS.map(renderCheckItem)}
          </div>
        </div>

        {/* Water Warning - Special case */}
        <div className="mt-3 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={() => handleToggle('hasWaterInTank')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all w-full ${
              values.hasWaterInTank
                ? 'bg-red-100 border-red-400 text-red-800 ring-2 ring-red-300'
                : 'bg-white border-slate-200 text-slate-600 hover:border-red-200 hover:bg-red-50'
            }`}
          >
            {values.hasWaterInTank ? (
              <CheckCircle2 className="w-5 h-5 text-red-600 flex-shrink-0" />
            ) : (
              <Circle className="w-5 h-5 text-slate-300 flex-shrink-0" />
            )}
            <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${values.hasWaterInTank ? 'text-red-600' : 'text-slate-400'}`} />
            <span className="text-sm font-medium">
              {values.hasWaterInTank ? '⚠️ Voda u cisterni - OBUSTAVA istakanja!' : 'Voda u cisterni'}
            </span>
          </button>
        </div>
      </div>

      {/* Fuel found on last unload */}
      {values.isTankCheckedAfterLastUnload && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <label className="block">
            <span className="text-sm font-medium text-amber-800">
              Istočena količina uočenog goriva na zadnjem istovaru (L)
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={values.fuelFoundOnLastUnload || ''}
              onChange={(e) => onChange({ ...values, fuelFoundOnLastUnload: e.target.value })}
              className="input w-full mt-2"
              placeholder="0"
            />
          </label>
        </div>
      )}

      {/* Weighing Section */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => onChange({ ...values, hasWeighing: !values.hasWeighing })}
          className={`flex items-center gap-3 p-4 w-full text-left transition-colors ${
            values.hasWeighing ? 'bg-indigo-50' : 'bg-slate-50 hover:bg-slate-100'
          }`}
        >
          {values.hasWeighing ? (
            <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0" />
          ) : (
            <Circle className="w-5 h-5 text-slate-300 flex-shrink-0" />
          )}
          <Scale className={`w-5 h-5 ${values.hasWeighing ? 'text-indigo-600' : 'text-slate-500'}`} />
          <div>
            <span className={`text-sm font-medium ${values.hasWeighing ? 'text-indigo-700' : 'text-slate-700'}`}>
              Ako je u blizini vaga - vaga se cisterna
            </span>
          </div>
        </button>

        {values.hasWeighing && (
          <div className="p-4 bg-white border-t border-slate-200">
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1">Tara</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={values.weighingData?.tara || ''}
                  onChange={(e) => handleWeighingChange('tara', e.target.value)}
                  className="input w-full text-sm"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Bruto</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={values.weighingData?.bruto || ''}
                  onChange={(e) => handleWeighingChange('bruto', e.target.value)}
                  className="input w-full text-sm"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Neto</label>
                <input
                  type="text"
                  value={values.weighingData?.neto || ''}
                  readOnly
                  className="input w-full text-sm bg-green-50 font-semibold text-green-700"
                  placeholder="Auto"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Specifična težina</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={values.weighingData?.specificWeight || ''}
                  onChange={(e) => handleWeighingChange('specificWeight', e.target.value)}
                  className="input w-full text-sm"
                  placeholder="0.850"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3 mt-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1">Temp na cisterni</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={values.weighingData?.tempOnTanker || ''}
                  onChange={(e) => handleWeighingChange('tempOnTanker', e.target.value)}
                  className="input w-full text-sm"
                  placeholder="15"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Litara sa korekcijom</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={values.weighingData?.litersWithCorrection || ''}
                  onChange={(e) => handleWeighingChange('litersWithCorrection', e.target.value)}
                  className="input w-full text-sm"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Otpremnica</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={values.weighingData?.deliveryNoteWeight || ''}
                  onChange={(e) => handleWeighingChange('deliveryNoteWeight', e.target.value)}
                  className="input w-full text-sm"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Razlika</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={values.weighingData?.weightDifference || ''}
                  onChange={(e) => handleWeighingChange('weightDifference', e.target.value)}
                  className="input w-full text-sm bg-slate-50"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
