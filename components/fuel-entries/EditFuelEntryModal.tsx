'use client'

import { useState, useEffect } from 'react'
import { formatDateInputValueSarajevo } from '@/lib/utils/date'
import { 
  X, 
  Pencil,
  Calendar,
  Building2,
  Droplets,
  FileText,
  Truck,
  FlaskConical,
  Upload,
  CheckCircle,
  MapPin,
  User,
  Globe,
  FileCheck,
  Download,
  Save
} from 'lucide-react'

interface Warehouse {
  id: string
  name: string
  code: string
  isActive: boolean
}

interface Supplier {
  id: string
  name: string
  code: string
  isActive: boolean
}

interface Transporter {
  id: string
  name: string
  code: string
  isActive: boolean
}

interface FuelEntry {
  id: string
  registrationNumber: number
  entryDate: string
  productName: string
  quantity: number
  deliveryNoteNumber: string | null
  deliveryNoteDate: string | null
  customsDeclarationNumber?: string | null
  customsDeclarationDate?: string | null
  isHigherQuality: boolean
  improvedCharacteristics?: string[]
  countryOfOrigin?: string | null
  laboratoryName?: string | null
  labAccreditationNumber?: string | null
  testReportNumber?: string | null
  testReportDate?: string | null
  orderOpenedBy?: string | null
  pickupLocation?: string | null
  supplierId?: string | null
  transporterId?: string | null
  driverName?: string | null
  certificatePath: string | null
  certificateFileName: string | null
  warehouse: {
    id: string
    name: string
    code: string
  }
}

interface Props {
  entry: FuelEntry
  onClose: () => void
  onSuccess: () => void
}

