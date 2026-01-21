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
          <thead className="bg-dark-50 border-b border-dark-100">
            <tr>
              <th className="text-left px-6 py-4 text-xs font-semibold text-dark-600 uppercase tracking-wide">
                Reg. broj
              </th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-dark-600 uppercase tracking-wide">
                Datum ulaza
              </th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-dark-600 uppercase tracking-wide">
                Skladište
              </th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-dark-600 uppercase tracking-wide">
                Proizvod
              </th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-dark-600 uppercase tracking-wide">
                Količina
              </th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-dark-600 uppercase tracking-wide">
                Otpremnica
              </th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-dark-600 uppercase tracking-wide">
                Operator
              </th>
              <th className="text-center px-6 py-4 text-xs font-semibold text-dark-600 uppercase tracking-wide">
                Status
              </th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-dark-600 uppercase tracking-wide">
                Akcije
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-dark-100">
            {entries.map((entry) => (
              <tr
                key={entry.id}
                className="hover:bg-dark-50 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="font-mono font-bold text-primary-600">
                    {entry.registrationNumber}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-dark-900">
                  {formatDate(entry.entryDate)}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-dark-900 font-semibold">
                    {entry.warehouse.code}
                  </div>
                  <div className="text-xs text-dark-500">
                    {entry.warehouse.name}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-dark-900">
                    {entry.productName}
                  </div>
                  {entry.isHigherQuality && (
                    <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-600">
                      Viša kvaliteta
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="text-sm font-bold text-dark-900">
                    {entry.quantity.toLocaleString()} L
                  </div>
                </td>
                <td className="px-6 py-4">
                  {entry.deliveryNoteNumber ? (
                    <>
                      <div className="text-sm text-dark-900">
                        {entry.deliveryNoteNumber}
                      </div>
                      {entry.deliveryNoteDate && (
                        <div className="text-xs text-dark-500">
                          {formatDate(entry.deliveryNoteDate)}
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="text-sm text-dark-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-dark-900">
                    {entry.operator.name}
                  </div>
                  <div className="text-xs text-dark-500">
                    {formatDateTime(entry.createdAt)}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {entry.isActive ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600">
                        Aktivna
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600">
                        Obrisana
                      </span>
                    )}
                    {entry.certificatePath && (
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-dark-100 text-dark-600"
                        title="Ima certifikat"
                      >
                        📄
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setViewingEntry(entry)}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                      Pregled
                    </button>
                    {canEdit && entry.isActive && (
                      <button
                        onClick={() => setEditingEntry(entry)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                      >
                        Uredi
                      </button>
                    )}
                    {canDelete && entry.isActive && (
                      <button
                        onClick={() => handleDelete(entry.id)}
                        disabled={deletingId === entry.id}
                        className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50 transition-colors"
                      >
                        {deletingId === entry.id ? 'Brisanje...' : 'Obriši'}
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
