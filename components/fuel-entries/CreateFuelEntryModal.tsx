'use client'

import { useState, useEffect } from 'react'
import { formatDateInputValueSarajevo } from '@/lib/utils/date'
import {
  X,
  Plus,
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
  Users,
  Fuel
} from 'lucide-react'
import SearchableSelect from '@/components/ui/SearchableSelect'
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
  accreditationNumber?: string
  isActive: boolean
}

interface Client {
  id: string
  name: string
  code?: string
  pib?: string
  idNumber?: string
  isActive: boolean
}

interface Station {
  id: string
  name: string
  code: string
  address: string
  isActive: boolean
}

interface LookupItem {
  id: string
  name: string
  description?: string
  code?: string
  address?: string
  isActive: boolean
}

interface Props {
  warehouses: Warehouse[]
  stations: Station[]
  onClose: () => void
  onSuccess: () => void
}

export default function CreateFuelEntryModal({ warehouses, stations, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [transporters, setTransporters] = useState<Transporter[]>([])
  const [laboratories, setLaboratories] = useState<Laboratory[]>([])
  const [clients, setClients] = useState<Client[]>([])

  // Lookup data
  const [products, setProducts] = useState<LookupItem[]>([])
  const [countries, setCountries] = useState<LookupItem[]>([])
  const [pickupLocations, setPickupLocations] = useState<LookupItem[]>([])
  const [fuelCharacteristics, setFuelCharacteristics] = useState<LookupItem[]>([])

  // Form state - Basic
  const [entryDate, setEntryDate] = useState(formatDateInputValueSarajevo(new Date()))
  const [warehouseId, setWarehouseId] = useState('')
  const [productName, setProductName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [quantityError, setQuantityError] = useState('')

  // Max date for date inputs (30 days in future)
  const maxDate = formatDateInputValueSarajevo(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))

  // Date validation errors
  const [entryDateError, setEntryDateError] = useState('')
  const [deliveryNoteDateError, setDeliveryNoteDateError] = useState('')
  const [customsDeclarationDateError, setCustomsDeclarationDateError] = useState('')
  const [testReportDateError, setTestReportDateError] = useState('')

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
  const [clientId, setClientId] = useState('')
  const [stationId, setStationId] = useState('')

  // Form state - Certificate
  const [certificateSelection, setCertificateSelection] = useState<{
    type: 'new' | 'existing'
    file?: File
    path?: string
  } | null>(null)

  // Reset stationId when client changes and it's not HIFA-PETROL (code 650)
  useEffect(() => {
    const selectedClient = clients.find(c => c.id === clientId)
    if (selectedClient && selectedClient.code !== '650') {
      setStationId('')
    }
  }, [clientId, clients])

  useEffect(() => {
    fetchSuppliers()
    fetchTransporters()
    fetchLaboratories()
    fetchClients()
    fetchLookupData()

    // Set default warehouse
    if (warehouses.length === 1) {
      // If user has only one warehouse, select it by default
      setWarehouseId(warehouses[0].id)
    } else if (warehouses.length > 1) {
      // If user has multiple warehouses, default to "TERMINAL TEŠANJ" (TR-004)
      const tesanjTerminal = warehouses.find(w => w.code === 'TR-004')
      if (tesanjTerminal) {
        setWarehouseId(tesanjTerminal.id)
      }
    }
  }, [warehouses])

  // Validate date - allow up to 30 days in the future
  const validateDate = (dateValue: string): string => {
    if (!dateValue) return ''

    const selectedDate = new Date(dateValue)
    const maxAllowedDate = new Date()
    maxAllowedDate.setDate(maxAllowedDate.getDate() + 30) // 30 days in future
    maxAllowedDate.setHours(23, 59, 59, 999) // End of day
    selectedDate.setHours(0, 0, 0, 0)

    if (selectedDate > maxAllowedDate) {
      return 'Nije moguće odabrati datum više od 30 dana u budućnosti.'
    }
    return ''
  }

  // Handle date changes with validation
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

  // Handle Enter key to move to next field
  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      const target = e.target as HTMLElement

      // Don't prevent default for textareas or if it's a button
      if (target.tagName === 'TEXTAREA' || target.tagName === 'BUTTON') {
        return
      }

      e.preventDefault()

      // Find all focusable elements
      const form = e.currentTarget
      const focusableElements = form.querySelectorAll(
        'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])'
      )
      const focusableArray = Array.from(focusableElements) as HTMLElement[]
      const currentIndex = focusableArray.indexOf(target)

      // Move to next focusable element
      if (currentIndex > -1 && currentIndex < focusableArray.length - 1) {
        focusableArray[currentIndex + 1].focus()
      }
    }
  }

  const fetchLookupData = async () => {
    try {
      const [productsRes, countriesRes, locationsRes, characteristicsRes] = await Promise.all([
        fetch('/api/lookups?type=products&pageSize=1000'),
        fetch('/api/lookups?type=countries&pageSize=1000'),
        fetch('/api/lookups?type=pickupLocations&pageSize=1000'),
        fetch('/api/lookups?type=fuelCharacteristics&pageSize=1000')
      ])

      const [productsData, countriesData, locationsData, characteristicsData] = await Promise.all([
        productsRes.json(),
        countriesRes.json(),
        locationsRes.json(),
        characteristicsRes.json()
      ])

      if (productsData.success) setProducts(productsData.data.data || productsData.data)
      if (countriesData.success) setCountries(countriesData.data.data || countriesData.data)
      if (locationsData.success) setPickupLocations(locationsData.data.data || locationsData.data)
      if (characteristicsData.success) setFuelCharacteristics(characteristicsData.data.data || characteristicsData.data)
    } catch (error) {
      console.error('Error fetching lookup data:', error)
    }
  }

  const fetchSuppliers = async () => {
    try {
      const res = await fetch('/api/suppliers?pageSize=1000')
      const data = await res.json()
      if (data.success) {
        setSuppliers(data.data.data || data.data)
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    }
  }

  const fetchTransporters = async () => {
    try {
      const res = await fetch('/api/transporters?pageSize=1000')
      const data = await res.json()
      if (data.success) {
        setTransporters(data.data.data || data.data)
      }
    } catch (error) {
      console.error('Error fetching transporters:', error)
    }
  }

  const fetchLaboratories = async () => {
    try {
      const res = await fetch('/api/laboratories?pageSize=1000')
      const data = await res.json()
      if (data.success) {
        setLaboratories(data.data.data || data.data)
      }
    } catch (error) {
      console.error('Error fetching laboratories:', error)
    }
  }

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients?pageSize=1000')
      const data = await res.json()
      if (data.success) {
        const clientsList = data.data.data || data.data
        setClients(clientsList)

        // Auto-select HIFA-PETROL client (code: 650) by default
        const hifaPetrolClient = clientsList.find((c: any) => c.code === '650')
        if (hifaPetrolClient) {
          setClientId(hifaPetrolClient.id)
        }
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  const handleCharacteristicToggle = (char: string) => {
    setImprovedCharacteristics(prev => {
      const isCurrentlySelected = prev.includes(char)

      if (isCurrentlySelected) {
        // Remove from characteristics and details
        setAdditiveDetails(prevDetails => {
          const newDetails = { ...prevDetails }
          delete newDetails[char]
          return newDetails
        })
        return prev.filter(c => c !== char)
      } else {
        // Add to characteristics and initialize details
        setAdditiveDetails(prevDetails => ({
          ...prevDetails,
          [char]: { addedAt: '', quantity: '' }
        }))
        return [...prev, char]
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check for date validation errors
    if (entryDateError || deliveryNoteDateError || customsDeclarationDateError || testReportDateError) {
      alert('Molimo ispravite greške u datumima prije slanja')
      return
    }

    if (!warehouseId || !productName || !quantity) {
      alert('Molimo popunite sva obavezna polja')
      return
    }

    // Validate quantity
    const numQuantity = parseInt(quantity)
    if (numQuantity > 50000) {
      alert('Količina ne može biti veća od 50,000 litara')
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
      if (laboratoryId) {
        const selectedLab = laboratories.find(l => l.id === laboratoryId)
        if (selectedLab) {
          formData.append('laboratoryId', laboratoryId)
          formData.append('laboratoryName', selectedLab.name)
          if (selectedLab.accreditationNumber) {
            formData.append('labAccreditationNumber', selectedLab.accreditationNumber)
          }
        }
      }
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

      // Send additive details as JSON
      if (Object.keys(additiveDetails).length > 0) {
        const additiveDetailsArray = Object.entries(additiveDetails).map(([name, details]) => ({
          name,
          addedAt: details.addedAt || null,
          quantity: details.quantity ? parseFloat(details.quantity) : null
        }))
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

      const res = await fetch('/api/fuel-entries', {
        method: 'POST',
        body: formData
      })

      const data = await res.json()

      if (data.success) {
        alert(`Prijava uspješno kreirana! Registarski broj: ${data.data.registrationNumber}`)
        onSuccess()
      } else {
        alert(data.error || 'Greška pri kreiranju prijave')
      }
    } catch (error) {
      alert('Greška pri kreiranju prijave')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-[var(--shadow-soft-xl)] max-w-4xl w-full my-8 relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-100 rounded-full blur-3xl opacity-30 -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-40 -ml-32 -mb-32"></div>

        {/* Header */}
        <div className="relative z-10 px-8 py-6 border-b border-dark-100">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center shadow-[var(--shadow-soft-lg)]">
                <Plus className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-dark-900">Nova prijava ulaza goriva</h2>
                <p className="text-dark-500 mt-1">Popunite podatke o prijavi ulaza goriva u skladište</p>
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
        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="relative z-10 px-8 py-6 max-h-[65vh] overflow-y-auto pb-64">
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
                {entryDateError && (
                  <p className="text-red-500 text-sm mt-1">{entryDateError}</p>
                )}
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
                  emptyMessage="Nema dostupnih skladišta"
                />
              </FormField>
              <FormField label="Naziv proizvoda" required icon={FileText}>
                <SearchableSelect
                  options={products.map(p => ({
                    id: p.name,
                    label: p.name,
                    sublabel: p.description || undefined
                  }))}
                  value={productName}
                  onChange={setProductName}
                  placeholder="Odaberite proizvod"
                  emptyMessage="Nema dostupnih proizvoda"
                />
              </FormField>
              <FormField label="Količina (litara)" required icon={Droplets}>
                <div>
                  <input
                    type="text"
                    value={quantity}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '')
                      const numValue = parseInt(value || '0')

                      if (numValue > 50000) {
                        setQuantityError('Količina ne može biti veća od 50,000 litara')
                        setQuantity(value)
                      } else {
                        setQuantityError('')
                        setQuantity(value)
                      }
                    }}
                    className={`input w-full ${quantityError ? 'border-error focus:ring-error' : ''}`}
                    placeholder="npr. 50000"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    required
                  />
                  {quantityError && (
                    <p className="text-error text-xs mt-1.5 flex items-center gap-1">
                      <span className="font-semibold">⚠</span>
                      {quantityError}
                    </p>
                  )}
                </div>
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
                  onChange={(e) => handleDeliveryNoteDateChange(e.target.value)}
                  max={maxDate}
                  className={`input w-full ${deliveryNoteDateError ? 'border-red-500 border-2' : ''}`}
                />
                {deliveryNoteDateError && (
                  <p className="text-red-500 text-sm mt-1">{deliveryNoteDateError}</p>
                )}
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
                  onChange={(e) => handleCustomsDeclarationDateChange(e.target.value)}
                  max={maxDate}
                  className={`input w-full ${customsDeclarationDateError ? 'border-red-500 border-2' : ''}`}
                />
                {customsDeclarationDateError && (
                  <p className="text-red-500 text-sm mt-1">{customsDeclarationDateError}</p>
                )}
              </FormField>
              <FormField label="Zemlja porijekla" icon={Globe}>
                <select
                  value={countryOfOrigin}
                  onChange={(e) => setCountryOfOrigin(e.target.value)}
                  className="input w-full"
                >
                  <option value="">Odaberite zemlju</option>
                  {countries.map(c => (
                    <option key={c.id} value={c.name}>{c.name}{c.code ? ` (${c.code})` : ''}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Lokacija preuzimanja" icon={MapPin}>
                <select
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  className="input w-full"
                >
                  <option value="">Odaberite lokaciju</option>
                  {pickupLocations.map(l => (
                    <option key={l.id} value={l.name}>{l.name}</option>
                  ))}
                </select>
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
                {fuelCharacteristics.length === 0 ? (
                  <p className="text-sm text-dark-500">Nema definiranih karakteristika. Dodajte ih u Master Podacima.</p>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      {fuelCharacteristics.map(char => (
                        <label
                          key={char.id}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                            improvedCharacteristics.includes(char.name)
                              ? 'bg-primary-50 border-primary-200 text-primary-700'
                              : 'bg-dark-50 border-dark-100 text-dark-700 hover:border-primary-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={improvedCharacteristics.includes(char.name)}
                            onChange={() => handleCharacteristicToggle(char.name)}
                            className="w-4 h-4 rounded border-dark-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="text-sm font-medium">{char.name}</span>
                        </label>
                      ))}
                    </div>

                    {/* Additive Details for Selected Characteristics */}
                    {improvedCharacteristics.length > 0 && (
                      <div className="space-y-4 pt-4 border-t border-dark-200">
                        <p className="text-xs font-semibold text-dark-600 uppercase tracking-wide">Detalji o aditivima</p>
                        {improvedCharacteristics.map(charName => (
                          <div key={charName} className="bg-white p-4 rounded-xl border border-dark-200">
                            <p className="text-sm font-semibold text-dark-900 mb-3">{charName}</p>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-dark-500 uppercase tracking-wide mb-2">
                                  Datum i vrijeme aditiviranja
                                </label>
                                <input
                                  type="datetime-local"
                                  value={additiveDetails[charName]?.addedAt || ''}
                                  onChange={(e) => setAdditiveDetails(prev => ({
                                    ...prev,
                                    [charName]: { ...prev[charName], addedAt: e.target.value }
                                  }))}
                                  className="input w-full text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-dark-500 uppercase tracking-wide mb-2">
                                  Količina (mg/kg)
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="npr. 250.50"
                                  value={additiveDetails[charName]?.quantity || ''}
                                  onChange={(e) => setAdditiveDetails(prev => ({
                                    ...prev,
                                    [charName]: { ...prev[charName], quantity: e.target.value }
                                  }))}
                                  className="input w-full text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
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
                    sublabel: l.accreditationNumber ? `Akreditacija: ${l.accreditationNumber}` : undefined
                  }))}
                  value={laboratoryId}
                  onChange={setLaboratoryId}
                  placeholder="Odaberite laboratoriju"
                  emptyMessage="Nema dostupnih laboratorija"
                />
                {laboratoryId && (
                  <div className="mt-2 p-3 bg-dark-50 rounded-xl text-sm">
                    <p className="text-dark-600 mb-1">
                      <span className="font-semibold">Naziv:</span> {laboratories.find(l => l.id === laboratoryId)?.name}
                    </p>
                    {laboratories.find(l => l.id === laboratoryId)?.accreditationNumber && (
                      <p className="text-dark-600">
                        <span className="font-semibold">Akreditacija:</span> {laboratories.find(l => l.id === laboratoryId)?.accreditationNumber}
                      </p>
                    )}
                  </div>
                )}
              </FormField>
              <div className="space-y-4">
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
                    onChange={(e) => handleTestReportDateChange(e.target.value)}
                    max={maxDate}
                    className={`input w-full ${testReportDateError ? 'border-red-500 border-2' : ''}`}
                  />
                  {testReportDateError && (
                    <p className="text-red-500 text-sm mt-1">{testReportDateError}</p>
                  )}
                </FormField>
              </div>
            </div>
          </FormSection>

          {/* Client Information */}
          <FormSection title="Informacije o klijentu" icon={Users}>
            <FormField label="Odaberite klijenta (firmu)" icon={Users}>
              <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">ℹ️ Napomena:</span> Ukoliko je roba za drugog klijenta, potrebno odabrati iz padajućeg menija.
                </p>
              </div>
              <SearchableSelect
                options={clients.filter(c => c.isActive).map(c => ({
                  id: c.id,
                  label: c.name,
                  sublabel: [c.code && `Šifra: ${c.code}`, c.pib && `PIB: ${c.pib}`].filter(Boolean).join(' | ') || undefined
                }))}
                value={clientId}
                onChange={setClientId}
                placeholder="Odaberite klijenta"
                emptyMessage="Nema dostupnih klijenata"
              />
              {clientId && (
                <div className="mt-2 p-3 bg-dark-50 rounded-xl text-sm space-y-1">
                  <p className="text-dark-600">
                    <span className="font-semibold">Naziv:</span> {clients.find(c => c.id === clientId)?.name}
                  </p>
                  {clients.find(c => c.id === clientId)?.code && (
                    <p className="text-dark-600">
                      <span className="font-semibold">Šifra:</span> {clients.find(c => c.id === clientId)?.code}
                    </p>
                  )}
                  {clients.find(c => c.id === clientId)?.pib && (
                    <p className="text-dark-600">
                      <span className="font-semibold">PIB:</span> {clients.find(c => c.id === clientId)?.pib}
                    </p>
                  )}
                  {clients.find(c => c.id === clientId)?.idNumber && (
                    <p className="text-dark-600">
                      <span className="font-semibold">ID broj:</span> {clients.find(c => c.id === clientId)?.idNumber}
                    </p>
                  )}
                </div>
              )}
            </FormField>
          </FormSection>

          {/* Station Information - Only shown for HIFA-PETROL client (code: 650) */}
          {clients.find(c => c.id === clientId)?.code === '650' && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 shadow-sm">
              <FormSection title="Poslovnica (benzinska pumpa)" icon={Fuel}>
                <FormField label="Odaberite poslovnicu" icon={Fuel}>
                <SearchableSelect
                  options={stations.filter(s => s.isActive).map(s => ({
                    id: s.id,
                    label: s.name,
                    sublabel: [s.code && `Šifra: ${s.code}`, s.address && `Adresa: ${s.address}`].filter(Boolean).join(' | ') || undefined
                  }))}
                  value={stationId}
                  onChange={setStationId}
                  placeholder="Odaberite poslovnicu"
                  emptyMessage="Nema dostupnih poslovnica"
                />
                {stationId && (
                  <div className="mt-2 p-3 bg-dark-50 rounded-xl text-sm space-y-1">
                    <p className="text-dark-600">
                      <span className="font-semibold">Naziv:</span> {stations.find(s => s.id === stationId)?.name}
                    </p>
                    {stations.find(s => s.id === stationId)?.code && (
                      <p className="text-dark-600">
                        <span className="font-semibold">Šifra:</span> {stations.find(s => s.id === stationId)?.code}
                      </p>
                    )}
                    {stations.find(s => s.id === stationId)?.address && (
                      <p className="text-dark-600">
                        <span className="font-semibold">Adresa:</span> {stations.find(s => s.id === stationId)?.address}
                      </p>
                    )}
                  </div>
                )}
              </FormField>
            </FormSection>
            </div>
          )}

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
                <SearchableSelect
                  options={suppliers.filter(s => s.isActive).map(s => ({
                    id: s.id,
                    label: s.name,
                    sublabel: `Šifra: ${s.code}`
                  }))}
                  value={supplierId}
                  onChange={setSupplierId}
                  placeholder="Odaberite dobavljača"
                  emptyMessage="Nema dostupnih dobavljača"
                />
              </FormField>
              <FormField label="Prevoznik" icon={Truck}>
                <SearchableSelect
                  options={transporters.filter(t => t.isActive).map(t => ({
                    id: t.id,
                    label: t.name,
                    sublabel: `Šifra: ${t.code}`
                  }))}
                  value={transporterId}
                  onChange={setTransporterId}
                  placeholder="Odaberite prevoznika"
                  emptyMessage="Nema dostupnih prevoznika"
                />
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
              <FormField label="Registarska oznaka vozila" icon={Truck}>
                <input
                  type="text"
                  value={vehicleRegistration}
                  onChange={(e) => setVehicleRegistration(e.target.value.toUpperCase())}
                  className="input w-full"
                  placeholder="npr. AA-123-BB"
                />
              </FormField>
            </div>
          </FormSection>

          {/* Certificate Upload */}
          <FormSection title="Certifikat / Izvještaj" icon={Upload}>
            <CertificateSelector
              value={certificateSelection}
              onChange={setCertificateSelection}
            />
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
              className="px-6 py-3 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white font-semibold rounded-2xl hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-[var(--shadow-soft)] transition-all"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Kreiranje...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Kreiraj prijavu
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
