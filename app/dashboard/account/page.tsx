'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { KeyRound, ShieldCheck, User } from 'lucide-react'

export default function AccountPage() {
  const { data: session } = useSession()
  const [name, setName] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [profileMessage, setProfileMessage] = useState('')
  const [profileError, setProfileError] = useState('')

  useEffect(() => {
    if (session?.user?.name) {
      setName(session.user.name)
    }
  }, [session?.user?.name])

  const passwordRules = {
    length: newPassword.length >= 8,
    upper: /[A-Z]/.test(newPassword),
    lower: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword)
  }

  const strengthScore = Object.values(passwordRules).filter(Boolean).length
  const strengthLabel = strengthScore <= 2 ? 'Slaba' : strengthScore <= 4 ? 'Srednja' : 'Jaka'
  const strengthColor = strengthScore <= 2 ? 'bg-red-500' : strengthScore <= 4 ? 'bg-amber-500' : 'bg-emerald-500'

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileMessage('')
    setProfileError('')

    if (!name || name.trim().length < 2) {
      setProfileError('Ime mora imati najmanje 2 znaka.')
      return
    }

    setSavingProfile(true)
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      })
      const data = await res.json()
      if (data.success) {
        setProfileMessage('Ime je uspješno ažurirano.')
      } else {
        setProfileError(data.error || 'Neuspješno ažuriranje profila.')
      }
    } catch (err) {
      setProfileError('Neuspješno ažuriranje profila.')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setError('')

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Molimo popunite sva polja.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Nova lozinka i potvrda se ne podudaraju.')
      return
    }

    if (newPassword.length < 8) {
      setError('Nova lozinka mora imati najmanje 8 znakova.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/account/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      })
      const data = await res.json()
      if (data.success) {
        setMessage('Lozinka je uspješno promijenjena.')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setError(data.error || 'Neuspješno mijenjanje lozinke.')
      }
    } catch (err) {
      setError('Neuspješno mijenjanje lozinke.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div className="bg-white rounded-2xl shadow-[var(--shadow-soft)] border border-dark-100 p-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary-50 rounded-2xl">
            <ShieldCheck className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-dark-900">Moj nalog</h1>
            <p className="text-sm text-dark-500">Ovdje možete promijeniti svoju lozinku.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-[var(--shadow-soft)] border border-dark-100 p-6 max-w-xl">
        <h2 className="text-lg font-semibold text-dark-900 mb-4">Profil</h2>
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-dark-600 uppercase tracking-wide mb-2">
              Ime i prezime
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input w-full"
              placeholder="Unesite vaše ime"
            />
          </div>
          {profileMessage && (
            <div className="text-sm text-emerald-600">{profileMessage}</div>
          )}
          {profileError && (
            <div className="text-sm text-red-600">{profileError}</div>
          )}
          <button
            type="submit"
            disabled={savingProfile}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <User className="w-4 h-4" />
            {savingProfile ? 'Spremanje...' : 'Sačuvaj profil'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-[var(--shadow-soft)] border border-dark-100 p-6 max-w-xl">
        <h2 className="text-lg font-semibold text-dark-900 mb-4">Promjena lozinke</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-dark-600 uppercase tracking-wide mb-2">
              Trenutna lozinka
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="input w-full"
              placeholder="Unesite trenutnu lozinku"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-dark-600 uppercase tracking-wide mb-2">
              Nova lozinka
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input w-full"
              placeholder="Unesite novu lozinku"
            />
          </div>
          <div className="rounded-2xl border border-dark-100 bg-dark-50 p-4">
            <div className="flex items-center justify-between text-xs text-dark-500 mb-2">
              <span>Jačina lozinke</span>
              <span className="font-semibold text-dark-700">{strengthLabel}</span>
            </div>
            <div className="w-full h-2 bg-dark-200 rounded-full overflow-hidden mb-3">
              <div
                className={`h-full ${strengthColor} transition-all`}
                style={{ width: `${(strengthScore / 5) * 100}%` }}
              ></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-dark-600">
              <div className={`flex items-center gap-2 ${passwordRules.length ? 'text-emerald-600' : ''}`}>
                <span className="w-2 h-2 rounded-full bg-current"></span>
                Najmanje 8 znakova
              </div>
              <div className={`flex items-center gap-2 ${passwordRules.upper ? 'text-emerald-600' : ''}`}>
                <span className="w-2 h-2 rounded-full bg-current"></span>
                Veliko slovo
              </div>
              <div className={`flex items-center gap-2 ${passwordRules.lower ? 'text-emerald-600' : ''}`}>
                <span className="w-2 h-2 rounded-full bg-current"></span>
                Malo slovo
              </div>
              <div className={`flex items-center gap-2 ${passwordRules.number ? 'text-emerald-600' : ''}`}>
                <span className="w-2 h-2 rounded-full bg-current"></span>
                Broj
              </div>
              <div className={`flex items-center gap-2 ${passwordRules.special ? 'text-emerald-600' : ''}`}>
                <span className="w-2 h-2 rounded-full bg-current"></span>
                Specijalni znak
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-dark-600 uppercase tracking-wide mb-2">
              Potvrda nove lozinke
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input w-full"
              placeholder="Ponovite novu lozinku"
            />
          </div>

          {message && (
            <div className="text-sm text-emerald-600">{message}</div>
          )}
          {error && (
            <div className="text-sm text-red-600">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <KeyRound className="w-4 h-4" />
            {loading ? 'Spremanje...' : 'Promijeni lozinku'}
          </button>
        </form>
      </div>
    </div>
  )
}
