'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Lock, User, Eye, EyeOff, Fuel } from 'lucide-react'
import Image from 'next/image'

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

      console.log('SignIn result:', result)

      if (result?.error) {
        // Show more specific error in development
        if (process.env.NODE_ENV === 'development') {
          setError(`Greška: ${result.error}`)
        } else {
          setError('Pogrešan email ili lozinka')
        }
      } else if (result?.ok) {
        router.push('/dashboard')
        router.refresh()
      } else {
        setError('Neočekivana greška pri prijavi')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('Došlo je do greške pri povezivanju')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Left Side - Image (larger) */}
      <div className="hidden lg:block lg:w-[55%] xl:w-[60%] relative">
        <Image
          src="/login.png"
          alt="FIMS - Fuel Inventory Management"
          fill
          className="object-cover"
          priority
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-slate-900/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-slate-900/30" />
        
        {/* Branding on image */}
        <div className="absolute bottom-0 left-0 right-0 p-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <Fuel className="w-6 h-6 text-white" />
            </div>
            <span className="text-white font-bold text-2xl">FIMS</span>
          </div>
          <h2 className="text-white text-3xl font-bold mb-2">
            Fuel Inventory Management System
          </h2>
          <p className="text-white/70 text-lg max-w-md">
            Praćenje isporuka i kontrolu kvaliteta
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-white lg:rounded-l-[3rem]">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center shadow-lg mx-auto mb-4">
              <Fuel className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-dark-900">FIMS</h1>
          </div>

          {/* Welcome text */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-dark-900 mb-2">Dobrodošli</h1>
            <p className="text-dark-500">Prijavite se na svoj račun za nastavak</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-dark-700 mb-2">
                Email adresa
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vas.email@fims.local"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-dark-900 placeholder-dark-400 focus:outline-none focus:ring-0 focus:border-primary-500 transition-all"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-dark-700 mb-2">
                Lozinka
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-14 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-dark-900 placeholder-dark-400 focus:outline-none focus:ring-0 focus:border-primary-500 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-red-600 font-bold">!</span>
                </div>
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-dark-900 text-white font-semibold rounded-2xl hover:bg-dark-800 focus:outline-none focus:ring-4 focus:ring-dark-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Prijavljivanje...
                </span>
              ) : (
                'Prijavi se'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-12 text-center">
            <p className="text-sm text-dark-400">
              © 2025 FIMS - Fuel Inventory Management System
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