export default function EditFuelEntryModal({ entry, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [transporters, setTransporters] = useState<Transporter[]>([])
  const [fullEntry, setFullEntry] = useState<any>(null)

  // Form state - Basic
  const [entryDate, setEntryDate] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [productName, setProductName] = useState('')
  const [quantity, setQuantity] = useState('')

  // Form state - Delivery
  const [deliveryNoteNumber, setDeliveryNoteNumber] = useState('')
  const [deliveryNoteDate, setDeliveryNoteDate] = useState('')
  const [customsDeclarationNumber, setCustomsDeclarationNumber] = useState('')
  const [customsDeclarationDate, setCustomsDeclarationDate] = useState('')

  // Form state - Quality
  const [isHigherQuality, setIsHigherQuality] = useState(false)
  const [improvedCharacteristics, setImprovedCharacteristics] = useState<string[]>([])
  const [countryOfOrigin, setCountryOfOrigin] = useState('')

  // Form state - Laboratory
  const [laboratoryName, setLaboratoryName] = useState('')
  const [labAccreditationNumber, setLabAccreditationNumber] = useState('')
  const [testReportNumber, setTestReportNumber] = useState('')
  const [testReportDate, setTestReportDate] = useState('')

  // Form state - Supplier & Transport
  const [orderOpenedBy, setOrderOpenedBy] = useState('')
  const [pickupLocation, setPickupLocation] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [transporterId, setTransporterId] = useState('')
  const [driverName, setDriverName] = useState('')

  // Form state - Certificate
  const [certificate, setCertificate] = useState<File | null>(null)

  const characteristicOptions = [
    'Niža gustina',
    'Niža viskoznost',
    'Niži sadržaj sumpora',
    'Viša cetanska vrijednost',
    'Bolji indeks viskoznosti',
    'Niža tačka tečenja'
  ]

  useEffect(() => {
    fetchData()
  }, [entry.id])

  const fetchData = async () => {
    setLoadingData(true)
    try {
      // Fetch full entry details, warehouses, suppliers, transporters in parallel
      const [entryRes, warehousesRes, suppliersRes, transportersRes] = await Promise.all([
        fetch(`/api/fuel-entries/${entry.id}`),
        fetch('/api/warehouses'),
        fetch('/api/suppliers'),
        fetch('/api/transporters')
      ])

      const [entryData, warehousesData, suppliersData, transportersData] = await Promise.all([
        entryRes.json(),
        warehousesRes.json(),
        suppliersRes.json(),
        transportersRes.json()
      ])

      if (warehousesData.success) setWarehouses(warehousesData.data)
      if (suppliersData.success) setSuppliers(suppliersData.data)
      if (transportersData.success) setTransporters(transportersData.data)

      if (entryData.success) {
        const e = entryData.data
        setFullEntry(e)
        
        // Populate form fields
        setEntryDate(e.entryDate ? formatDateInputValueSarajevo(e.entryDate) : '')
        setWarehouseId(e.warehouse?.id || '')
        setProductName(e.productName || '')
        setQuantity(e.quantity?.toString() || '')
        setDeliveryNoteNumber(e.deliveryNoteNumber || '')
        setDeliveryNoteDate(e.deliveryNoteDate ? formatDateInputValueSarajevo(e.deliveryNoteDate) : '')
        setCustomsDeclarationNumber(e.customsDeclarationNumber || '')
        setCustomsDeclarationDate(e.customsDeclarationDate ? formatDateInputValueSarajevo(e.customsDeclarationDate) : '')
        setIsHigherQuality(e.isHigherQuality || false)
        setImprovedCharacteristics(e.improvedCharacteristics || [])
        setCountryOfOrigin(e.countryOfOrigin || '')
        setLaboratoryName(e.laboratoryName || '')
        setLabAccreditationNumber(e.labAccreditationNumber || '')
        setTestReportNumber(e.testReportNumber || '')
        setTestReportDate(e.testReportDate ? formatDateInputValueSarajevo(e.testReportDate) : '')
        setOrderOpenedBy(e.orderOpenedBy || '')
        setPickupLocation(e.pickupLocation || '')
        setSupplierId(e.supplier?.id || '')
        setTransporterId(e.transporter?.id || '')
        setDriverName(e.driverName || '')
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleCharacteristicToggle = (char: string) => {
    setImprovedCharacteristics(prev =>
      prev.includes(char)
        ? prev.filter(c => c !== char)
        : [...prev, char]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!warehouseId || !productName || !quantity) {
      alert('Molimo popunite sva obavezna polja')
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('entryDate', entryDate)
      formData.append('warehouseId', warehouseId)
      formData.append('productName', productName)
      formData.append('quantity', quantity)
      formData.append('isHigherQuality', isHigherQuality.toString())

      if (deliveryNoteNumber) formData.append('deliveryNoteNumber', deliveryNoteNumber)
      if (deliveryNoteDate) formData.append('deliveryNoteDate', deliveryNoteDate)
      if (customsDeclarationNumber) formData.append('customsDeclarationNumber', customsDeclarationNumber)
      if (customsDeclarationDate) formData.append('customsDeclarationDate', customsDeclarationDate)
      if (countryOfOrigin) formData.append('countryOfOrigin', countryOfOrigin)
      if (laboratoryName) formData.append('laboratoryName', laboratoryName)
      if (labAccreditationNumber) formData.append('labAccreditationNumber', labAccreditationNumber)
      if (testReportNumber) formData.append('testReportNumber', testReportNumber)
      if (testReportDate) formData.append('testReportDate', testReportDate)
      if (orderOpenedBy) formData.append('orderOpenedBy', orderOpenedBy)
      if (pickupLocation) formData.append('pickupLocation', pickupLocation)
      if (supplierId) formData.append('supplierId', supplierId)
      if (transporterId) formData.append('transporterId', transporterId)
      if (driverName) formData.append('driverName', driverName)

      improvedCharacteristics.forEach(char => {
        formData.append('improvedCharacteristics[]', char)
      })

      if (certificate) {
        formData.append('certificate', certificate)
      }

      const res = await fetch(`/api/fuel-entries/${entry.id}`, {
        method: 'PATCH',
        body: formData
      })

      const data = await res.json()

      if (data.success) {
        alert('Prijava uspješno ažurirana!')
        onSuccess()
      } else {
        alert(data.error || 'Greška pri ažuriranju prijave')
      }
    } catch (error) {
      alert('Greška pri ažuriranju prijave')
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-3xl p-8 max-w-4xl w-full shadow-[var(--shadow-soft-xl)]">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-dark-500">Učitavanje podataka...</p>
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
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-100 rounded-full blur-3xl opacity-30 -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-50 rounded-full blur-3xl opacity-40 -ml-32 -mb-32"></div>

        {/* Header */}
        <div className="relative z-10 px-8 py-6 border-b border-dark-100">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-[var(--shadow-soft-lg)]">
                <Pencil className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-dark-900">
                  Uredi prijavu #{entry.registrationNumber}
                </h2>
                <p className="text-dark-500 mt-1">Ažurirajte podatke o prijavi ulaza goriva</p>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="relative z-10 px-8 py-6 max-h-[65vh] overflow-y-auto">
          {/* Basic Information */}
          <FormSection title="Osnovne informacije" icon={Droplets} required>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Datum ulaza" required icon={Calendar}>
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="input w-full"
                  required
                />
              </FormField>
              <FormField label="Skladište" required icon={Building2}>
                <select
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  className="input w-full"
                  required
                >
                  <option value="">Odaberite skladište</option>
                  {warehouses.filter(w => w.isActive).map(w => (
                    <option key={w.id} value={w.id}>
                      {w.code} - {w.name}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Naziv proizvoda" required icon={FileText}>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="input w-full"
                  placeholder="npr. Diesel D2, JET A-1..."
                  required
                />
              </FormField>
              <FormField label="Količina (litara)" required icon={Droplets}>
                <input
                  type="text"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value.replace(/[^0-9]/g, ''))}
                  className="input w-full"
                  placeholder="npr. 50000"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                />
              </FormField>
            </div>
          </FormSection>

          {/* Delivery Information */}
          <FormSection title="Informacije o isporuci" icon={Truck}>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Broj otpremnice" icon={FileText}>
                <input
                  type="text"
                  value={deliveryNoteNumber}
                  onChange={(e) => setDeliveryNoteNumber(e.target.value)}
                  className="input w-full"
                />
              </FormField>
              <FormField label="Datum otpremnice" icon={Calendar}>
                <input
                  type="date"
                  value={deliveryNoteDate}
                  onChange={(e) => setDeliveryNoteDate(e.target.value)}
                  className="input w-full"
                />
              </FormField>
              <FormField label="Broj carinske deklaracije" icon={FileCheck}>
                <input
                  type="text"
                  value={customsDeclarationNumber}
                  onChange={(e) => setCustomsDeclarationNumber(e.target.value)}
                  className="input w-full"
                />
              </FormField>
              <FormField label="Datum carinske deklaracije" icon={Calendar}>
                <input
                  type="date"
                  value={customsDeclarationDate}
                  onChange={(e) => setCustomsDeclarationDate(e.target.value)}
                  className="input w-full"
                />
              </FormField>
              <FormField label="Zemlja porijekla" icon={Globe}>
                <input
                  type="text"
                  value={countryOfOrigin}
                  onChange={(e) => setCountryOfOrigin(e.target.value)}
                  className="input w-full"
                  placeholder="npr. Saudijska Arabija"
                />
              </FormField>
              <FormField label="Lokacija preuzimanja" icon={MapPin}>
                <input
                  type="text"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  className="input w-full"
                />
              </FormField>
            </div>
          </FormSection>

          {/* Quality Information */}
          <FormSection title="Informacije o kvaliteti" icon={CheckCircle}>
            <div className="mb-4">
              <label className="flex items-center gap-3 p-4 rounded-2xl bg-dark-50 border border-dark-100 hover:border-primary-200 hover:bg-primary-50/30 transition-all cursor-pointer">
                <input
                  type="checkbox"
                  checked={isHigherQuality}
                  onChange={(e) => setIsHigherQuality(e.target.checked)}
                  className="w-5 h-5 rounded-lg border-dark-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-dark-900">Gorivo više kvalitete</span>
              </label>
            </div>
            {isHigherQuality && (
              <div>
                <p className="text-xs font-semibold text-dark-400 uppercase tracking-wide mb-3">Poboljšane karakteristike</p>
                <div className="grid grid-cols-2 gap-2">
                  {characteristicOptions.map(char => (
                    <label 
                      key={char} 
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                        improvedCharacteristics.includes(char)
                          ? 'bg-primary-50 border-primary-200 text-primary-700'
                          : 'bg-dark-50 border-dark-100 text-dark-700 hover:border-primary-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={improvedCharacteristics.includes(char)}
                        onChange={() => handleCharacteristicToggle(char)}
                        className="w-4 h-4 rounded border-dark-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium">{char}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </FormSection>

          {/* Laboratory Information */}
          <FormSection title="Laboratorijske informacije" icon={FlaskConical}>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Naziv laboratorije" icon={Building2}>
                <input
                  type="text"
                  value={laboratoryName}
                  onChange={(e) => setLaboratoryName(e.target.value)}
                  className="input w-full"
                />
              </FormField>
              <FormField label="Broj akreditacije" icon={FileCheck}>
                <input
                  type="text"
                  value={labAccreditationNumber}
                  onChange={(e) => setLabAccreditationNumber(e.target.value)}
                  className="input w-full"
                />
              </FormField>
              <FormField label="Broj izvještaja" icon={FileText}>
                <input
                  type="text"
                  value={testReportNumber}
                  onChange={(e) => setTestReportNumber(e.target.value)}
                  className="input w-full"
                />
              </FormField>
              <FormField label="Datum izvještaja" icon={Calendar}>
                <input
                  type="date"
                  value={testReportDate}
                  onChange={(e) => setTestReportDate(e.target.value)}
                  className="input w-full"
                />
              </FormField>
            </div>
          </FormSection>

          {/* Supplier & Transporter */}
          <FormSection title="Dobavljač i prevoznik" icon={Truck}>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Narudžbu otvorio" icon={User}>
                <input
                  type="text"
                  value={orderOpenedBy}
                  onChange={(e) => setOrderOpenedBy(e.target.value)}
                  className="input w-full"
                  placeholder="Ime i prezime"
                />
              </FormField>
              <FormField label="Dobavljač" icon={Building2}>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="input w-full"
                >
                  <option value="">Odaberite dobavljača</option>
                  {suppliers.filter(s => s.isActive).map(s => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Prevoznik" icon={Truck}>
                <select
                  value={transporterId}
                  onChange={(e) => setTransporterId(e.target.value)}
                  className="input w-full"
                >
                  <option value="">Odaberite prevoznika</option>
                  {transporters.filter(t => t.isActive).map(t => (
                    <option key={t.id} value={t.id}>
                      {t.code} - {t.name}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Vozač" icon={User}>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="input w-full"
                  placeholder="Ime i prezime vozača"
                />
              </FormField>
            </div>
          </FormSection>

          {/* Certificate Upload */}
          <FormSection title="Certifikat / Izvještaj" icon={Upload}>
            {fullEntry?.certificatePath && (
              <div className="bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-2xl p-5 border border-primary-200 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-[var(--shadow-soft)]">
                      <FileText className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-dark-900">Postojeći certifikat</p>
                      <p className="text-sm text-dark-500">{fullEntry.certificateFileName}</p>
                    </div>
                  </div>
                  <a
                    href={fullEntry.certificatePath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Preuzmi
                  </a>
                </div>
              </div>
            )}
            <div className="border-2 border-dashed border-dark-200 rounded-2xl p-6 hover:border-primary-300 hover:bg-primary-50/20 transition-all">
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-dark-100 flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6 text-dark-400" />
                </div>
                <p className="text-sm font-medium text-dark-700 mb-1">
                  {fullEntry?.certificatePath ? 'Zamijeni certifikat' : 'Upload certifikata'}
                </p>
                <p className="text-xs text-dark-500 mb-4">PDF, JPG, PNG (max 10MB)</p>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setCertificate(e.target.files?.[0] || null)}
                  className="hidden"
                  id="certificate-upload-edit"
                />
                <label
                  htmlFor="certificate-upload-edit"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-dark-900 text-white text-sm font-medium rounded-xl hover:bg-dark-800 transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  Odaberi fajl
                </label>
              </div>
              {certificate && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-dark-900">Novi fajl: {certificate.name}</p>
                    <p className="text-xs text-dark-500">{(certificate.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCertificate(null)}
                    className="p-1 text-dark-400 hover:text-red-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </FormSection>
        </form>

        {/* Footer */}
        <div className="relative z-10 px-8 py-6 border-t border-dark-100 bg-dark-50/50">
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-sm font-medium text-dark-600 bg-white border border-dark-200 rounded-2xl hover:bg-dark-50 transition-colors"
              disabled={loading}
            >
              Otkaži
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-br from-amber-500 to-amber-600 text-white font-semibold rounded-2xl hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-[var(--shadow-soft)] transition-all"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Spremanje...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Spremi promjene
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function FormSection({ title, icon: Icon, required, children }: { title: string; icon: any; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="mb-6 bg-white rounded-2xl border border-dark-100 overflow-hidden">
      <div className="px-5 py-4 bg-dark-50 border-b border-dark-100 flex items-center gap-3">
        <Icon className="w-5 h-5 text-dark-400" />
        <h3 className="text-sm font-bold text-dark-700 uppercase tracking-wide">{title}</h3>
        {required && <span className="text-xs text-red-500 font-medium">*Obavezno</span>}
      </div>
      <div className="p-5">
        {children}
      </div>
    </div>
  )
}

function FormField({ label, required, icon: Icon, children }: { label: string; required?: boolean; icon?: any; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-semibold text-dark-600 mb-2">
        {Icon && <Icon className="w-4 h-4 text-dark-400" />}
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}
