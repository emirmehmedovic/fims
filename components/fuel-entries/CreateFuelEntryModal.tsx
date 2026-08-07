'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { formatDateInputValueSarajevo } from '@/lib/utils/date'
import toast from 'react-hot-toast'
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
  Fuel,
  Download,
  AlertTriangle
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
  const { data: session } = useSession()
  const userRole = session?.user?.role
  const isPumpa = userRole === 'PUMPA'

  const [loading, setLoading] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [transporters, setTransporters] = useState<Transporter[]>([])
  const [laboratories, setLaboratories] = useState<Laboratory[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [selectedSupplierName, setSelectedSupplierName] = useState('')

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

  // Import from last entry state
  const [importedFromLast, setImportedFromLast] = useState(false)
  const [importingLastEntry, setImportingLastEntry] = useState(false)

  // Reset stationId when client changes and it's not HIFA-PETROL (code 650)
  useEffect(() => {
    if (selectedClient && selectedClient.code !== '650') {
      setStationId('')
    }
  }, [selectedClient])

  useEffect(() => {
    fetchSuppliers()
    fetchTransporters()
    fetchLaboratories()
    fetchLookupData()
    // Auto-select HIFA-PETROL client on load
    autoSelectHifaPetrol()

    // PUMPA-specific auto-selections
    if (isPumpa) {
      autoSelectHifaPetrolSupplier()
      autoSelectDefaultWarehouse()
    } else {
      // Set default warehouse for non-PUMPA users
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
    }
  }, [warehouses, isPumpa])

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

  // Auto-select HIFA-PETROL client on initial load
  const autoSelectHifaPetrol = async () => {
    try {
      const res = await fetch('/api/clients?search=650&pageSize=10')
      const data = await res.json()
      if (data.success) {
        const clientsList = data.data.data || data.data
        const hifaPetrolClient = clientsList.find((c: any) => c.code === '650')
        if (hifaPetrolClient) {
          setClientId(hifaPetrolClient.id)
          setSelectedClient(hifaPetrolClient)
        }
      }
    } catch (error) {
      console.error('Error auto-selecting HIFA-PETROL:', error)
    }
  }

  // Auto-select HIFA-PETROL supplier for PUMPA users
  const autoSelectHifaPetrolSupplier = async () => {
    try {
      const res = await fetch('/api/suppliers?search=650&pageSize=10')
      const data = await res.json()
      if (data.success) {
        const suppliersList = data.data.data || data.data
        const hifaPetrol = suppliersList.find((s: any) => s.code === '650')
        if (hifaPetrol) {
          setSupplierId(hifaPetrol.id)
          setSelectedSupplierName(`${hifaPetrol.name} (${hifaPetrol.code})`)
        }
      }
    } catch (error) {
      console.error('Error auto-selecting HIFA-PETROL supplier:', error)
    }
  }

  // Auto-select DEFAULT warehouse (DEF-001) for PUMPA users
  const autoSelectDefaultWarehouse = async () => {
    try {
      const res = await fetch('/api/warehouses?pageSize=1000')
      const data = await res.json()
      if (data.success) {
        const warehousesList = data.data.data || data.data
        const defaultWarehouse = warehousesList.find((w: any) => w.code === 'DEF-001')
        if (defaultWarehouse) {
          setWarehouseId(defaultWarehouse.id)
        }
      }
    } catch (error) {
      console.error('Error auto-selecting DEFAULT warehouse:', error)
    }
  }

  // Import data from last fuel entry created by this user
  const importFromLastEntry = async () => {
    setImportingLastEntry(true)
    try {
      const res = await fetch('/api/fuel-entries/last')
      const data = await res.json()

      if (!data.success) {
        toast.error('Nemate prethodnih prijava za uvoz')
        return
      }

      const entry = data.data

      // Import basic data
      if (entry.entryDate) setEntryDate(formatDateInputValueSarajevo(new Date(entry.entryDate)))
      if (entry.warehouseId && !isPumpa) setWarehouseId(entry.warehouseId)
      if (entry.productName) setProductName(entry.productName)
      // Don't import quantity - this often changes

      // Import delivery info with dates
      if (entry.deliveryNoteNumber) setDeliveryNoteNumber(entry.deliveryNoteNumber)
      if (entry.deliveryNoteDate) setDeliveryNoteDate(formatDateInputValueSarajevo(new Date(entry.deliveryNoteDate)))
      if (entry.customsDeclarationNumber) setCustomsDeclarationNumber(entry.customsDeclarationNumber)
      if (entry.customsDeclarationDate) setCustomsDeclarationDate(formatDateInputValueSarajevo(new Date(entry.customsDeclarationDate)))

      // Import quality
      setIsHigherQuality(entry.isHigherQuality || false)
      if (entry.improvedCharacteristics) setImprovedCharacteristics(entry.improvedCharacteristics)
      if (entry.countryOfOrigin) setCountryOfOrigin(entry.countryOfOrigin)

      // Import additive details with their original dates
      if (entry.additiveDetails && Array.isArray(entry.additiveDetails)) {
        const additiveMap: Record<string, { addedAt: string; quantity: string }> = {}
        entry.additiveDetails.forEach((ad: any) => {
          if (ad.name) {
            // Format datetime for datetime-local input (YYYY-MM-DDTHH:MM)
            let formattedDateTime = ''
            if (ad.addedAt) {
              const date = new Date(ad.addedAt)
              const year = date.getFullYear()
              const month = String(date.getMonth() + 1).padStart(2, '0')
              const day = String(date.getDate()).padStart(2, '0')
              const hours = String(date.getHours()).padStart(2, '0')
              const minutes = String(date.getMinutes()).padStart(2, '0')
              formattedDateTime = `${year}-${month}-${day}T${hours}:${minutes}`
            }
            additiveMap[ad.name] = {
              addedAt: formattedDateTime,
              quantity: ad.quantity || ''
            }
          }
        })
        setAdditiveDetails(additiveMap)
      }

      // Import laboratory with date
      if (entry.laboratoryId) setLaboratoryId(entry.laboratoryId)
      if (entry.testReportNumber) setTestReportNumber(entry.testReportNumber)
      if (entry.testReportDate) setTestReportDate(formatDateInputValueSarajevo(new Date(entry.testReportDate)))

      // Import supplier & transport
      if (entry.orderOpenedBy) setOrderOpenedBy(entry.orderOpenedBy)
      if (entry.pickupLocation) setPickupLocation(entry.pickupLocation)
      if (entry.supplierId && !isPumpa) {
        setSupplierId(entry.supplierId)
        if (entry.supplier) {
          setSelectedSupplierName(`${entry.supplier.name} (${entry.supplier.code})`)
        }
      }
      if (entry.transporterId) setTransporterId(entry.transporterId)
      if (entry.driverName) setDriverName(entry.driverName)
      if (entry.vehicleRegistration) setVehicleRegistration(entry.vehicleRegistration)

      // Import client
      if (entry.clientId && !isPumpa) {
        setClientId(entry.clientId)
        if (entry.client) setSelectedClient(entry.client)
      }
      if (entry.stationId) setStationId(entry.stationId)

      // Import certificate if exists
      if (entry.certificatePath) {
        setCertificateSelection({
          type: 'existing',
          path: entry.certificatePath
        })
      }

      setImportedFromLast(true)
      toast.success('Podaci su uvezeni s prošle prijave')
    } catch (error) {
      console.error('Error importing from last entry:', error)
      toast.error('Greška pri uvozu podataka')
    } finally {
      setImportingLastEntry(false)
    }
  }

  // Async search for clients - used by AsyncSearchableSelect
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
      toast.error('Molimo ispravite greške u datumima prije slanja')
      return
    }

    // Validate basic required fields
    if (!warehouseId || !productName || !quantity) {
      const missing = []
      if (!warehouseId) missing.push('skladište')
      if (!productName) missing.push('proizvod')
      if (!quantity) missing.push('količina')
      toast.error(`Molimo popunite sva obavezna polja (${missing.join(', ')})`)
      return
    }

    // Validate quantity
    const numQuantity = parseInt(quantity)
    if (numQuantity > 50000) {
      toast.error('Količina ne može biti veća od 50,000 litara')
      return
    }

    // Validate mandatory fields
    const missingFields: string[] = []

    if (!deliveryNoteNumber) {
      missingFields.push('Broj otpremnice')
    }
    if (!deliveryNoteDate) {
      missingFields.push('Datum otpremnice')
    }
    if (!countryOfOrigin) {
      missingFields.push('Zemlja porijekla')
    }
    if (!laboratoryId) {
      missingFields.push('Laboratorija')
    }
    if (!testReportNumber) {
      missingFields.push('Broj izvještaja laboratorije')
    }
    if (!testReportDate) {
      missingFields.push('Datum izvještaja laboratorije')
    }
    if (!clientId) {
      missingFields.push('Klijent (firma)')
    }
    if (!certificateSelection || (!certificateSelection.file && !certificateSelection.path)) {
      missingFields.push('Certifikat / Izvještaj')
    }
    // Vehicle registration is mandatory only for PUMPA users
    if (isPumpa && !vehicleRegistration) {
      missingFields.push('Registarska oznaka vozila')
    }
    // Station is mandatory for PUMPA users
    if (isPumpa && !stationId) {
      missingFields.push('Poslovnica')
    }

    // Validate additive details when higher quality is selected
    if (isHigherQuality && improvedCharacteristics.length > 0) {
      const missingAdditiveDetails = improvedCharacteristics.filter(char => {
        const details = additiveDetails[char]
        return !details?.addedAt
      })
      if (missingAdditiveDetails.length > 0) {
        missingFields.push('Datum i vrijeme aditiviranja za: ' + missingAdditiveDetails.join(', '))
      }
    }

    if (missingFields.length > 0) {
      toast.error(`Molimo popunite obavezna polja:\n• ${missingFields.join('\n• ')}`, {
        duration: 5000,
        style: {
          whiteSpace: 'pre-line'
        }
      })
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
        toast.success(`Prijava uspješno kreirana! Broj izjave: ${data.data.declarationNumber}`)
        onSuccess()
      } else {
        toast.error(data.error || 'Greška pri kreiranju prijave')
      }
    } catch (error) {
      toast.error('Greška pri kreiranju prijave')
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
          {/* Import from last entry button */}
          <div className="mb-6">
            <button
              type="button"
              onClick={importFromLastEntry}
              disabled={importingLastEntry}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importingLastEntry ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                  Uvozim...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Uvezi podatke s prošle prijave
                </>
              )}
            </button>
          </div>

          {/* Warning message after import */}
          {importedFromLast && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-800 font-medium">Podaci su uvezeni s prošle prijave</p>
                <p className="text-amber-700 text-sm mt-1">
                  Molimo pregledajte sve podatke prije spremanja. Količina nije uvezena jer se obično razlikuje.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setImportedFromLast(false)}
                className="ml-auto p-1 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

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
              {!isPumpa && (
              <FormField label="Skladište" required icon={Building2}>
                <SearchableSelect
                  options={warehouses
                    .filter(w => w.isActive && w.code !== 'DEF-001') // Hide DEFAULT warehouse for non-PUMPA users
                    .map(w => ({
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
              )}
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
          <FormSection title="Informacije o isporuci" icon={Truck} required>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Broj otpremnice" icon={FileText} required>
                <input
                  type="text"
                  value={deliveryNoteNumber}
                  onChange={(e) => setDeliveryNoteNumber(e.target.value)}
                  className="input w-full"
                  required
                />
              </FormField>
              <FormField label="Datum otpremnice" icon={Calendar} required>
                <input
                  type="date"
                  value={deliveryNoteDate}
                  onChange={(e) => handleDeliveryNoteDateChange(e.target.value)}
                  max={maxDate}
                  className={`input w-full ${deliveryNoteDateError ? 'border-red-500 border-2' : ''}`}
                  required
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
              <FormField label="Zemlja porijekla" icon={Globe} required>
                <select
                  value={countryOfOrigin}
                  onChange={(e) => setCountryOfOrigin(e.target.value)}
                  className="input w-full"
                  required
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
                                  Datum i vrijeme aditiviranja <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="datetime-local"
                                  value={additiveDetails[charName]?.addedAt || ''}
                                  onChange={(e) => setAdditiveDetails(prev => ({
                                    ...prev,
                                    [charName]: { ...prev[charName], addedAt: e.target.value }
                                  }))}
                                  className="input w-full text-sm"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-dark-500 uppercase tracking-wide mb-2">
                                  Količina (mg/kg)
                                </label>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  placeholder="npr. 250.50"
                                  value={additiveDetails[charName]?.quantity || ''}
                                  onChange={(e) => {
                                    // Allow only numbers and decimal point
                                    const value = e.target.value.replace(/[^0-9.]/g, '')
                                    setAdditiveDetails(prev => ({
                                      ...prev,
                                      [charName]: { ...prev[charName], quantity: value }
                                    }))
                                  }}
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
          <FormSection title="Laboratorijske informacije" icon={FlaskConical} required>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Odaberite laboratoriju" icon={FlaskConical} required>
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
                <FormField label="Broj izvještaja" icon={FileText} required>
                  <input
                    type="text"
                    value={testReportNumber}
                    onChange={(e) => setTestReportNumber(e.target.value)}
                    className="input w-full"
                    required
                  />
                </FormField>
                <FormField label="Datum izvještaja" icon={Calendar} required>
                  <input
                    type="date"
                    value={testReportDate}
                    onChange={(e) => handleTestReportDateChange(e.target.value)}
                    max={maxDate}
                    className={`input w-full ${testReportDateError ? 'border-red-500 border-2' : ''}`}
                    required
                  />
                  {testReportDateError && (
                    <p className="text-red-500 text-sm mt-1">{testReportDateError}</p>
                  )}
                </FormField>
              </div>
            </div>
          </FormSection>

          {/* Client Information */}
          <FormSection title="Informacije o klijentu" icon={Users} required>
            <FormField label="Odaberite klijenta (firmu)" icon={Users} required>
              {isPumpa ? (
                // PUMPA users have fixed client: HIFA-PETROL (650)
                <div className="input w-full bg-dark-50 text-dark-600 cursor-not-allowed">
                  {selectedClient ? `${selectedClient.name} (${selectedClient.code})` : 'HIFA-PETROL D.O.O. SARAJEVO (650)'}
                </div>
              ) : (
                <>
                  <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <span className="font-semibold">ℹ️ Napomena:</span> Ukoliko je roba za drugog klijenta, potrebno odabrati iz padajućeg menija. Pretražite po imenu ili šifri.
                    </p>
                  </div>
                  <AsyncSearchableSelect
                    fetchOptions={fetchClientsAsync}
                    value={clientId}
                    onChange={(id) => {
                      setClientId(id)
                      // Fetch full client details when selected
                      if (id) {
                        fetch(`/api/clients/${id}`)
                          .then(res => res.json())
                          .then(data => {
                            if (data.success) {
                              setSelectedClient(data.data)
                            }
                          })
                          .catch(console.error)
                      } else {
                        setSelectedClient(null)
                      }
                    }}
                    placeholder="Pretražite klijenta po imenu ili šifri..."
                    emptyMessage="Nema rezultata. Pokušajte drugu pretragu."
                    selectedOption={selectedClient ? {
                      id: selectedClient.id,
                      label: selectedClient.name,
                      sublabel: selectedClient.code || undefined
                    } : null}
                  />
                </>
              )}
              {selectedClient && !isPumpa && (
                <div className="mt-2 p-3 bg-dark-50 rounded-xl text-sm space-y-1">
                  <p className="text-dark-600">
                    <span className="font-semibold">Naziv:</span> {selectedClient.name}
                  </p>
                  {selectedClient.code && (
                    <p className="text-dark-600">
                      <span className="font-semibold">Šifra:</span> {selectedClient.code}
                    </p>
                  )}
                  {selectedClient.pib && (
                    <p className="text-dark-600">
                      <span className="font-semibold">PIB:</span> {selectedClient.pib}
                    </p>
                  )}
                  {selectedClient.idNumber && (
                    <p className="text-dark-600">
                      <span className="font-semibold">ID broj:</span> {selectedClient.idNumber}
                    </p>
                  )}
                </div>
              )}
            </FormField>
          </FormSection>

          {/* Station Information - Shown for HIFA-PETROL client (code: 650) or always for PUMPA users */}
          {(isPumpa || selectedClient?.code === '650') && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 shadow-sm">
              <FormSection title="Poslovnica (benzinska pumpa)" icon={Fuel}>
                <FormField label="Odaberite poslovnicu" icon={Fuel} required={isPumpa}>
                <SearchableSelect
                  options={(() => {
                    // For PUMPA users, show only their assigned stations from session
                    if (isPumpa) {
                      const userStations = (session?.user as any)?.stations || []
                      return userStations.map((s: any) => ({
                        id: s.id,
                        label: s.name,
                        sublabel: [s.code && `Šifra: ${s.code}`, s.address && `Adresa: ${s.address}`].filter(Boolean).join(' | ') || undefined
                      }))
                    }
                    // For other users, show all active stations
                    return stations.filter(s => s.isActive).map(s => ({
                      id: s.id,
                      label: s.name,
                      sublabel: [s.code && `Šifra: ${s.code}`, s.address && `Adresa: ${s.address}`].filter(Boolean).join(' | ') || undefined
                    }))
                  })()}
                  value={stationId}
                  onChange={setStationId}
                  placeholder="Odaberite poslovnicu"
                  emptyMessage="Nema dostupnih poslovnica"
                />
                {stationId && (
                  <div className="mt-2 p-3 bg-dark-50 rounded-xl text-sm space-y-1">
                    <p className="text-dark-600">
                      <span className="font-semibold">Naziv:</span> {stations.find(s => s.id === stationId)?.name || (session?.user as any)?.stations?.find((s: any) => s.id === stationId)?.name}
                    </p>
                    {(stations.find(s => s.id === stationId)?.code || (session?.user as any)?.stations?.find((s: any) => s.id === stationId)?.code) && (
                      <p className="text-dark-600">
                        <span className="font-semibold">Šifra:</span> {stations.find(s => s.id === stationId)?.code || (session?.user as any)?.stations?.find((s: any) => s.id === stationId)?.code}
                      </p>
                    )}
                    {(stations.find(s => s.id === stationId)?.address || (session?.user as any)?.stations?.find((s: any) => s.id === stationId)?.address) && (
                      <p className="text-dark-600">
                        <span className="font-semibold">Adresa:</span> {stations.find(s => s.id === stationId)?.address || (session?.user as any)?.stations?.find((s: any) => s.id === stationId)?.address}
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
                {isPumpa ? (
                  <div className="input w-full bg-dark-50 text-dark-600 cursor-not-allowed">
                    {selectedSupplierName || 'HIFA-PETROL D.O.O. SARAJEVO (650)'}
                  </div>
                ) : (
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
                )}
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
              <FormField label="Registarska oznaka vozila" icon={Truck} required={isPumpa}>
                <input
                  type="text"
                  value={vehicleRegistration}
                  onChange={(e) => setVehicleRegistration(e.target.value.toUpperCase())}
                  className="input w-full"
                  placeholder="npr. AA-123-BB"
                  required={isPumpa}
                />
              </FormField>
            </div>
          </FormSection>

          {/* Certificate Upload */}
          <FormSection title="Certifikat / Izvještaj" icon={Upload} required>
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
