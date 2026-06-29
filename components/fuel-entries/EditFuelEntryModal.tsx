'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatDateInputValueSarajevo } from '@/lib/utils/date'
import { getCertificateDownloadUrl } from '@/lib/utils/certificate-url'
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
  Save,
  Users,
  Fuel
} from 'lucide-react'
import SearchableSelect from '@/components/ui/SearchableSelect'
import AsyncSearchableSelect from '@/components/ui/AsyncSearchableSelect'
import CertificateSelector from '@/components/ui/CertificateSelector'

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

interface Laboratory {
  id: string
  name: string
  accreditationNumber: string | null
  isActive: boolean
}

interface Station {
  id: string
  name: string
  code: string
  address: string | null
  isActive: boolean
}

interface Client {
  id: string
  name: string
  code: string | null
  pib: string | null
  idNumber: string | null
  isActive: boolean
}

interface LookupItem {
  id: string
  category: string
  value: string
  isActive: boolean
}

interface FuelEntry {
  id: string
  registrationNumber: number
  declarationNumber?: string | null
  entryDate: string
  productName: string
  quantity: number
  deliveryNoteNumber: string | null
  deliveryNoteDate: string | null
  customsDeclarationNumber?: string | null
  customsDeclarationDate?: string | null
  isHigherQuality: boolean
  improvedCharacteristics?: string[]
  additiveDetails?: any
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
  vehicleRegistration?: string | null
  clientId?: string | null
  laboratoryId?: string | null
  stationId?: string | null
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
  const [laboratories, setLaboratories] = useState<Laboratory[]>([])
  const [stations, setStations] = useState<Station[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [fullEntry, setFullEntry] = useState<any>(null)

  // Lookup data
  const [products, setProducts] = useState<LookupItem[]>([])
  const [countries, setCountries] = useState<LookupItem[]>([])
  const [pickupLocations, setPickupLocations] = useState<LookupItem[]>([])
  const [fuelCharacteristics, setFuelCharacteristics] = useState<LookupItem[]>([])

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
  const [additiveDetails, setAdditiveDetails] = useState<Record<string, { addedAt: string; quantity: string }>>({})
  const [countryOfOrigin, setCountryOfOrigin] = useState('')

  // Form state - Laboratory
  const [laboratoryId, setLaboratoryId] = useState('')
  const [testReportNumber, setTestReportNumber] = useState('')
  const [testReportDate, setTestReportDate] = useState('')

  // Form state - Supplier & Transport
  const [orderOpenedBy, setOrderOpenedBy] = useState('')
  const [pickupLocation, setPickupLocation] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [transporterId, setTransporterId] = useState('')
  const [driverName, setDriverName] = useState('')
  const [vehicleRegistration, setVehicleRegistration] = useState('')

  // Form state - Client & Station
  const [clientId, setClientId] = useState('')
  const [stationId, setStationId] = useState('')

  // Form state - Certificate
  const [certificateSelection, setCertificateSelection] = useState<{
    type: 'new' | 'existing'
    file?: File
    path?: string
  } | null>(null)

  // Max date for date inputs (30 days in future)
  const maxDate = formatDateInputValueSarajevo(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))

  // Date validation errors
  const [entryDateError, setEntryDateError] = useState('')
  const [deliveryNoteDateError, setDeliveryNoteDateError] = useState('')
  const [customsDeclarationDateError, setCustomsDeclarationDateError] = useState('')
  const [testReportDateError, setTestReportDateError] = useState('')

  // Reset stationId when client changes and it's not HIFA-PETROL (code 650)
  useEffect(() => {
    if (selectedClient && selectedClient.code !== '650') {
      setStationId('')
    }
  }, [selectedClient])

  useEffect(() => {
    fetchData()
  }, [entry.id])

