'use client'

import { useEffect, useState } from 'react'
import { formatDateSarajevo, formatDateTimeSarajevo } from '@/lib/utils/date'
import { 
  X, 
  FileText, 
  Download, 
  Building2, 
  Droplets, 
  Calendar, 
  User, 
  Truck, 
  MapPin,
  FlaskConical,
  FileCheck,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface FuelEntryDetail {
  id: string
  registrationNumber: number
  entryDate: string
  productName: string
  quantity: number
  deliveryNoteNumber: string | null
  deliveryNoteDate: string | null
  customsDeclarationNumber: string | null
  customsDeclarationDate: string | null
  isHigherQuality: boolean
  improvedCharacteristics: string[]
  countryOfOrigin: string | null
  laboratoryName: string | null
  labAccreditationNumber: string | null
  testReportNumber: string | null
  testReportDate: string | null
  orderOpenedBy: string | null
  pickupLocation: string | null
  driverName: string | null
  certificatePath: string | null
  certificateFileName: string | null
  certificateUploadedAt: string | null
  isActive: boolean
  warehouse: {
    id: string
    name: string
    code: string
    location: string | null
  }
  operator: {
    id: string
    name: string
    email: string
  }
  supplier: {
    id: string
    name: string
    code: string
    contactPerson: string | null
    phone: string | null
  } | null
  transporter: {
    id: string
    name: string
    code: string
    contactPerson: string | null
    phone: string | null
  } | null
  createdAt: string
  updatedAt: string
}

interface Props {
  entry: { id: string }
  onClose: () => void
}

export default function ViewFuelEntryModal({ entry, onClose }: Props) {
  const [details, setDetails] = useState<FuelEntryDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [exportingPdf, setExportingPdf] = useState(false)

  useEffect(() => {
    fetchDetails()
  }, [entry.id])

  const fetchDetails = async () => {
    try {
      const res = await fetch(`/api/fuel-entries/${entry.id}`)
      const data = await res.json()

      if (data.success) {
        setDetails(data.data)
      }
    } catch (error) {
      console.error('Error fetching entry details:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return formatDateSarajevo(dateString)
  }

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '-'
    return formatDateTimeSarajevo(dateString)
  }

  const handleExportPdf = async () => {
    if (!details) return
    
    setExportingPdf(true)
    try {
      const response = await fetch(`/api/exports/pdf/${details.id}`)
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Izjava_${details.registrationNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error exporting PDF:', error)
      alert('Greška pri generiranju PDF-a')
    } finally {
      setExportingPdf(false)
    }
  }

  if (loading || !details) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-3xl p-8 max-w-4xl w-full shadow-[var(--shadow-soft-xl)]">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-dark-500">Učitavanje detalja...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-[var(--shadow-soft-xl)] max-w-4xl w-full my-8 relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-100 rounded-full blur-3xl opacity-30 -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-50 rounded-full blur-3xl opacity-40 -ml-32 -mb-32"></div>

        {/* Header */}
        <div className="relative z-10 px-8 py-6 border-b border-dark-100">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-dark-900 to-dark-800 flex items-center justify-center shadow-[var(--shadow-soft-lg)]">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-dark-900">
                    Prijava #{details.registrationNumber}
                  </h2>
                  {details.isActive ? (
                    <span className="badge badge-success flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Aktivna
                    </span>
                  ) : (
                    <span className="badge badge-error flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      Obrisana
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-dark-500 mt-1">
                  <span>{formatDate(details.entryDate)} • {details.warehouse.code}</span>
                  <img
                    src="/Screenshot_8.png"
                    alt="H Plus HIFA Petrol"
                    className="h-6 w-auto rounded-lg border border-dark-100 bg-white"
                  />
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-dark-400 hover:text-dark-900 hover:bg-dark-50 rounded-xl transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 px-8 py-6 max-h-[65vh] overflow-y-auto">
          {/* Hero Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-2xl p-5 border border-primary-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary-100 rounded-xl">
                  <Droplets className="w-5 h-5 text-primary-600" />
                </div>
                <span className="text-sm font-medium text-dark-500">Količina</span>
              </div>
              <p className="text-2xl font-bold text-dark-900">{details.quantity.toLocaleString()} L</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl p-5 border border-emerald-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-100 rounded-xl">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="text-sm font-medium text-dark-500">Skladište</span>
              </div>
              <p className="text-lg font-bold text-dark-900">{details.warehouse.code}</p>
              <p className="text-xs text-dark-500">{details.warehouse.name}</p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-2xl p-5 border border-amber-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-amber-100 rounded-xl">
                  <FileCheck className="w-5 h-5 text-amber-600" />
                </div>
                <span className="text-sm font-medium text-dark-500">Proizvod</span>
              </div>
              <p className="text-lg font-bold text-dark-900">{details.productName}</p>
              {details.isHigherQuality && (
                <span className="text-xs text-amber-600 font-medium">Viša kvaliteta</span>
              )}
            </div>
          </div>

          {/* Improved Characteristics */}
          {details.improvedCharacteristics.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-dark-400 uppercase tracking-wide mb-3">Poboljšane karakteristike</h3>
              <div className="flex flex-wrap gap-2">
                {details.improvedCharacteristics.map((char, idx) => (
                  <span
                    key={idx}
                    className="px-4 py-2 rounded-xl text-sm font-medium bg-primary-50 text-primary-700 border border-primary-100"
                  >
                    {char}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Info Sections */}
          <div className="space-y-6">
            {/* Delivery Information */}
            <Section title="Informacije o isporuci" icon={Truck}>
              <div className="grid grid-cols-2 gap-4">
                <InfoCard label="Broj otpremnice" value={details.deliveryNoteNumber} />
                <InfoCard label="Datum otpremnice" value={formatDate(details.deliveryNoteDate)} />
                <InfoCard label="Broj carinske deklaracije" value={details.customsDeclarationNumber} />
                <InfoCard label="Datum carinske deklaracije" value={formatDate(details.customsDeclarationDate)} />
                <InfoCard label="Zemlja porijekla" value={details.countryOfOrigin} />
                <InfoCard label="Lokacija preuzimanja" value={details.pickupLocation} icon={MapPin} />
              </div>
            </Section>

            {/* Laboratory Information */}
            {(details.laboratoryName || details.testReportNumber) && (
              <Section title="Laboratorijske informacije" icon={FlaskConical}>
                <div className="grid grid-cols-2 gap-4">
                  <InfoCard label="Naziv laboratorije" value={details.laboratoryName} />
                  <InfoCard label="Broj akreditacije" value={details.labAccreditationNumber} />
                  <InfoCard label="Broj izvještaja" value={details.testReportNumber} />
                  <InfoCard label="Datum izvještaja" value={formatDate(details.testReportDate)} />
                </div>
              </Section>
            )}

            {/* Supplier & Transporter */}
            <Section title="Dobavljač i prevoznik" icon={Truck}>
              <div className="grid grid-cols-2 gap-4">
                <InfoCard
                  label="Dobavljač"
                  value={details.supplier ? `${details.supplier.code} - ${details.supplier.name}` : null}
                />
                <InfoCard
                  label="Kontakt osoba (dobavljač)"
                  value={details.supplier?.contactPerson}
                />
                <InfoCard
                  label="Prevoznik"
                  value={details.transporter ? `${details.transporter.code} - ${details.transporter.name}` : null}
                />
                <InfoCard label="Vozač" value={details.driverName} icon={User} />
              </div>
            </Section>

            {/* Other Information */}
            <Section title="Ostale informacije" icon={Clock}>
              <div className="grid grid-cols-2 gap-4">
                <InfoCard label="Narudžbu otvorio" value={details.orderOpenedBy} />
                <InfoCard label="Operator" value={`${details.operator.name}`} icon={User} />
                <InfoCard label="Kreirano" value={formatDateTime(details.createdAt)} icon={Calendar} />
                <InfoCard label="Ažurirano" value={formatDateTime(details.updatedAt)} icon={Calendar} />
              </div>
            </Section>

            {/* Certificate */}
            {details.certificatePath && (
              <Section title="Certifikat" icon={FileCheck}>
                <div className="bg-gradient-to-br from-dark-50 to-dark-100/50 rounded-2xl p-5 border border-dark-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-[var(--shadow-soft)]">
                        <FileText className="w-6 h-6 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-dark-900">{details.certificateFileName}</p>
                        <p className="text-xs text-dark-500 mt-1">
                          Učitano: {formatDateTime(details.certificateUploadedAt)}
                        </p>
                      </div>
                    </div>
                    <a
                      href={details.certificatePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-dark-900 text-white text-sm font-medium rounded-xl hover:bg-dark-800 transition-colors flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Preuzmi
                    </a>
                  </div>
                </div>
              </Section>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 px-8 py-6 border-t border-dark-100 bg-dark-50/50">
          <div className="flex justify-between items-center">
            <button
              onClick={handleExportPdf}
              disabled={exportingPdf}
              className="px-6 py-3 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white font-semibold rounded-2xl hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-[var(--shadow-soft)] transition-all"
            >
              {exportingPdf ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Generiranje PDF...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Preuzmi PDF
                </>
              )}
            </button>
            <button 
              onClick={onClose} 
              className="px-6 py-3 bg-dark-900 text-white font-semibold rounded-2xl hover:bg-dark-800 transition-colors shadow-[var(--shadow-soft)]"
            >
              Zatvori
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-dark-100 overflow-hidden">
      <div className="px-5 py-4 bg-dark-50 border-b border-dark-100 flex items-center gap-3">
        <Icon className="w-5 h-5 text-dark-400" />
        <h3 className="text-sm font-bold text-dark-700 uppercase tracking-wide">{title}</h3>
      </div>
      <div className="p-5">
        {children}
      </div>
    </div>
  )
}

function InfoCard({ label, value, icon: Icon }: { label: string; value: string | null | undefined; icon?: any }) {
  return (
    <div className="p-4 rounded-xl bg-dark-50 border border-dark-100 hover:border-primary-200 hover:bg-primary-50/30 transition-all">
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon className="w-4 h-4 text-dark-400" />}
        <span className="text-xs font-semibold text-dark-400 uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-sm font-medium text-dark-900">{value || '-'}</p>
    </div>
  )
}
