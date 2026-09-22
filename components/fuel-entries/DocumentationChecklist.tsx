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
  Scale
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
  fuelFoundOnLastUnload: string // Količina goriva uočenog na zadnjem istovaru
  // Weighing data (optional)
  hasWeighing: boolean
  weighingData: WeighingData
}

interface Props {
  values: DocumentationValues
  onChange: (values: DocumentationValues) => void
}

const CHECKLIST_ITEMS = [
  {
    key: 'hasDeliveryNote' as keyof DocumentationValues,
    label: 'Otpremnica',
    icon: FileText,
    description: 'Primljena otpremnica s podacima o dostavi'
  },
  {
    key: 'hasQualityCertificate' as keyof DocumentationValues,
    label: 'Certifikat o kvalitetu',
    icon: Award,
    description: 'Laboratorijski certifikat o kvalitetu goriva'
  },
  {
    key: 'hasComplianceDeclaration' as keyof DocumentationValues,
    label: 'Izjava o usklađenosti',
    icon: FileCheck,
    description: 'Izjava dobavljača o usklađenosti sa standardima'
  },
  {
    key: 'isWaterMeasured' as keyof DocumentationValues,
    label: 'Voda mjerena u cisterni',
    icon: Droplet,
    description: 'Izvršeno mjerenje prisustva vode'
  },
  {
    key: 'hasWaterInTank' as keyof DocumentationValues,
    label: 'Voda u cisterni',
    icon: AlertTriangle,
    description: 'Utvrđeno prisustvo vode - OBUSTAVA istakanja!',
    warning: true
  },
  {
    key: 'isVisualInspectionDone' as keyof DocumentationValues,
    label: 'Vizuelni pregled komore',
    icon: Eye,
    description: 'Obavljen vizuelni pregled cisterne'
  },
  {
    key: 'hasAdditives' as keyof DocumentationValues,
    label: 'Aditiviranje',
    icon: FlaskConical,
    description: 'Gorivo je aditivirano'
  },
  {
    key: 'isLastUnload' as keyof DocumentationValues,
    label: 'Posljednji istovar',
    icon: Truck,
    description: 'Ovo je posljednji istovar s ove cisterne'
  },
  {
    key: 'isTankCheckedAfterLastUnload' as keyof DocumentationValues,
    label: 'Provjera cisterne na zadnjem istovaru',
    icon: Search,
    description: 'Cisterna provjerena - uočeno gorivo'
  }
]

export default function DocumentationChecklist({ values, onChange }: Props) {
  const handleToggle = (key: keyof DocumentationValues) => {
    if (key === 'weighingData' || key === 'fuelFoundOnLastUnload') return // These are not boolean toggles
    onChange({
      ...values,
      [key]: !values[key]
    })
  }

  const handleWeighingChange = (field: keyof WeighingData, value: string) => {
    onChange({
      ...values,
      weighingData: {
        ...values.weighingData,
        [field]: value
      }
    })
  }

  const checkedCount = CHECKLIST_ITEMS.filter(item => values[item.key] === true).length

  return (
    <div className="space-y-4">
      {/* Documentation Checklist */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide">
            Dokumentacija i provjere
          </h4>
          <span className="text-xs text-slate-500">
            {checkedCount} / {CHECKLIST_ITEMS.length} označeno
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {CHECKLIST_ITEMS.map(item => {
            const Icon = item.icon
            const isChecked = values[item.key] === true
            const isWarning = (item as any).warning && isChecked

            return (
              <label
                key={item.key}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  isWarning
                    ? 'bg-red-50 border-red-300 text-red-800'
                    : isChecked
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleToggle(item.key)}
                  className={`mt-0.5 w-4 h-4 rounded border-slate-300 ${isWarning ? 'text-red-600 focus:ring-red-500' : 'text-emerald-600 focus:ring-emerald-500'}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isWarning ? 'text-red-600' : isChecked ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span className="text-sm font-medium truncate">{item.label}</span>
                  </div>
                  <p className={`text-xs mt-0.5 ${isWarning ? 'text-red-600' : isChecked ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {item.description}
                  </p>
                </div>
              </label>
            )
          })}
        </div>
      </div>

      {/* Fuel found on last unload */}
      {values.isTankCheckedAfterLastUnload && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <label className="block">
            <span className="text-sm font-medium text-amber-800">
              Istočena količina goriva uočenog na zadnjem istovaru (L)
            </span>
            <input
              type="number"
              value={values.fuelFoundOnLastUnload || ''}
              onChange={(e) => onChange({ ...values, fuelFoundOnLastUnload: e.target.value })}
              className="input w-full mt-2"
              placeholder="0"
            />
          </label>
        </div>
      )}

      {/* Weighing Section (optional) */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <label className="flex items-center gap-3 p-4 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
          <input
            type="checkbox"
            checked={values.hasWeighing || false}
            onChange={() => onChange({ ...values, hasWeighing: !values.hasWeighing })}
            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <Scale className="w-5 h-5 text-slate-500" />
          <div>
            <span className="text-sm font-medium text-slate-700">Vaganje cisterne</span>
            <p className="text-xs text-slate-500">Ako je u blizini vaga - vaga se cisterna</p>
          </div>
        </label>

        {values.hasWeighing && (
          <div className="p-4 bg-white border-t border-slate-200">
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1">Tara (kg)</label>
                <input
                  type="number"
                  value={values.weighingData?.tara || ''}
                  onChange={(e) => handleWeighingChange('tara', e.target.value)}
                  className="input w-full text-sm"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Bruto (kg)</label>
                <input
                  type="number"
                  value={values.weighingData?.bruto || ''}
                  onChange={(e) => handleWeighingChange('bruto', e.target.value)}
                  className="input w-full text-sm"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Neto (kg)</label>
                <input
                  type="number"
                  value={values.weighingData?.neto || ''}
                  onChange={(e) => handleWeighingChange('neto', e.target.value)}
                  className="input w-full text-sm"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Spec. težina (kg/L)</label>
                <input
                  type="number"
                  step="0.001"
                  value={values.weighingData?.specificWeight || ''}
                  onChange={(e) => handleWeighingChange('specificWeight', e.target.value)}
                  className="input w-full text-sm"
                  placeholder="0.850"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3 mt-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1">Temp na cisterni (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={values.weighingData?.tempOnTanker || ''}
                  onChange={(e) => handleWeighingChange('tempOnTanker', e.target.value)}
                  className="input w-full text-sm"
                  placeholder="15"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Litara s korekcijom</label>
                <input
                  type="number"
                  value={values.weighingData?.litersWithCorrection || ''}
                  onChange={(e) => handleWeighingChange('litersWithCorrection', e.target.value)}
                  className="input w-full text-sm"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Otpremnica (L)</label>
                <input
                  type="number"
                  value={values.weighingData?.deliveryNoteWeight || ''}
                  onChange={(e) => handleWeighingChange('deliveryNoteWeight', e.target.value)}
                  className="input w-full text-sm"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Razlika (L)</label>
                <input
                  type="number"
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
