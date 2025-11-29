'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Lock, User, Eye, EyeOff, Fuel } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Pogrešan email ili lozinka')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error) {
      setError('Došlo je do greške')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-50 flex items-center justify-center p-8">
      <div className="w-full max-w-xl">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center shadow-[var(--shadow-primary-lg)] mx-auto mb-4">
            <Fuel className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-dark-900">FIMS</h1>
          <p className="text-dark-500 mt-1">Fuel Inventory Management System</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl p-12 shadow-[var(--shadow-soft-lg)] relative overflow-hidden border-[6px] border-white">
          {/* Decorative gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50/60 via-white/70 to-primary-100/50 opacity-70"></div>
          <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-primary-200 rounded-full blur-xl opacity-60"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-100 rounded-full blur-xl -mb-12 -ml-12 opacity-60"></div>

          <div className="relative z-10">
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-dark-900 mb-2">Prijava</h2>
              <p className="text-base text-dark-500">Unesite pristupne podatke</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-7">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="label">
                  Email adresa
                </label>
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-dark-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vas.email@fims.local"
                    className="input input-icon"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="label">
                  Lozinka
                </label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-dark-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input input-icon pr-14"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-6 h-6" />
                    ) : (
                      <Eye className="w-6 h-6" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 border rounded-2xl text-sm flex items-start gap-2 shadow-[var(--shadow-soft)] bg-red-50 border-red-200 text-red-700">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-red-100">
                    <span className="text-xs font-bold">!</span>
                  </div>
                  <p className="font-semibold">{error}</p>
                </div>
              )}

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-5 bg-gradient-to-br from-dark-900 to-dark-800 text-white font-semibold rounded-2xl hover:from-dark-800 hover:to-dark-700 focus:outline-none focus:ring-2 focus:ring-dark-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[var(--shadow-soft-xl)] text-base"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Prijavljivanje...
                  </span>
                ) : (
                  'Prijavi se'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-dark-500">
          <p>FIMS - Fuel Inventory Management System © 2025</p>
        </div>
      </div>
    </div>
  )
}
