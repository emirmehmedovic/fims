'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { formatDateSarajevo, formatDateTimeSarajevo } from '@/lib/utils/date'
import { 
  CheckCircle, XCircle, AlertTriangle, Shield, Fuel, Calendar, Package, MapPin, 
  Loader2, FileText, Building2, Truck, User, FlaskConical, Globe, Sparkles, FileCheck
} from 'lucide-react'

interface VerificationData {
  registrationNumber: number
  entryDate: string
  productName: string
  quantity: number
  countryOfOrigin: string | null
  warehouse: string
  warehouseCode: string
  warehouseLocation: string | null
  deliveryNoteNumber: string | null
  deliveryNoteDate: string | null
  customsDeclarationNumber: string | null
  customsDeclarationDate: string | null
  isHigherQuality: boolean
  improvedCharacteristics: string[]
  laboratoryName: string | null
  labAccreditationNumber: string | null
  testReportNumber: string | null
  testReportDate: string | null
  operator: string
  orderOpenedBy: string | null
  pickupLocation: string | null
  driverName: string | null
  supplier: string | null
  supplierCode: string | null
  transporter: string | null
  transporterCode: string | null
  hasCertificate: boolean
  issuedAt: string
}

interface VerificationResponse {
  success: boolean
  verified?: boolean
  data?: VerificationData
  error?: string
  retryAfter?: number
}

