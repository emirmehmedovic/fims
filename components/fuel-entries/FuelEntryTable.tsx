'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { formatDateSarajevo, formatDateTimeSarajevo } from '@/lib/utils/date'
import EditFuelEntryModal from './EditFuelEntryModal'
import ViewFuelEntryModal from './ViewFuelEntryModal'

interface FuelEntry {
  id: string
  registrationNumber: number
  entryDate: string
  productName: string
  quantity: number
  deliveryNoteNumber: string | null
  deliveryNoteDate: string | null
  isHigherQuality: boolean
  isActive: boolean
  warehouse: {
    id: string
    name: string
    code: string
  }
  operator: {
    id: string
    name: string
    email: string
  }
  certificatePath: string | null
  certificateFileName: string | null
  createdAt: string
}

interface Props {
  entries: FuelEntry[]
  onEntryDeleted: () => void
}

export default function FuelEntryTable({ entries, onEntryDeleted }: Props) {
  const { data: session } = useSession()
  const [editingEntry, setEditingEntry] = useState<FuelEntry | null>(null)
  const [viewingEntry, setViewingEntry] = useState<FuelEntry | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const canEdit = session?.user?.role === 'SUPER_ADMIN' ||
                  session?.user?.role === 'ADMIN' ||
                  session?.user?.role === 'OPERATOR'

  const canDelete = session?.user?.role === 'SUPER_ADMIN' ||
                    session?.user?.role === 'ADMIN'

  const handleDelete = async (id: string) => {
    if (!confirm('Da li ste sigurni da želite obrisati ovu prijavu?')) {
      return
    }

    setDeletingId(id)
    try {
      const res = await fetch(`/api/fuel-entries/${id}`, {
        method: 'DELETE'
      })

      const data = await res.json()

      if (data.success) {
        alert('Prijava uspješno obrisana')
        onEntryDeleted()
      } else {
        alert(data.error || 'Greška pri brisanju prijave')
      }
    } catch (error) {
      alert('Greška pri brisanju prijave')
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateString: string) => formatDateSarajevo(dateString)
  const formatDateTime = (dateString: string) => formatDateTimeSarajevo(dateString)

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50/80 border-b border-slate-200 backdrop-blur-sm">
            <tr>
              <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Reg. broj
              </th>
              <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Datum ulaza
              </th>
              <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Skladište
              </th>
              <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Proizvod
              </th>
              <th className="text-right px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Količina
              </th>
              <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Otpremnica
              </th>
              <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Operator
              </th>
              <th className="text-center px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Status
              </th>
              <th className="text-right px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Akcije
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {entries.map((entry) => (
              <tr
                key={entry.id}
                className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                onClick={() => setViewingEntry(entry)}
              >
                <td className="px-6 py-4">
                  <div className="font-mono font-bold text-slate-700 bg-slate-100 inline-block px-2 py-1 rounded text-sm">
                    {entry.registrationNumber}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {formatDate(entry.entryDate)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-700">
                      {entry.warehouse.code}
                    </span>
                    <span className="text-xs text-slate-500">
                      {entry.warehouse.name}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-slate-700 font-medium">
                    {entry.productName}
                  </div>
                  {entry.isHigherQuality && (
                    <img
                      src="/Screenshot_8.png"
                      alt="Premium"
                      className="h-6 w-auto rounded-md mt-1.5 shadow-sm object-contain opacity-90 hover:opacity-100 transition-opacity"
                    />
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="text-sm font-bold text-slate-700">
                    {entry.quantity.toLocaleString()} <span className="text-slate-400 font-normal text-xs">L</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {entry.deliveryNoteNumber ? (
                    <div className="flex flex-col">
                      <span className="text-sm text-slate-700 font-medium">
                        {entry.deliveryNoteNumber}
                      </span>
                      {entry.deliveryNoteDate && (
                        <span className="text-xs text-slate-500">
                          {formatDate(entry.deliveryNoteDate)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                      {entry.operator.name.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-slate-700">
                        {entry.operator.name}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase">
                        {formatDateTime(entry.createdAt)}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {entry.isActive ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                        Aktivna
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5"></span>
                        Obrisana
                      </span>
                    )}
                    {entry.certificatePath && (
                      <span
                        className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        title="Ima certifikat"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setViewingEntry(entry)
                      }}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Pregled"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    {canEdit && entry.isActive && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingEntry(entry)
                        }}
                        className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Uredi"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}
                    {canDelete && entry.isActive && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(entry.id)
                        }}
                        disabled={deletingId === entry.id}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Obriši"
                      >
                        {deletingId === entry.id ? (
                          <div className="w-4 h-4 border-2 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingEntry && (
        <EditFuelEntryModal
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
          onSuccess={() => {
            setEditingEntry(null)
            onEntryDeleted() // Refresh list
          }}
        />
      )}

      {/* View Modal */}
      {viewingEntry && (
        <ViewFuelEntryModal
          entry={viewingEntry}
          onClose={() => setViewingEntry(null)}
        />
      )}
    </>
  )
}
