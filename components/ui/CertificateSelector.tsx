'use client'

import { useState, useEffect } from 'react'
import { Upload, FileText, X } from 'lucide-react'
import SearchableSelect from './SearchableSelect'

interface CertificateOption {
  certificatePath: string
  certificateFileName: string
  certificateUploadedAt: string
  fuelEntry: {
    registrationNumber: number
    productName: string
    entryDate: string
    vehicleRegistration: string | null
    warehouse: {
      name: string
      code: string
    }
  }
}

interface CertificateSelectorProps {
  value: { type: 'new' | 'existing', file?: File, path?: string } | null
  onChange: (value: { type: 'new' | 'existing', file?: File, path?: string } | null) => void
  existingCertificatePath?: string | null
}

export default function CertificateSelector({
  value,
  onChange,
  existingCertificatePath
}: CertificateSelectorProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'select'>('upload')
  const [certificates, setCertificates] = useState<CertificateOption[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchCertificates()
  }, [])

  const fetchCertificates = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/certificates?pageSize=1000')
      const data = await res.json()
      if (data.success && data.data?.items && Array.isArray(data.data.items)) {
        setCertificates(data.data.items)
      } else {
        setCertificates([])
      }
    } catch (error) {
      console.error('Error fetching certificates:', error)
      setCertificates([])
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (tab: 'upload' | 'select') => {
    setActiveTab(tab)
    // Clear value when switching tabs
    onChange(null)
  }

  const handleFileChange = (file: File | null) => {
    if (file) {
      onChange({ type: 'new', file })
    } else {
      onChange(null)
    }
  }

  const handleCertificateSelect = (path: string) => {
    if (path) {
      onChange({ type: 'existing', path })
    } else {
      onChange(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('bs-BA', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const certificateOptions = (Array.isArray(certificates) ? certificates : []).map((cert, index) => ({
    id: cert.certificatePath,
    label: cert.certificateFileName,
    sublabel: undefined
  }))

  // Remove duplicates based on certificatePath
  const uniqueCertificateOptions = certificateOptions.filter((option, index, self) =>
    index === self.findIndex((t) => t.id === option.id)
  )

  return (
    <div className="space-y-4">
      {/* Tab Bar */}
      <div className="flex gap-2 p-1 bg-dark-100 rounded-xl">
        <button
          type="button"
          onClick={() => handleTabChange('upload')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'upload'
              ? 'bg-white text-dark-900 shadow-sm'
              : 'text-dark-600 hover:text-dark-900'
          }`}
        >
          <Upload className="w-4 h-4" />
          Uploaduj novi
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('select')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'select'
              ? 'bg-white text-dark-900 shadow-sm'
              : 'text-dark-600 hover:text-dark-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          Odaberi postojeći
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'upload' ? (
        /* Upload Tab */
        <div className="border-2 border-dashed border-dark-200 rounded-2xl p-6 hover:border-primary-300 hover:bg-primary-50/20 transition-all">
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-dark-100 flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6 text-dark-400" />
            </div>
            <p className="text-sm font-medium text-dark-700 mb-1">Upload certifikata</p>
            <p className="text-xs text-dark-500 mb-4">PDF, JPG, PNG (max 10MB)</p>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              className="hidden"
              id="certificate-upload-new"
            />
            <label
              htmlFor="certificate-upload-new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-dark-900 text-white text-sm font-medium rounded-xl hover:bg-dark-800 transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              Odaberi fajl
            </label>
          </div>
          {value?.type === 'new' && value.file && (
            <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-dark-900">{value.file.name}</p>
                <p className="text-xs text-dark-500">{(value.file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button
                type="button"
                onClick={() => handleFileChange(null)}
                className="p-1 text-dark-400 hover:text-red-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Select Existing Tab */
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8 text-dark-500 text-sm">
              Učitavanje certifikata...
            </div>
          ) : (
            <SearchableSelect
              options={uniqueCertificateOptions}
              value={value?.type === 'existing' && value.path ? value.path : ''}
              onChange={handleCertificateSelect}
              placeholder="Odaberite postojeći certifikat..."
              emptyMessage="Nema dostupnih certifikata"
            />
          )}
          {value?.type === 'existing' && value.path && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-dark-900 mb-1">Odabrani certifikat</p>
                  <p className="text-xs text-dark-600 break-all">{value.path}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
