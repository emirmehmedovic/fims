'use client'

import { useSession, signOut } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { SessionProvider } from 'next-auth/react'
import Link from 'next/link'
import { 
  LayoutDashboard, 
  FileText, 
  Building2, 
  Users, 
  ClipboardList,
  LogOut,
  Fuel,
  HelpCircle,
  Database
} from 'lucide-react'

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-dark-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-dark-500">Učitavanje...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const isAdmin = session.user?.role === 'SUPER_ADMIN' || session.user?.role === 'ADMIN'

  const navSections = [
    {
      title: 'HOME',
      items: [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/dashboard/fuel-entries', label: 'Evidencija goriva', icon: FileText },
        { href: '/dashboard/warehouses', label: 'Skladišta', icon: Building2 },
      ]
    },
    ...(isAdmin ? [{
      title: 'ADMIN',
      items: [
        { href: '/dashboard/users', label: 'Korisnici', icon: Users },
        { href: '/dashboard/master-data', label: 'Master Podaci', icon: Database },
        { href: '/dashboard/audit-logs', label: 'Audit Logovi', icon: ClipboardList },
      ]
    }] : [])
  ]

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-dark-50 flex">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-[280px] bg-white border-r border-dark-100 flex flex-col shadow-[var(--shadow-soft)] z-50 overflow-hidden">
        {/* Logo Section */}
        <div className="px-6 pt-8 pb-6 flex-shrink-0">
          <Link href="/dashboard" className="flex items-center gap-3 group mb-6">
            <div className="w-10 h-10 rounded-2xl bg-primary-600 flex items-center justify-center shadow-[var(--shadow-primary)] group-hover:shadow-[var(--shadow-primary-lg)] transition-all">
              <Fuel className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-dark-900 font-bold text-xl tracking-tight">FIMS</h1>
              <p className="text-[10px] font-semibold text-dark-400 uppercase tracking-wider">Fuel Inventory</p>
            </div>
          </Link>

          {/* Help Section */}
          <div className="bg-dark-50 rounded-2xl p-4">
            <div className="flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-dark-900">Trebate pomoć?</p>
                <p className="text-xs text-dark-500 mt-1">Kontaktirajte administratora</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 overflow-y-auto">
          <div className="space-y-6 pb-4">
            {navSections.map((section) => (
              <div key={section.title}>
                <p className="section-title">{section.title}</p>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon
                    const active = isActive(item.href)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`nav-item ${active ? 'nav-item-active' : ''}`}
                      >
                        <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-dark-400 group-hover:text-dark-900'}`} />
                        <span>{item.label}</span>
                        {active && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 flex-shrink-0 border-t border-dark-100">
          <div className="bg-dark-50 rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-700 font-bold flex items-center justify-center">
                {session.user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-dark-900 text-sm truncate">{session.user?.name}</p>
                <p className="text-xs text-dark-500 uppercase tracking-wide">{session.user?.role}</p>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center justify-center gap-2 py-3 bg-dark-900 text-white text-sm font-medium rounded-2xl hover:bg-primary-600 transition-colors shadow-[var(--shadow-soft)]"
          >
            <LogOut className="w-4 h-4" />
            Odjavi se
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-[280px] overflow-auto min-h-screen">
        {children}
      </main>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </SessionProvider>
  )
}
