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
      <div className="card">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
        </div>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="card">
        <div className="text-center py-12">
          <p className="text-primary-gray">Nema korisnika za prikaz</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-bg-secondary border-b border-bg-tertiary">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-gray uppercase tracking-wider">
                Korisnik
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-gray uppercase tracking-wider">
                Uloga
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-gray uppercase tracking-wider">
                Skladišta
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-gray uppercase tracking-wider">
                Posljednji Login
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary-gray uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-primary-gray uppercase tracking-wider">
                Akcije
              </th>
            </tr>
          </thead>
          <tbody className="bg-bg-primary divide-y divide-bg-tertiary">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-bg-secondary transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-primary-dark">{user.name}</div>
                    <div className="text-sm text-primary-gray">{user.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${roleBadgeColors[user.role]}`}>
                    {roleLabels[user.role]}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-primary-dark">
                    {user.warehouses.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {user.warehouses.map(wh => (
                          <span key={wh.id} className="px-2 py-1 bg-bg-secondary rounded text-xs">
                            {wh.code}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-primary-gray">Nije dodijeljeno</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-gray">
                  {user.lastLogin ? (
                    formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true, locale: bs })
                  ) : (
                    'Nikad'
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.isActive ? (
                    <span className="flex items-center gap-1 text-status-success text-sm">
                      <CheckCircle size={16} />
                      Aktivan
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-status-danger text-sm">
                      <XCircle size={16} />
                      Neaktivan
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => onEdit(user)}
                    className="text-primary-blue hover:text-primary-blue-hover mr-4"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => onDelete(user.id)}
                    className="text-status-danger hover:text-red-700"
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