export default function VerifyPage() {
  const params = useParams()
  const id = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<VerificationResponse | null>(null)
  const [retryCountdown, setRetryCountdown] = useState(0)

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await fetch(`/api/verify/${id}`)
        const data = await res.json()
        setResult(data)
        
        if (data.retryAfter) {
          setRetryCountdown(data.retryAfter)
        }
      } catch {
        setResult({ success: false, error: 'Greška pri povezivanju sa serverom' })
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      verify()
    }
  }, [id])

  useEffect(() => {
    if (retryCountdown > 0) {
      const timer = setTimeout(() => setRetryCountdown(retryCountdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [retryCountdown])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return formatDateSarajevo(dateString)
  }

  const formatDateTime = (dateString: string) => formatDateTimeSarajevo(dateString)

  const d = result?.data

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-4 px-3 sm:py-8 sm:px-4">
      <div className="w-full max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-white/10 rounded-xl sm:rounded-2xl mb-3 backdrop-blur-sm">
            <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">Verifikacija dokumenta</h1>
          <p className="text-slate-400 text-xs sm:text-sm">HIFA Petrol - Sistem za evidenciju goriva</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-10 h-10 text-slate-400 animate-spin mx-auto mb-3" />
              <p className="text-slate-600 text-sm">Provjeravam dokument...</p>
            </div>
          ) : result?.verified && d ? (
            <div>
              {/* Success Header */}
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-4 sm:p-5 text-center">
                <CheckCircle className="w-12 h-12 sm:w-14 sm:h-14 text-white mx-auto mb-2" />
                <h2 className="text-lg sm:text-xl font-bold text-white">Dokument je validan</h2>
                <p className="text-emerald-100 text-xs sm:text-sm mt-1">Izjava o usklađenosti je verificirana</p>
              </div>
              
              {/* Content */}
              <div className="p-4 sm:p-5 space-y-4">
                {/* Registration Number */}
                <div className="bg-slate-900 text-white rounded-xl p-3 sm:p-4 text-center">
                  <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider mb-0.5">Registarski broj</p>
                  <p className="text-xl sm:text-2xl font-bold font-mono">{d.registrationNumber}</p>
                </div>

                {/* Basic Info Section */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">Osnovne informacije</h3>
                  <div className="bg-slate-50 rounded-xl p-3 space-y-2.5">
                    <InfoRow icon={Fuel} label="Proizvod" value={d.productName} color="blue" />
                    <InfoRow icon={Package} label="Količina" value={`${d.quantity.toLocaleString()} L`} color="amber" />
                    <InfoRow icon={Calendar} label="Datum ulaza" value={formatDate(d.entryDate)} color="green" />
                    <InfoRow icon={Globe} label="Zemlja porijekla" value={d.countryOfOrigin || '-'} color="purple" />
                    {d.isHigherQuality && (
                      <div className="pt-1">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span className="text-xs font-medium text-amber-700">Viša kvaliteta</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {d.improvedCharacteristics.map((char, i) => (
                            <span key={i} className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] sm:text-xs rounded-full">
                              {char}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Warehouse Section */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">Skladište</h3>
                  <div className="bg-slate-50 rounded-xl p-3 space-y-2.5">
                    <InfoRow icon={MapPin} label="Naziv" value={d.warehouse} color="indigo" />
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-slate-500">Šifra</span>
                      <span className="font-mono text-slate-700">{d.warehouseCode}</span>
                    </div>
                    {d.warehouseLocation && (
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-slate-500">Lokacija</span>
                        <span className="text-slate-700">{d.warehouseLocation}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Documents Section */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">Dokumentacija</h3>
                  <div className="bg-slate-50 rounded-xl p-3 space-y-2.5">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-slate-500">Br. otpremnice</span>
                      <span className="text-slate-700 font-mono">{d.deliveryNoteNumber || '-'}</span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-slate-500">Datum otpremnice</span>
                      <span className="text-slate-700">{formatDate(d.deliveryNoteDate)}</span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-slate-500">Br. carinske dekl.</span>
                      <span className="text-slate-700 font-mono">{d.customsDeclarationNumber || '-'}</span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-slate-500">Datum carinske dekl.</span>
                      <span className="text-slate-700">{formatDate(d.customsDeclarationDate)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs sm:text-sm pt-1">
                      <span className="text-slate-500">Certifikat</span>
                      {d.hasCertificate ? (
                        <span className="flex items-center gap-1 text-emerald-600">
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>Priložen</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">Nije priložen</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Laboratory Section */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">Laboratorij</h3>
                  <div className="bg-slate-50 rounded-xl p-3 space-y-2.5">
                    <InfoRow icon={FlaskConical} label="Naziv" value={d.laboratoryName || '-'} color="cyan" />
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-slate-500">Br. akreditacije</span>
                      <span className="text-slate-700 font-mono">{d.labAccreditationNumber || '-'}</span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-slate-500">Br. izvještaja</span>
                      <span className="text-slate-700 font-mono">{d.testReportNumber || '-'}</span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-slate-500">Datum izvještaja</span>
                      <span className="text-slate-700">{formatDate(d.testReportDate)}</span>
                    </div>
                  </div>
                </div>

                {/* Supplier & Transporter Section */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">Dobavljač i transport</h3>
                  <div className="bg-slate-50 rounded-xl p-3 space-y-2.5">
                    <InfoRow icon={Building2} label="Dobavljač" value={d.supplier || '-'} color="violet" />
                    {d.supplierCode && (
                      <div className="flex justify-between text-xs sm:text-sm pl-7">
                        <span className="text-slate-500">Šifra</span>
                        <span className="text-slate-700 font-mono">{d.supplierCode}</span>
                      </div>
                    )}
                    <InfoRow icon={Truck} label="Prevoznik" value={d.transporter || '-'} color="rose" />
                    {d.transporterCode && (
                      <div className="flex justify-between text-xs sm:text-sm pl-7">
                        <span className="text-slate-500">Šifra</span>
                        <span className="text-slate-700 font-mono">{d.transporterCode}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-slate-500">Vozač</span>
                      <span className="text-slate-700">{d.driverName || '-'}</span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-slate-500">Lokacija preuzimanja</span>
                      <span className="text-slate-700 text-right">{d.pickupLocation || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Personnel Section */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">Evidencija</h3>
                  <div className="bg-slate-50 rounded-xl p-3 space-y-2.5">
                    <InfoRow icon={User} label="Operator" value={d.operator} color="slate" />
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-slate-500">Narudžbu otvorio</span>
                      <span className="text-slate-700">{d.orderOpenedBy || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Warning Notice */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-2">
                  <div className="flex gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-amber-800">Važno upozorenje</p>
                      <p className="text-[10px] sm:text-xs text-amber-700 mt-0.5 leading-relaxed">
                        Provjerite da se svi podaci na fizičkom dokumentu (Izjavi o usklađenosti) 
                        podudaraju s podacima prikazanim na ovoj stranici. U slučaju nepodudaranja, 
                        dokument može biti nevažeći ili falsificiran.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-3 border-t border-slate-100 text-center">
                  <p className="text-[10px] sm:text-xs text-slate-400">
                    Dokument izdat: {formatDateTime(d.issuedAt)}
                  </p>
                </div>
              </div>
            </div>
          ) : result?.retryAfter ? (
            <div className="p-8 text-center">
              <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-7 h-7 text-amber-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">Previše zahtjeva</h2>
              <p className="text-slate-600 text-sm mb-4">Molimo pričekajte prije ponovnog pokušaja.</p>
              {retryCountdown > 0 && (
                <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-lg text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Pokušajte ponovo za {retryCountdown}s</span>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <XCircle className="w-7 h-7 text-red-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">
                {result?.error === 'Dokument je deaktiviran' ? 'Dokument deaktiviran' : 'Dokument nije pronađen'}
              </h2>
              <p className="text-slate-600 text-sm">{result?.error || 'Nije moguće verificirati ovaj dokument.'}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 sm:mt-6 text-center">
          <p className="text-slate-500 text-[10px] sm:text-xs">
            © {new Date().getFullYear()} HIFA Petrol d.o.o. Sva prava zadržana.
          </p>
        </div>
      </div>
    </div>
  )
}

// Helper component for info rows
function InfoRow({ icon: Icon, label, value, color }: { 
  icon: React.ElementType
  label: string
  value: string
  color: string 
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    amber: 'bg-amber-100 text-amber-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    cyan: 'bg-cyan-100 text-cyan-600',
    violet: 'bg-violet-100 text-violet-600',
    rose: 'bg-rose-100 text-rose-600',
    slate: 'bg-slate-200 text-slate-600',
  }

  return (
    <div className="flex items-center gap-2">
      <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${colorClasses[color]}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 flex justify-between items-center min-w-0">
        <span className="text-xs sm:text-sm text-slate-500">{label}</span>
        <span className="text-xs sm:text-sm text-slate-700 font-medium text-right truncate ml-2">{value}</span>
      </div>
    </div>
  )
}
