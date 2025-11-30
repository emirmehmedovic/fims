import { Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { bs } from 'date-fns/locale'

interface User {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  lastLogin: string | null
  warehouses: Array<{ id: string; name: string; code: string }>
}

interface UserTableProps {
  users: User[]
  loading: boolean
  onEdit: (user: User) => void
  onDelete: (userId: string) => void
}

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Administrator',
  OPERATOR: 'Operator',
  VIEWER: 'Preglednik'
}

const roleBadgeColors: Record<string, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-800',
  ADMIN: 'bg-blue-100 text-blue-800',
  OPERATOR: 'bg-green-100 text-green-800',
  VIEWER: 'bg-gray-100 text-gray-800'
}

export default function UserTable({ users, loading, onEdit, onDelete }: UserTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-[var(--shadow-soft)] border border-dark-100 p-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-[var(--shadow-soft)] border border-dark-100 p-8">
        <div className="text-center py-12">
          <p className="text-dark-500">Nema korisnika za prikaz</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-[var(--shadow-soft)] border border-dark-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-dark-50 border-b border-dark-100">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-dark-600 uppercase tracking-wide">
                Korisnik
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-dark-600 uppercase tracking-wide">
                Uloga
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-dark-600 uppercase tracking-wide">
                Skladišta
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-dark-600 uppercase tracking-wide">
                Posljednji Login
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-dark-600 uppercase tracking-wide">
                Status
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-dark-600 uppercase tracking-wide">
                Akcije
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-dark-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-dark-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-semibold text-dark-900">{user.name}</div>
                    <div className="text-sm text-dark-500">{user.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${roleBadgeColors[user.role]}`}>
                    {roleLabels[user.role]}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-dark-900">
                    {user.warehouses.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {user.warehouses.map(wh => (
                          <span key={wh.id} className="px-2 py-1 bg-dark-50 border border-dark-100 rounded text-xs font-medium text-dark-700">
                            {wh.code}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-dark-400">Nije dodijeljeno</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-500">
                  {user.lastLogin ? (
                    formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true, locale: bs })
                  ) : (
                    'Nikad'
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.isActive ? (
                    <span className="flex items-center gap-1 text-emerald-600 text-sm font-medium">
                      <CheckCircle size={16} />
                      Aktivan
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-600 text-sm font-medium">
                      <XCircle size={16} />
                      Neaktivan
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => onEdit(user)}
                    className="text-blue-600 hover:text-blue-700 mr-4 transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => onDelete(user.id)}
                    className="text-red-600 hover:text-red-700 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
