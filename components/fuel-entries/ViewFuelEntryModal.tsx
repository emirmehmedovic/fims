'use client'

import { useEffect, useState } from 'react'
import { formatDateSarajevo, formatDateTimeSarajevo } from '@/lib/utils/date'
import { getCertificateDownloadUrl } from '@/lib/utils/certificate-url'
import {
  X,
  FileText,
  Download,
  Printer,
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
  declarationNumber?: string | null
  entryDate: string
  productName: string
  quantity: number
  deliveryNoteNumber: string | null
  deliveryNoteDate: string | null
  customsDeclarationNumber: string | null
  customsDeclarationDate: string | null
  isHigherQuality: boolean
  improvedCharacteristics: string[]
  additiveDetails: any[] | null
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
  client?: {
    id: string
    name: string
    code: string | null
  } | null
  station?: {
    id: string
    name: string
    code: string
    address: string
  } | null
  receiptRecord?: {
    id: string
    tankMeasurements: any[]
    announcedQuantity: number | null
    dischargedQuantity: number | null
    differenceQuantity: number | null
    meterReading: number | null
    deliveryNoteQuantity: number | null
    finalDifference: number | null
    hasDeliveryNote: boolean
    hasQualityCertificate: boolean
    hasComplianceDeclaration: boolean
    isWaterMeasured: boolean
    hasWaterInTank: boolean
    isVisualInspectionDone: boolean
    hasAdditives: boolean
    isLastUnload: boolean
    isTankCheckedAfterLastUnload: boolean
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
  const [printingPdf, setPrintingPdf] = useState(false)
  const [exportingAdditivePdf, setExportingAdditivePdf] = useState(false)
  const [printingAdditivePdf, setPrintingAdditivePdf] = useState(false)
  const [exportingZapisnikPdf, setExportingZapisnikPdf] = useState(false)
  const [printingZapisnikPdf, setPrintingZapisnikPdf] = useState(false)

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

  // Use declarationNumber (format: 0001/26) and sanitize for filename (replace / with -)
  const getSanitizedDeclarationNum = () => {
    const declarationNum = details?.declarationNumber || String(details?.registrationNumber || '')
    return declarationNum.replace(/\//g, '-')
  }

  // Sanitize client name for filename - remove ALL special characters
  const getClientNameForFilename = () => {
    if (!details?.client?.name) return 'Nepoznat'
    return details.client.name
      .replace(/[„""''«»]/g, '')           // Remove special quotes
      .replace(/[\/\\:*?"<>|]/g, '')       // Remove filesystem-unsafe chars
      .replace(/[^\w\s\-čćžšđČĆŽŠĐáéíóúÁÉÍÓÚäöüÄÖÜ]/g, '') // Keep only word chars, spaces, dashes
      .replace(/\s+/g, '_')                 // Replace spaces with underscores
      .replace(/_+/g, '_')                  // Collapse multiple underscores
      .replace(/^_|_$/g, '')                // Trim underscores from start/end
      .substring(0, 50)
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
      a.download = `Izjava_${getSanitizedDeclarationNum()}_${getClientNameForFilename()}.pdf`
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

  const handleExportAdditivePdf = async () => {
    if (!details) return

    setExportingAdditivePdf(true)
    try {
      const response = await fetch(`/api/exports/additive-declaration/${details.id}`)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to generate additive declaration PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Izjava_O_Aditiviranju_${getSanitizedDeclarationNum()}_${getClientNameForFilename()}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error exporting additive declaration PDF:', error)
      alert('Greška pri generiranju izjave o aditiviranju')
    } finally {
      setExportingAdditivePdf(false)
    }
  }

  // Direct print function - opens window synchronously to avoid popup blocker
  const handlePrintPdf = async () => {
    if (!details) return

    // Open window immediately (synchronously) to avoid popup blocker
    const printWindow = window.open('about:blank', '_blank')
    if (!printWindow) {
      alert('Molimo dozvolite popup prozore za ovu stranicu kako biste mogli printati.')
      return
    }

    // Show loading message in the new window
    printWindow.document.write('<html><body><h2 style="font-family: Arial; text-align: center; margin-top: 50px;">Učitavanje dokumenta...</h2></body></html>')

    setPrintingPdf(true)
    try {
      const response = await fetch(`/api/exports/pdf/${details.id}`)

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)

      // Navigate the already-open window to the PDF
      printWindow.location.href = url

      // Wait for PDF to load, then trigger print
      setTimeout(() => {
        try {
          printWindow.focus()
          printWindow.print()
        } catch (e) {
          // Print may fail silently, that's ok
        }
        // Cleanup
        setTimeout(() => {
          window.URL.revokeObjectURL(url)
        }, 60000)
      }, 1500)
    } catch (error) {
      console.error('Error printing PDF:', error)
      printWindow.close()
      alert('Greška pri printanju PDF-a')
    } finally {
      setPrintingPdf(false)
    }
  }

  const handlePrintAdditivePdf = async () => {
    if (!details) return

    // Open window immediately (synchronously) to avoid popup blocker
    const printWindow = window.open('about:blank', '_blank')
    if (!printWindow) {
      alert('Molimo dozvolite popup prozore za ovu stranicu kako biste mogli printati.')
      return
    }

    printWindow.document.write('<html><body><h2 style="font-family: Arial; text-align: center; margin-top: 50px;">Učitavanje dokumenta...</h2></body></html>')

    setPrintingAdditivePdf(true)
    try {
      const response = await fetch(`/api/exports/additive-declaration/${details.id}`)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to generate additive declaration PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)

      printWindow.location.href = url

      setTimeout(() => {
        try {
          printWindow.focus()
          printWindow.print()
        } catch (e) {
          // Print may fail silently
        }
        setTimeout(() => {
          window.URL.revokeObjectURL(url)
        }, 60000)
      }, 1500)
    } catch (error) {
      console.error('Error printing additive PDF:', error)
      printWindow.close()
      alert('Greška pri printanju izjave o aditiviranju')
    } finally {
      setPrintingAdditivePdf(false)
    }
  }

  // Zapisnik o prijemu goriva PDF handlers
  const handleExportZapisnikPdf = async () => {
    if (!details || !details.receiptRecord) return

    setExportingZapisnikPdf(true)
    try {
      const response = await fetch(`/api/exports/receipt-record/${details.id}`)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to generate receipt record PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      const declarationNum = details.declarationNumber || String(details.registrationNumber)
      const sanitizedDeclarationNum = declarationNum.replace(/\//g, '-')
      a.href = url
      a.download = `Zapisnik_${sanitizedDeclarationNum}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting receipt record PDF:', error)
      alert('Greška pri exportu zapisnika o prijemu goriva')
    } finally {
      setExportingZapisnikPdf(false)
    }
  }

  const handlePrintZapisnikPdf = async () => {
    if (!details || !details.receiptRecord) return

    // Open window immediately (synchronously) to avoid popup blocker
    const printWindow = window.open('about:blank', '_blank')
    if (!printWindow) {
      alert('Molimo dozvolite popup prozore za ovu stranicu kako biste mogli printati.')
      return
    }

    printWindow.document.write('<html><body><h2 style="font-family: Arial; text-align: center; margin-top: 50px;">Učitavanje dokumenta...</h2></body></html>')

    setPrintingZapisnikPdf(true)
    try {
      const response = await fetch(`/api/exports/receipt-record/${details.id}`)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to generate receipt record PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)

      printWindow.location.href = url

      setTimeout(() => {
        try {
          printWindow.focus()
          printWindow.print()
        } catch (e) {
          // Print may fail silently
        }
        setTimeout(() => {
          window.URL.revokeObjectURL(url)
        }, 60000)
      }, 1500)
    } catch (error) {
      console.error('Error printing receipt record PDF:', error)
      printWindow.close()
      alert('Greška pri printanju zapisnika o prijemu goriva')
    } finally {
      setPrintingZapisnikPdf(false)
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
                    Izjava br. {details.declarationNumber || details.registrationNumber}
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
                      href={getCertificateDownloadUrl(details.certificatePath) || '#'}
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

            {/* Zapisnik o prijemu goriva - Receipt Record */}
            {details.receiptRecord && (
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border-2 border-indigo-200 p-5">
                <h3 className="text-sm font-bold text-indigo-800 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <FileCheck className="w-5 h-5" />
                  Zapisnik o prijemu goriva
                </h3>

                {/* Tank Measurements Summary */}
                {details.receiptRecord.tankMeasurements && details.receiptRecord.tankMeasurements.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-indigo-600 uppercase mb-2">Mjerenja rezervoara</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-indigo-100">
                            <th className="p-2 text-left">Rezervoar</th>
                            <th className="p-2 text-right">Početno (L)</th>
                            <th className="p-2 text-right">Završno (L)</th>
                            <th className="p-2 text-right">Istočeno (L)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(details.receiptRecord.tankMeasurements as any[]).map((m: any, i: number) => (
                            <tr key={i} className="border-b border-indigo-100">
                              <td className="p-2 font-semibold">{m.tankNumber}</td>
                              <td className="p-2 text-right">{m.initialLiters15 || '-'}</td>
                              <td className="p-2 text-right">{m.finalLiters15 || '-'}</td>
                              <td className="p-2 text-right font-semibold text-indigo-700">
                                {m.initialLiters15 && m.finalLiters15
                                  ? (parseInt(m.finalLiters15) - parseInt(m.initialLiters15)).toLocaleString()
                                  : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Calculations */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-white p-3 rounded-xl border border-indigo-100">
                    <p className="text-xs text-indigo-500 mb-1">Najavljena količina</p>
                    <p className="font-bold text-indigo-900">
                      {details.receiptRecord.announcedQuantity?.toLocaleString() || '-'} L
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-indigo-100">
                    <p className="text-xs text-indigo-500 mb-1">Količina istočenog</p>
                    <p className="font-bold text-indigo-900">
                      {details.receiptRecord.dischargedQuantity?.toLocaleString() || '-'} L
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl border ${
                    (details.receiptRecord.finalDifference || 0) >= 0
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <p className="text-xs text-slate-500 mb-1">
                      Konačni {(details.receiptRecord.finalDifference || 0) >= 0 ? 'višak' : 'manjak'}
                    </p>
                    <p className={`font-bold ${
                      (details.receiptRecord.finalDifference || 0) >= 0
                        ? 'text-green-700'
                        : 'text-red-700'
                    }`}>
                      {Math.abs(details.receiptRecord.finalDifference || 0).toLocaleString()} L
                    </p>
                  </div>
                </div>

                {/* Documentation Checklist */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'hasDeliveryNote', label: 'Otpremnica' },
                    { key: 'hasQualityCertificate', label: 'Certifikat' },
                    { key: 'hasComplianceDeclaration', label: 'Izjava' },
                    { key: 'isWaterMeasured', label: 'Voda mjerena' },
                    { key: 'hasWaterInTank', label: 'Voda u cisterni', warning: true },
                    { key: 'isVisualInspectionDone', label: 'Vizuelno' },
                    { key: 'hasAdditives', label: 'Aditiv' },
                    { key: 'isLastUnload', label: 'Zadnji' },
                    { key: 'isTankCheckedAfterLastUnload', label: 'Provjera' }
                  ].map(item => {
                    const isChecked = (details.receiptRecord as any)[item.key]
                    const isWarning = (item as any).warning && isChecked
                    return (
                      <span
                        key={item.key}
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          isWarning
                            ? 'bg-red-100 text-red-700'
                            : isChecked
                              ? 'bg-green-100 text-green-700'
                              : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {isChecked ? '✓' : '✗'} {item.label}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 px-8 py-6 border-t border-dark-100 bg-dark-50/50">
          <div className="flex justify-between items-center">
            <div className="flex gap-2 flex-wrap">
              {/* Izjava buttons */}
              <div className="flex">
                <button
                  onClick={handleExportPdf}
                  disabled={exportingPdf}
                  className="px-4 py-3 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white font-semibold rounded-l-2xl hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-[var(--shadow-soft)] transition-all"
                >
                  {exportingPdf ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      Generiranje...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      Preuzmi Izjavu
                    </>
                  )}
                </button>
                <button
                  onClick={handlePrintPdf}
                  disabled={printingPdf}
                  className="group px-3 py-3 bg-gradient-to-br from-emerald-800 to-emerald-900 text-white font-semibold rounded-r-2xl hover:from-emerald-600 hover:to-emerald-700 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 border-l-2 border-emerald-400/50 transition-all duration-200"
                  title="Direktno printanje"
                >
                  {printingPdf ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <Printer className="w-5 h-5 group-hover:animate-pulse" />
                  )}
                </button>
              </div>

              {/* Aditiviranje buttons */}
              {details.additiveDetails && details.additiveDetails.length > 0 && (
                <div className="flex">
                  <button
                    onClick={handleExportAdditivePdf}
                    disabled={exportingAdditivePdf}
                    className="px-4 py-3 bg-gradient-to-br from-primary-600 to-primary-700 text-white font-semibold rounded-l-2xl hover:from-primary-500 hover:to-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-[var(--shadow-soft)] transition-all"
                  >
                    {exportingAdditivePdf ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        Generiranje...
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5" />
                        Izjava o aditiviranju
                      </>
                    )}
                  </button>
                  <button
                    onClick={handlePrintAdditivePdf}
                    disabled={printingAdditivePdf}
                    className="group px-3 py-3 bg-gradient-to-br from-primary-800 to-primary-900 text-white font-semibold rounded-r-2xl hover:from-primary-600 hover:to-primary-700 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 border-l-2 border-primary-400/50 transition-all duration-200"
                    title="Direktno printanje"
                  >
                    {printingAdditivePdf ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    ) : (
                      <Printer className="w-5 h-5 group-hover:animate-pulse" />
                    )}
                  </button>
                </div>
              )}

              {/* Zapisnik o prijemu goriva buttons */}
              {details.receiptRecord && (
                <div className="flex">
                  <button
                    onClick={handleExportZapisnikPdf}
                    disabled={exportingZapisnikPdf}
                    className="px-4 py-3 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white font-semibold rounded-l-2xl hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-[var(--shadow-soft)] transition-all"
                  >
                    {exportingZapisnikPdf ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        Generiranje...
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5" />
                        Zapisnik o prijemu
                      </>
                    )}
                  </button>
                  <button
                    onClick={handlePrintZapisnikPdf}
                    disabled={printingZapisnikPdf}
                    className="group px-3 py-3 bg-gradient-to-br from-indigo-800 to-indigo-900 text-white font-semibold rounded-r-2xl hover:from-indigo-600 hover:to-indigo-700 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 border-l-2 border-indigo-400/50 transition-all duration-200"
                    title="Direktno printanje"
                  >
                    {printingZapisnikPdf ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    ) : (
                      <Printer className="w-5 h-5 group-hover:animate-pulse" />
                    )}
                  </button>
                </div>
              )}
            </div>
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
