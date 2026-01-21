'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Mail, Play, Trash2, Download, RefreshCw } from 'lucide-react'
import { formatDateInputValueSarajevo, shiftDateInputValueSarajevo, formatDateSarajevo, formatDateTimeSarajevo } from '@/lib/utils/date'

interface Recipient {
  id: string
  email: string
  name: string | null
  isActive: boolean
}

interface HistoryItem {
  id: string
  status: string
  sentAt: string | null
  entriesCount: number
  sequence: number
  recipientEmails: string[]
  entryNumbers: number[]
}

interface HistoryBatch {
  id: string
  dateFrom: string
  dateTo: string
  totalEntries: number
  totalBatches: number
  batchSize: number
  recipientsCount: number
  createdAt: string
  items: HistoryItem[]
}

export default function AutoSendPage() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'SUPER_ADMIN' || session?.user?.role === 'ADMIN'

  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [running, setRunning] = useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [resultMessage, setResultMessage] = useState('')
  const [emailError, setEmailError] = useState('')
  const [autoSendEnabled, setAutoSendEnabled] = useState(true)
  const [selectionSaved, setSelectionSaved] = useState(true)
  const [historyItems, setHistoryItems] = useState<HistoryBatch[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyPage, setHistoryPage] = useState(1)
  const [historyTotalPages, setHistoryTotalPages] = useState(1)
  const [historyRecipient, setHistoryRecipient] = useState('')
  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null)
  const [progressTotal, setProgressTotal] = useState(0)
  const [progressSent, setProgressSent] = useState(0)
  const [progressFailed, setProgressFailed] = useState(0)
  const [failedBatches, setFailedBatches] = useState<HistoryItem[]>([])
  const [expandedBatches, setExpandedBatches] = useState<string[]>([])
  const totalRecipients = recipients.length
  const activeRecipients = recipients.filter(recipient => recipient.isActive).length
  const selectedRecipients = selectedIds.length

  const today = useMemo(() => formatDateInputValueSarajevo(new Date()), [])
  const yesterday = useMemo(() => shiftDateInputValueSarajevo(today, -1), [today])
  const [dateFrom, setDateFrom] = useState(yesterday)
  const [dateTo, setDateTo] = useState(yesterday)

  useEffect(() => {
    if (!isAdmin) return
    fetchRecipients()
    fetchSettings()
  }, [isAdmin])

  useEffect(() => {
    if (!isAdmin) return
    fetchHistory()
  }, [isAdmin, historyPage, historyRecipient])

  useEffect(() => {
    if (!running || !currentBatchId) {
      return
    }

    let cancelled = false

    const poll = async () => {
      try {
        const params = new URLSearchParams({
          batchId: currentBatchId,
          page: '1',
          limit: '1'
        })
        const res = await fetch(`/api/auto-send/history/batches?${params}`)
        const data = await res.json()
        if (!data.success || cancelled) return
        const batch = (data.data.items as HistoryBatch[])[0]
        if (!batch) return
        const items = batch.items
        const sentCount = items.filter(item => item.status === 'SENT').length
        const failed = items.filter(item => item.status === 'FAILED')
        const failedCount = failed.length
        setProgressTotal(items.length)
        setProgressSent(sentCount)
        setProgressFailed(failedCount)
        setFailedBatches(failed)

        if (items.length > 0 && sentCount + failedCount >= items.length) {
          setRunning(false)
          setCurrentBatchId(null)
          fetchHistory()
        }
      } catch (error) {
        console.error('Error polling auto-send progress:', error)
      }
    }

    const interval = setInterval(poll, 2000)
    poll()

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [running, currentBatchId])

  const fetchRecipients = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/auto-send/recipients')
      const data = await res.json()
      if (data.success) {
        setRecipients(data.data)
      }
    } catch (error) {
      console.error('Error fetching recipients:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/auto-send/settings')
      const data = await res.json()
      if (data.success) {
        setAutoSendEnabled(Boolean(data.data.isEnabled))
        const savedIds = Array.isArray(data.data.selectedRecipientIds)
          ? data.data.selectedRecipientIds
          : []
        setSelectedIds(savedIds)
        setSelectionSaved(true)
      }
    } catch (error) {
      console.error('Error fetching auto-send settings:', error)
    }
  }

  const fetchHistory = async () => {
    setHistoryLoading(true)
    try {
      const params = new URLSearchParams({
        page: historyPage.toString(),
        limit: '10',
        ...(historyRecipient && { recipient: historyRecipient })
      })
      const res = await fetch(`/api/auto-send/history/batches?${params}`)
      const data = await res.json()
      if (data.success) {
        setHistoryItems(data.data.items)
        setHistoryTotalPages(data.data.pagination.totalPages || 1)
      }
    } catch (error) {
      console.error('Error fetching auto-send history:', error)
    } finally {
      setHistoryLoading(false)
    }
  }

  const parseEmails = (raw: string) => raw
    .split(/[;,]/g)
    .map(item => item.trim().toLowerCase())
    .filter(Boolean)

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

  const handleAddRecipient = async () => {
    const cleanedEmail = email.trim()
    if (!cleanedEmail) {
      setEmailError('Unesite email adresu.')
      return
    }
    const emails = parseEmails(cleanedEmail)
    const invalidEmails = emails.filter(item => !isValidEmail(item))
    if (invalidEmails.length > 0) {
      setEmailError(`Neispravna email adresa: ${invalidEmails.join(', ')}`)
      return
    }
    setSaving(true)
    setResultMessage('')
    setEmailError('')
    try {
      const res = await fetch('/api/auto-send/recipients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanedEmail, name })
      })
      const data = await res.json()
      if (data.success) {
        setEmail('')
        setName('')
        fetchRecipients()
      } else {
        setResultMessage(data.error || 'Greška pri dodavanju email adrese')
      }
    } catch (error) {
      setResultMessage('Greška pri dodavanju email adrese')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await fetch(`/api/auto-send/recipients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      })
      fetchRecipients()
    } catch (error) {
      console.error('Error updating recipient:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Da li ste sigurni da želite obrisati ovu email adresu?')) {
      return
    }
    try {
      await fetch(`/api/auto-send/recipients/${id}`, { method: 'DELETE' })
      fetchRecipients()
    } catch (error) {
      console.error('Error deleting recipient:', error)
    }
  }

  const handleRun = async () => {
    setRunning(true)
    setResultMessage('')
    try {
      const res = await fetch('/api/auto-send/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateFrom,
          dateTo,
          recipientIds: selectedIds.length > 0 ? selectedIds : undefined
        })
      })
      const data = await res.json()
      if (data.success) {
        setResultMessage(`Poslano: ${data.data.entries} prijava u ${data.data.batches} paketa na ${data.data.sent} adresa.`)
        setCurrentBatchId(data.data.batchId || null)
        setProgressTotal(data.data.batches || 0)
        setProgressSent(0)
        setProgressFailed(0)
      } else {
        setResultMessage(data.error || 'Greška pri slanju')
        setRunning(false)
      }
    } catch (error) {
      setResultMessage('Greška pri slanju')
      setRunning(false)
    }
  }

  const handleToggleAutoSend = async (value: boolean) => {
    setAutoSendEnabled(value)
    try {
      const res = await fetch('/api/auto-send/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: value })
      })
      const data = await res.json()
      if (!data.success) {
        setResultMessage(data.error || 'Greška pri ažuriranju postavki')
        setAutoSendEnabled(!value)
      }
    } catch (error) {
      setResultMessage('Greška pri ažuriranju postavki')
      setAutoSendEnabled(!value)
    }
  }

  const handleSaveSelection = async () => {
    try {
      const res = await fetch('/api/auto-send/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedRecipientIds: selectedIds })
      })
      const data = await res.json()
      if (data.success) {
        setSelectionSaved(true)
      } else {
        setResultMessage(data.error || 'Greška pri spremanju odabira')
      }
    } catch (error) {
      setResultMessage('Greška pri spremanju odabira')
    }
  }

  const handleDownloadBatch = async (id: string) => {
    try {
      const response = await fetch(`/api/auto-send/history/${id}/download`)
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Greška pri preuzimanju')
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `AutoSend_Paket_${id}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error: any) {
      setResultMessage(error.message || 'Greška pri preuzimanju')
    }
  }

  if (!isAdmin) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-2xl p-8 border border-dark-100">
          Nemate pristup ovoj stranici.
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div className="bg-gradient-to-br from-dark-900 to-dark-800 rounded-3xl p-8 text-white shadow-[var(--shadow-soft-xl)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-500 opacity-10 rounded-full blur-3xl -ml-12 -mb-12"></div>

        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md">
              <Mail className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Automatsko slanje dokumenata</h1>
              <p className="text-sm text-dark-200 mt-2 max-w-2xl">
                Ova funkcija automatski šalje PDF izjave za prijave goriva na definisane email adrese.
                Cron se obično pokreće poslije ponoći i šalje izvještaj za prethodni dan.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            {[
              { label: 'Ukupno adresa', value: totalRecipients, accent: 'text-primary-200' },
              { label: 'Aktivne adrese', value: activeRecipients, accent: 'text-emerald-200' },
              { label: 'Odabrane adrese', value: selectedRecipients, accent: 'text-amber-200' }
            ].map(item => (
              <div key={item.label} className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-[11px] uppercase tracking-wide text-dark-200 font-semibold">{item.label}</p>
                <p className={`text-xl font-bold ${item.accent}`}>{item.value}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between bg-white/10 rounded-2xl px-4 py-3 border border-white/10">
            <div>
              <div className="text-sm font-semibold text-white">Automatsko slanje</div>
              <div className="text-xs text-dark-200">
                {autoSendEnabled ? 'Aktivno - cron šalje izvještaje prema rasporedu.' : 'Pauzirano - cron ne šalje izvještaje.'}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-white">
              <input
                type="checkbox"
                checked={autoSendEnabled}
                onChange={(e) => handleToggleAutoSend(e.target.checked)}
              />
              {autoSendEnabled ? 'On' : 'Off'}
            </label>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-[var(--shadow-soft)] border border-dark-100 p-6">
        <div className="flex items-start justify-between gap-6 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-dark-900">Email adrese</h2>
            <p className="text-sm text-dark-500 mt-1">
              Dodajte adrese koje trebaju primati automatske PDF izvještaje. Neaktivne adrese se preskaču.
            </p>
          </div>
          <div className="text-xs text-dark-400 bg-dark-50 px-3 py-2 rounded-xl">
            Savjet: više adresa odvojite zarezom ili tačka-zarezom.
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input w-full"
            placeholder="email@firma.ba"
          />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input w-full"
            placeholder="Naziv (opciono)"
          />
          <button
            onClick={handleAddRecipient}
            disabled={saving || !email}
            className="btn-primary w-full disabled:opacity-50"
          >
            Dodaj adresu
          </button>
        </div>
        {emailError && (
          <div className="text-sm text-red-600 mb-4">{emailError}</div>
        )}

        {loading ? (
          <div className="text-sm text-dark-500">Učitavanje...</div>
        ) : recipients.length === 0 ? (
          <div className="text-sm text-dark-500">Nema definisanih adresa.</div>
        ) : (
          <div className="space-y-3">
            {recipients.map(recipient => (
              <div
                key={recipient.id}
                className="flex items-center justify-between border border-dark-100 rounded-xl px-4 py-3 hover:bg-dark-50 transition-colors"
              >
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(recipient.id)}
                    onChange={(e) => {
                      setSelectedIds(prev => e.target.checked
                        ? [...prev, recipient.id]
                        : prev.filter(id => id !== recipient.id))
                      setSelectionSaved(false)
                    }}
                  />
                  <div>
                    <div className="text-sm font-semibold text-dark-900">{recipient.email}</div>
                    {recipient.name && <div className="text-xs text-dark-500">{recipient.name}</div>}
                  </div>
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-dark-500">
                    <input
                      type="checkbox"
                      checked={recipient.isActive}
                      onChange={(e) => handleToggleActive(recipient.id, e.target.checked)}
                    />
                    Aktivno
                  </label>
                  <button
                    onClick={() => handleDelete(recipient.id)}
                    className="text-dark-500 hover:text-red-600"
                    title="Obriši"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-dark-500">
            Odabrane adrese se čuvaju i koriste za automatsko slanje.
          </div>
          <button
            onClick={handleSaveSelection}
            disabled={selectionSaved}
            className="btn-primary disabled:opacity-50"
          >
            Sačuvaj odabir
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-[var(--shadow-soft)] border border-dark-100 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-dark-900">Historija slanja</h2>
            <p className="text-sm text-dark-500 mt-1">
              Pregled poslanih paketa. Možete filtrirati po email adresi i preuzeti poslani paket.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="text"
              value={historyRecipient}
              onChange={(e) => {
                setHistoryRecipient(e.target.value)
                setHistoryPage(1)
              }}
              className="input w-full sm:w-64"
              placeholder="Filtriraj po email adresi"
            />
            <button
              onClick={fetchHistory}
              className="btn-primary flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Osvjezi
            </button>
          </div>
        </div>

        {historyLoading ? (
          <div className="text-sm text-dark-500">Učitavanje...</div>
        ) : historyItems.length === 0 ? (
          <div className="text-sm text-dark-500">Nema poslanih batch‑eva za odabrani filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-50 border-b border-dark-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-600 uppercase tracking-wide">Vrijeme</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-600 uppercase tracking-wide">Period</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-600 uppercase tracking-wide">Paketi</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-600 uppercase tracking-wide">Prijave</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-600 uppercase tracking-wide">Adrese</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-600 uppercase tracking-wide">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-dark-600 uppercase tracking-wide">Detalji</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-dark-100">
                {historyItems.map(batch => {
                  const sentCount = batch.items.filter(item => item.status === 'SENT').length
                  const failedCount = batch.items.filter(item => item.status === 'FAILED').length
                  const lastSent = batch.items
                    .map(item => item.sentAt)
                    .filter(Boolean)
                    .sort()
                    .slice(-1)[0]
                  const isExpanded = expandedBatches.includes(batch.id)

                  return (
                    <Fragment key={batch.id}>
                      <tr key={batch.id} className="hover:bg-dark-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-dark-900">
                          {lastSent ? formatDateTimeSarajevo(lastSent) : formatDateTimeSarajevo(batch.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-sm text-dark-900">
                          {formatDateSarajevo(batch.dateFrom)} - {formatDateSarajevo(batch.dateTo)}
                        </td>
                        <td className="px-4 py-3 text-sm text-dark-900">
                          {batch.totalBatches} paketa
                        </td>
                        <td className="px-4 py-3 text-sm text-dark-900">
                          {batch.totalEntries} prijava
                        </td>
                        <td className="px-4 py-3 text-xs text-dark-600">
                          {batch.items[0]?.recipientEmails?.join(', ') || '-'}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-semibold ${
                            failedCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                          }`}>
                            {failedCount > 0 ? `Greške: ${failedCount}` : `Poslano: ${sentCount}`}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => {
                              setExpandedBatches(prev => prev.includes(batch.id)
                                ? prev.filter(id => id !== batch.id)
                                : [...prev, batch.id])
                            }}
                            className="text-sm text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-2"
                          >
                            {isExpanded ? 'Sakrij' : 'Detalji'}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} className="px-4 pb-4">
                            <div className="rounded-2xl border border-dark-100 bg-dark-50 p-4">
                              <div className="text-xs text-dark-500 mb-3">
                                Paketi u ovoj transakciji
                              </div>
                              <div className="space-y-3">
                                {batch.items.map(item => (
                                  <div key={item.id} className="flex flex-col gap-2 rounded-xl bg-white px-4 py-3 border border-dark-100">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                      <div className="text-sm font-semibold text-dark-900">
                                        Paket {item.sequence}/{batch.totalBatches}
                                      </div>
                                      <div className="text-xs text-dark-500">
                                        {item.sentAt ? formatDateTimeSarajevo(item.sentAt) : 'Nije poslano'}
                                      </div>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-dark-600">
                                      <div>{item.entriesCount} prijava</div>
                                      <div>{item.recipientEmails.join(', ')}</div>
                                      <div>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-semibold ${
                                          item.status === 'SENT' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                        }`}>
                                          {item.status === 'SENT' ? 'Poslano' : 'Greška'}
                                        </span>
                                      </div>
                                      <button
                                        onClick={() => handleDownloadBatch(item.id)}
                                        className="text-xs text-primary-600 hover:text-primary-700 font-semibold inline-flex items-center gap-2"
                                      >
                                        <Download className="w-4 h-4" />
                                        Preuzmi paket
                                      </button>
                                    </div>
                                    <div className="text-xs text-dark-500">
                                      Reg. brojevi: {item.entryNumbers.join(', ')}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {historyTotalPages > 1 && (
          <div className="flex justify-between items-center mt-6 pt-6 border-t border-dark-100">
            <div className="text-sm text-dark-500">
              Stranica {historyPage} od {historyTotalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                disabled={historyPage === 1}
                className="px-4 py-2 bg-white border border-dark-200 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-dark-50 transition-all text-sm"
              >
                Prethodna
              </button>
              <button
                onClick={() => setHistoryPage(p => Math.min(historyTotalPages, p + 1))}
                disabled={historyPage === historyTotalPages}
                className="px-4 py-2 bg-white border border-dark-200 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-dark-50 transition-all text-sm"
              >
                Sljedeća
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-[var(--shadow-soft)] border border-dark-100 p-6">
        <div className="flex items-start justify-between gap-6 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-dark-900">Ručno pokretanje</h2>
            <p className="text-sm text-dark-500 mt-1">
              Koristite ovu opciju za slanje izvještaja za tačno odabran period, bez čekanja cron zadatka.
            </p>
          </div>
          <div className="text-xs text-dark-400 bg-dark-50 px-3 py-2 rounded-xl">
            PDF se generise za sve prijave u rasponu datuma.
          </div>
        </div>
        {!autoSendEnabled && (
          <div className="mb-4 text-xs text-amber-600">
            Automatsko slanje je pauzirano, ali ručno pokretanje je i dalje dostupno.
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-dark-600 uppercase tracking-wide mb-2">
              Datum od
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-dark-600 uppercase tracking-wide mb-2">
              Datum do
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="input w-full"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleRun}
              disabled={running}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              {running ? 'Slanje...' : 'Pokreni slanje'}
            </button>
          </div>
        </div>
        {resultMessage && (
          <div className="mt-4 text-sm text-dark-600">{resultMessage}</div>
        )}
        <div className="mt-4 text-xs text-dark-400">
          Cron endpoint za dnevno slanje: <code className="bg-dark-50 px-1 py-0.5 rounded">/api/cron/auto-send</code>
        </div>
      </div>
      {running && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-[var(--shadow-soft-xl)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary-50 rounded-2xl">
                <Mail className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-dark-900">Slanje u toku</h3>
                <p className="text-sm text-dark-500">Molimo sačekajte dok se paketi šalju.</p>
              </div>
            </div>
            <div className="w-full h-2 bg-dark-100 rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-primary-500 transition-all"
                style={{ width: `${progressTotal > 0 ? Math.round((progressSent + progressFailed) / progressTotal * 100) : 10}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-sm text-dark-600 mb-4">
              <div>Poslano: {progressSent}/{progressTotal}</div>
              {progressFailed > 0 && <div className="text-amber-600">Greške: {progressFailed}</div>}
            </div>
            {progressFailed > 0 && (
              <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <div className="font-semibold mb-2">Neuspješni paketi</div>
                <div className="space-y-2 max-h-32 overflow-auto">
                  {failedBatches.map(item => (
                    <div key={item.id} className="text-xs text-amber-700">
                      Paket {item.sequence}/{progressTotal} • {item.entriesCount} prijava • {item.recipientEmails.join(', ')}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-3 text-sm text-dark-600">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                Priprema prijava za slanje
              </div>
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-primary-300"></span>
                Generisanje PDF dokumenata
              </div>
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-primary-200"></span>
                Slanje paketa na odabrane adrese
              </div>
            </div>
            <div className="mt-6 text-xs text-dark-400">
              Ovo može potrajati nekoliko minuta, zavisno od broja prijava.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
