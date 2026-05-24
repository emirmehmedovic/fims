'use client'

import { useState, useEffect } from 'react'
import { Upload, CheckCircle, AlertCircle, Clock, FileJson, Users } from 'lucide-react'

interface ImportInfo {
  totalInFile: number
  alreadyExists: number
  wouldCreate: number
  filePath: string
}

interface ImportResult {
  created: number
  updated: number
  skipped: number
  errors: number
  total: number
  errorDetails: string[]
  duration: number
}

export default function ImportClientsPage() {
  const [importInfo, setImportInfo] = useState<ImportInfo | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch import info on mount
  useEffect(() => {
    fetchImportInfo()
  }, [])

  const fetchImportInfo = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/import-clients')
      const data = await res.json()

      if (data.success) {
        setImportInfo(data.data)
      } else {
        setError(data.error || 'Failed to load import info')
      }
    } catch (err: any) {
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (!confirm('Da li ste sigurni da želite importovati klijente?\n\nOvo će kreirati nove zapise u bazi podataka.')) {
      return
    }

    setImporting(true)
    setError(null)
    setImportResult(null)

    try {
      const res = await fetch('/api/admin/import-clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await res.json()

      if (data.success) {
        setImportResult(data.data)
        // Refresh import info
        fetchImportInfo()
      } else {
        setError(data.error || 'Import failed')
      }
    } catch (err: any) {
      setError('Failed to import: ' + err.message)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark-900 flex items-center gap-2">
          <Users className="w-7 h-7" />
          Import Klijenata
        </h1>
        <p className="text-dark-600 mt-1">
          Masovni import klijenata iz JSON fajla u bazu podataka
        </p>
      </div>

      {/* Import Info Card */}
      {loading ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="text-dark-600 mt-2">Učitavam informacije...</p>
        </div>
      ) : error && !importInfo ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">Greška</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      ) : importInfo ? (
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="bg-primary-50 px-6 py-4 border-b border-primary-100">
            <h2 className="font-semibold text-dark-900 flex items-center gap-2">
              <FileJson className="w-5 h-5 text-primary-600" />
              Informacije o Fajlu
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-blue-600 text-sm font-medium mb-1">Ukupno u fajlu</div>
                <div className="text-2xl font-bold text-blue-900">{importInfo.totalInFile}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-green-600 text-sm font-medium mb-1">Novi zapisi</div>
                <div className="text-2xl font-bold text-green-900">{importInfo.wouldCreate}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-gray-600 text-sm font-medium mb-1">Već postoji</div>
                <div className="text-2xl font-bold text-gray-900">{importInfo.alreadyExists}</div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="text-sm text-dark-600">
                <strong>Fajl:</strong> <code className="bg-white px-2 py-1 rounded border text-xs">{importInfo.filePath}</code>
              </div>
            </div>

            <button
              onClick={handleImport}
              disabled={importing || importInfo.wouldCreate === 0}
              className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {importing ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Importujem...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Importuj {importInfo.wouldCreate} Novih Klijenata
                </>
              )}
            </button>

            {importInfo.wouldCreate === 0 && (
              <p className="text-center text-dark-500 text-sm mt-2">
                Svi klijenti iz fajla već postoje u bazi.
              </p>
            )}
          </div>
        </div>
      ) : null}

      {/* Import Result Card */}
      {importResult && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-green-50 px-6 py-4 border-b border-green-100">
            <h2 className="font-semibold text-dark-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Import Završen
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{importResult.created}</div>
                <div className="text-sm text-dark-600 mt-1">Kreirano</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{importResult.updated}</div>
                <div className="text-sm text-dark-600 mt-1">Ažurirano</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-600">{importResult.skipped}</div>
                <div className="text-sm text-dark-600 mt-1">Preskočeno</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{importResult.errors}</div>
                <div className="text-sm text-dark-600 mt-1">Greške</div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-dark-600">Ukupno procesovano:</span>
                <span className="font-semibold text-dark-900">{importResult.total}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-dark-600 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Trajanje:
                </span>
                <span className="font-semibold text-dark-900">
                  {(importResult.duration / 1000).toFixed(2)}s
                </span>
              </div>
            </div>

            {importResult.errorDetails.length > 0 && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="font-medium text-red-900 mb-2">Detalji grešaka:</p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {importResult.errorDetails.map((error, idx) => (
                    <div key={idx} className="text-sm text-red-700">
                      • {error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Card */}
      {error && importInfo && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 mt-6">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">Greška tokom importa</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}
    </div>
  )
}