  const fetchData = async () => {
    setLoadingData(true)
    try {
      const [entryRes, warehousesRes, suppliersRes, transportersRes, laboratoriesRes, stationsRes, lookupsRes] = await Promise.all([
        fetch(`/api/fuel-entries/${entry.id}`),
        fetch('/api/warehouses'),
        fetch('/api/suppliers?pageSize=1000'),
        fetch('/api/transporters?pageSize=1000'),
        fetch('/api/laboratories?pageSize=1000'),
        fetch('/api/stations?pageSize=1000'),
        fetch('/api/lookups?pageSize=1000')
      ])

      const [entryData, warehousesData, suppliersData, transportersData, laboratoriesData, stationsData, lookupsData] = await Promise.all([
        entryRes.json(),
        warehousesRes.json(),
        suppliersRes.json(),
        transportersRes.json(),
        laboratoriesRes.json(),
        stationsRes.json(),
        lookupsRes.json()
      ])

      if (warehousesData.success) setWarehouses(warehousesData.data)
      if (suppliersData.success) setSuppliers(suppliersData.data.data || suppliersData.data)
      if (transportersData.success) setTransporters(transportersData.data.data || transportersData.data)
      if (laboratoriesData.success) setLaboratories(laboratoriesData.data.data || laboratoriesData.data)
      if (stationsData.success) setStations(stationsData.data.data || stationsData.data)

      if (lookupsData.success) {
        const lookups = lookupsData.data.data || lookupsData.data
        setProducts(lookups.filter((l: LookupItem) => l.category === 'product' && l.isActive))
        setCountries(lookups.filter((l: LookupItem) => l.category === 'country' && l.isActive))
        setPickupLocations(lookups.filter((l: LookupItem) => l.category === 'pickup_location' && l.isActive))
        setFuelCharacteristics(lookups.filter((l: LookupItem) => l.category === 'fuel_characteristic' && l.isActive))
      }

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
        setLaboratoryId(e.laboratory?.id || e.laboratoryId || '')
        setTestReportNumber(e.testReportNumber || '')
        setTestReportDate(e.testReportDate ? formatDateInputValueSarajevo(e.testReportDate) : '')
        setOrderOpenedBy(e.orderOpenedBy || '')
        setPickupLocation(e.pickupLocation || '')
        setSupplierId(e.supplier?.id || '')
        setTransporterId(e.transporter?.id || '')
        setDriverName(e.driverName || '')
        setVehicleRegistration(e.vehicleRegistration || '')
        setClientId(e.client?.id || e.clientId || '')
        setStationId(e.station?.id || e.stationId || '')

        // Load client details if exists
        if (e.client) {
          setSelectedClient(e.client)
        } else if (e.clientId) {
          fetch(`/api/clients/${e.clientId}`)
            .then(res => res.json())
            .then(data => {
              if (data.success) setSelectedClient(data.data)
            })
            .catch(console.error)
        }

        // Parse additive details
        if (e.additiveDetails && Array.isArray(e.additiveDetails)) {
          const details: Record<string, { addedAt: string; quantity: string }> = {}
          e.additiveDetails.forEach((detail: any) => {
            if (detail.name) {
              details[detail.name] = {
                addedAt: detail.addedAt || '',
                quantity: detail.quantity || ''
              }
            }
          })
          setAdditiveDetails(details)
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  // Async search for clients
  const fetchClientsAsync = useCallback(async (search: string) => {
    try {
      const res = await fetch(`/api/clients?search=${encodeURIComponent(search)}&pageSize=50`)
      const data = await res.json()
      if (data.success) {
        const clientsList = data.data.data || data.data
        return clientsList.filter((c: Client) => c.isActive).map((c: Client) => ({
          id: c.id,
          label: c.name,
          sublabel: c.code || undefined
        }))
      }
      return []
    } catch (error) {
      console.error('Error fetching clients:', error)
      return []
    }
  }, [])

  const handleCharacteristicToggle = (char: string) => {
    setImprovedCharacteristics(prev => {
      const isCurrentlySelected = prev.includes(char)

      if (isCurrentlySelected) {
        setAdditiveDetails(prevDetails => {
          const newDetails = { ...prevDetails }
          delete newDetails[char]
          return newDetails
        })
        return prev.filter(c => c !== char)
      } else {
        return [...prev, char]
      }
    })
  }

  const handleAdditiveDetailChange = (char: string, field: 'addedAt' | 'quantity', value: string) => {
    setAdditiveDetails(prev => ({
      ...prev,
      [char]: {
        ...prev[char],
        [field]: value
      }
    }))
  }

  // Validate date - allow up to 30 days in the future
  const validateDate = (dateValue: string): string => {
    if (!dateValue) return ''

    const selectedDate = new Date(dateValue)
    const maxAllowedDate = new Date()
    maxAllowedDate.setDate(maxAllowedDate.getDate() + 30)
    maxAllowedDate.setHours(23, 59, 59, 999)
    selectedDate.setHours(0, 0, 0, 0)

    if (selectedDate > maxAllowedDate) {
      return 'Nije moguće odabrati datum više od 30 dana u budućnosti.'
    }
    return ''
  }

  const handleEntryDateChange = (value: string) => {
    setEntryDate(value)
    setEntryDateError(validateDate(value))
  }

  const handleDeliveryNoteDateChange = (value: string) => {
    setDeliveryNoteDate(value)
    setDeliveryNoteDateError(validateDate(value))
  }

  const handleCustomsDeclarationDateChange = (value: string) => {
    setCustomsDeclarationDate(value)
    setCustomsDeclarationDateError(validateDate(value))
  }

  const handleTestReportDateChange = (value: string) => {
    setTestReportDate(value)
    setTestReportDateError(validateDate(value))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (entryDateError || deliveryNoteDateError || customsDeclarationDateError || testReportDateError) {
      alert('Molimo ispravite greške u datumima prije slanja')
      return
    }

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
      if (laboratoryId) formData.append('laboratoryId', laboratoryId)
      if (testReportNumber) formData.append('testReportNumber', testReportNumber)
      if (testReportDate) formData.append('testReportDate', testReportDate)
      if (orderOpenedBy) formData.append('orderOpenedBy', orderOpenedBy)
      if (pickupLocation) formData.append('pickupLocation', pickupLocation)
      if (supplierId) formData.append('supplierId', supplierId)
      if (transporterId) formData.append('transporterId', transporterId)
      if (driverName) formData.append('driverName', driverName)
      if (vehicleRegistration) formData.append('vehicleRegistration', vehicleRegistration)
      if (clientId) formData.append('clientId', clientId)
      if (stationId) formData.append('stationId', stationId)

      improvedCharacteristics.forEach(char => {
        formData.append('improvedCharacteristics[]', char)
      })

      // Build additive details array
      const additiveDetailsArray = improvedCharacteristics
        .filter(char => additiveDetails[char]?.addedAt || additiveDetails[char]?.quantity)
        .map(char => ({
          name: char,
          addedAt: additiveDetails[char]?.addedAt || '',
          quantity: additiveDetails[char]?.quantity || ''
        }))

      if (additiveDetailsArray.length > 0) {
        formData.append('additiveDetails', JSON.stringify(additiveDetailsArray))
      }

      // Handle certificate selection
      if (certificateSelection) {
        if (certificateSelection.type === 'new' && certificateSelection.file) {
          formData.append('certificate', certificateSelection.file)
        } else if (certificateSelection.type === 'existing' && certificateSelection.path) {
          formData.append('existingCertificatePath', certificateSelection.path)
        }
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

  const characteristicOptions = fuelCharacteristics.length > 0
    ? fuelCharacteristics.map(fc => fc.value)
    : [
      'Niža gustina',
      'Niža viskoznost',
      'Niži sadržaj sumpora',
      'Viša cetanska vrijednost',
      'Bolji indeks viskoznosti',
      'Niža tačka tečenja'
    ]

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
                  Uredi izjavu {fullEntry?.declarationNumber || `#${entry.registrationNumber}`}
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
        <form onSubmit={handleSubmit} className="relative z-10 px-8 py-6 max-h-[65vh] overflow-y-auto pb-64">
          {/* Basic Information */}
          <FormSection title="Osnovne informacije" icon={Droplets} required>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Datum ulaza" required icon={Calendar}>
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => handleEntryDateChange(e.target.value)}
                  max={maxDate}
                  className={`input w-full ${entryDateError ? 'border-red-500 border-2' : ''}`}
                  required
                />
                {entryDateError && <p className="text-red-500 text-sm mt-1">{entryDateError}</p>}
              </FormField>
              <FormField label="Skladište" required icon={Building2}>
                <SearchableSelect
                  options={warehouses.filter(w => w.isActive).map(w => ({
                    id: w.id,
                    label: w.name,
                    sublabel: `Šifra: ${w.code}`
                  }))}
                  value={warehouseId}
                  onChange={setWarehouseId}
                  placeholder="Odaberite skladište"
                />
              </FormField>
              <FormField label="Naziv proizvoda" required icon={FileText}>
                <SearchableSelect
                  options={products.map(p => ({ id: p.value, label: p.value }))}
                  value={productName}
                  onChange={setProductName}
                  placeholder="Odaberite proizvod"
                />
              </FormField>
              <FormField label="Količina (litara)" required icon={Droplets}>
                <input
                  type="text"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value.replace(/[^0-9]/g, ''))}
                  className="input w-full"
                  inputMode="numeric"
                  required
                />
              </FormField>
            </div>
          </FormSection>

          {/* Delivery Information */}
          <FormSection title="Informacije o isporuci" icon={Truck}>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Broj otpremnice" icon={FileText}>
                <input type="text" value={deliveryNoteNumber} onChange={(e) => setDeliveryNoteNumber(e.target.value)} className="input w-full" />
              </FormField>
              <FormField label="Datum otpremnice" icon={Calendar}>
                <input type="date" value={deliveryNoteDate} onChange={(e) => handleDeliveryNoteDateChange(e.target.value)} max={maxDate} className={`input w-full ${deliveryNoteDateError ? 'border-red-500 border-2' : ''}`} />
                {deliveryNoteDateError && <p className="text-red-500 text-sm mt-1">{deliveryNoteDateError}</p>}
              </FormField>
              <FormField label="Broj carinske deklaracije" icon={FileCheck}>
                <input type="text" value={customsDeclarationNumber} onChange={(e) => setCustomsDeclarationNumber(e.target.value)} className="input w-full" />
              </FormField>
              <FormField label="Datum carinske deklaracije" icon={Calendar}>
                <input type="date" value={customsDeclarationDate} onChange={(e) => handleCustomsDeclarationDateChange(e.target.value)} max={maxDate} className={`input w-full ${customsDeclarationDateError ? 'border-red-500 border-2' : ''}`} />
                {customsDeclarationDateError && <p className="text-red-500 text-sm mt-1">{customsDeclarationDateError}</p>}
              </FormField>
              <FormField label="Zemlja porijekla" icon={Globe}>
                <SearchableSelect
                  options={countries.map(c => ({ id: c.value, label: c.value }))}
                  value={countryOfOrigin}
                  onChange={setCountryOfOrigin}
                  placeholder="Odaberite zemlju"
                />
              </FormField>
              <FormField label="Lokacija preuzimanja" icon={MapPin}>
                <SearchableSelect
                  options={pickupLocations.map(l => ({ id: l.value, label: l.value }))}
                  value={pickupLocation}
                  onChange={setPickupLocation}
                  placeholder="Odaberite lokaciju"
                />
              </FormField>
            </div>
          </FormSection>

          {/* Quality Information */}
          <FormSection title="Informacije o kvaliteti" icon={CheckCircle}>
            <div className="mb-4">
              <label className="flex items-center gap-3 p-4 rounded-2xl bg-dark-50 border border-dark-100 hover:border-primary-200 hover:bg-primary-50/30 transition-all cursor-pointer">
                <input type="checkbox" checked={isHigherQuality} onChange={(e) => setIsHigherQuality(e.target.checked)} className="w-5 h-5 rounded-lg border-dark-300 text-primary-600 focus:ring-primary-500" />
                <span className="text-sm font-medium text-dark-900">Gorivo više kvalitete</span>
              </label>
            </div>
            {isHigherQuality && (
              <div>
                <p className="text-xs font-semibold text-dark-400 uppercase tracking-wide mb-3">Poboljšane karakteristike (sa detaljima o aditivima)</p>
                <div className="space-y-3">
                  {characteristicOptions.map(char => (
                    <div key={char} className={`rounded-xl border transition-all ${improvedCharacteristics.includes(char) ? 'bg-primary-50 border-primary-200' : 'bg-dark-50 border-dark-100'}`}>
                      <label className="flex items-center gap-3 p-3 cursor-pointer">
                        <input type="checkbox" checked={improvedCharacteristics.includes(char)} onChange={() => handleCharacteristicToggle(char)} className="w-4 h-4 rounded border-dark-300 text-primary-600 focus:ring-primary-500" />
                        <span className="text-sm font-medium text-dark-700">{char}</span>
                      </label>
                      {improvedCharacteristics.includes(char) && (
                        <div className="px-3 pb-3 grid grid-cols-2 gap-2">
                          <input type="text" placeholder="Gdje je dodano" value={additiveDetails[char]?.addedAt || ''} onChange={(e) => handleAdditiveDetailChange(char, 'addedAt', e.target.value)} className="input text-sm" />
                          <input type="text" placeholder="Količina (ppm)" value={additiveDetails[char]?.quantity || ''} onChange={(e) => handleAdditiveDetailChange(char, 'quantity', e.target.value)} className="input text-sm" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </FormSection>

          {/* Laboratory Information */}
          <FormSection title="Laboratorijske informacije" icon={FlaskConical}>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Odaberite laboratoriju" icon={FlaskConical}>
                <SearchableSelect
                  options={laboratories.filter(l => l.isActive).map(l => ({
                    id: l.id,
                    label: l.name,
                    sublabel: l.accreditationNumber ? `Akr: ${l.accreditationNumber}` : undefined
                  }))}
                  value={laboratoryId}
                  onChange={setLaboratoryId}
                  placeholder="Odaberite laboratoriju"
                />
              </FormField>
              <FormField label="Broj izvještaja" icon={FileText}>
                <input type="text" value={testReportNumber} onChange={(e) => setTestReportNumber(e.target.value)} className="input w-full" />
              </FormField>
              <FormField label="Datum izvještaja" icon={Calendar}>
                <input type="date" value={testReportDate} onChange={(e) => handleTestReportDateChange(e.target.value)} max={maxDate} className={`input w-full ${testReportDateError ? 'border-red-500 border-2' : ''}`} />
                {testReportDateError && <p className="text-red-500 text-sm mt-1">{testReportDateError}</p>}
              </FormField>
            </div>
          </FormSection>

          {/* Client Information */}
          <FormSection title="Informacije o klijentu" icon={Users}>
            <FormField label="Odaberite klijenta (firmu)" icon={Users}>
              <AsyncSearchableSelect
                fetchOptions={fetchClientsAsync}
                value={clientId}
                onChange={(id) => {
                  setClientId(id)
                  if (id) {
                    fetch(`/api/clients/${id}`)
                      .then(res => res.json())
                      .then(data => { if (data.success) setSelectedClient(data.data) })
                      .catch(console.error)
                  } else {
                    setSelectedClient(null)
                  }
                }}
                placeholder="Pretražite klijenta po imenu ili šifri..."
                selectedOption={selectedClient ? { id: selectedClient.id, label: selectedClient.name, sublabel: selectedClient.code || undefined } : null}
              />
              {selectedClient && (
                <div className="mt-2 p-3 bg-dark-50 rounded-xl text-sm space-y-1">
                  <p className="text-dark-600"><span className="font-semibold">Naziv:</span> {selectedClient.name}</p>
                  {selectedClient.code && <p className="text-dark-600"><span className="font-semibold">Šifra:</span> {selectedClient.code}</p>}
                  {selectedClient.pib && <p className="text-dark-600"><span className="font-semibold">PIB:</span> {selectedClient.pib}</p>}
                </div>
              )}
            </FormField>
          </FormSection>

          {/* Station Information - Only for HIFA-PETROL */}
          {selectedClient?.code === '650' && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 shadow-sm mb-6">
              <FormSection title="Poslovnica (benzinska pumpa)" icon={Fuel}>
                <FormField label="Odaberite poslovnicu" icon={Fuel}>
                  <SearchableSelect
                    options={stations.filter(s => s.isActive).map(s => ({
                      id: s.id,
                      label: s.name,
                      sublabel: [s.code && `Šifra: ${s.code}`, s.address].filter(Boolean).join(' | ') || undefined
                    }))}
                    value={stationId}
                    onChange={setStationId}
                    placeholder="Odaberite poslovnicu"
                  />
                </FormField>
              </FormSection>
            </div>
          )}

          {/* Supplier & Transporter */}
          <FormSection title="Dobavljač i prevoznik" icon={Truck}>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Narudžbu otvorio" icon={User}>
                <input type="text" value={orderOpenedBy} onChange={(e) => setOrderOpenedBy(e.target.value)} className="input w-full" placeholder="Ime i prezime" />
              </FormField>
              <FormField label="Dobavljač" icon={Building2}>
                <SearchableSelect
                  options={suppliers.filter(s => s.isActive).map(s => ({ id: s.id, label: s.name, sublabel: `Šifra: ${s.code}` }))}
                  value={supplierId}
                  onChange={setSupplierId}
                  placeholder="Odaberite dobavljača"
                />
              </FormField>
              <FormField label="Prevoznik" icon={Truck}>
                <SearchableSelect
                  options={transporters.filter(t => t.isActive).map(t => ({ id: t.id, label: t.name, sublabel: `Šifra: ${t.code}` }))}
                  value={transporterId}
                  onChange={setTransporterId}
                  placeholder="Odaberite prevoznika"
                />
              </FormField>
              <FormField label="Vozač" icon={User}>
                <input type="text" value={driverName} onChange={(e) => setDriverName(e.target.value)} className="input w-full" placeholder="Ime i prezime vozača" />
              </FormField>
              <FormField label="Registracija vozila" icon={Truck}>
                <input type="text" value={vehicleRegistration} onChange={(e) => setVehicleRegistration(e.target.value)} className="input w-full" placeholder="npr. A12-B-345" />
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
                  <a href={getCertificateDownloadUrl(fullEntry.certificatePath) || '#'} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Preuzmi
                  </a>
                </div>
              </div>
            )}
            <CertificateSelector value={certificateSelection} onChange={setCertificateSelection} existingCertificatePath={fullEntry?.certificatePath} />
          </FormSection>
        </form>

        {/* Footer */}
        <div className="relative z-10 px-8 py-6 border-t border-dark-100 bg-dark-50/50">
          <div className="flex justify-end gap-4">
            <button type="button" onClick={onClose} className="px-6 py-3 text-sm font-medium text-dark-600 bg-white border border-dark-200 rounded-2xl hover:bg-dark-50 transition-colors" disabled={loading}>
              Otkaži
            </button>
            <button onClick={handleSubmit} disabled={loading} className="px-6 py-3 bg-gradient-to-br from-amber-500 to-amber-600 text-white font-semibold rounded-2xl hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-[var(--shadow-soft)] transition-all">
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
      <div className="p-5">{children}</div>
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
