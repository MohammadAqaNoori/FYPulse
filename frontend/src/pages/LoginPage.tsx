import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/common/Button'
import logo from '../assets/FYPulseLogo.png'

interface FormValues { email: string; password: string }

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>()

  async function onSubmit(values: FormValues) {
    setServerError('')
    try {
      await login(values.email, values.password)
      navigate('/dashboard')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string }; status?: number } }
      if (!e.response) { setServerError('Cannot reach the server. Make sure the backend is running on port 8000.'); return }
      const msg = e.response?.data?.detail
      setServerError(typeof msg === 'string' ? msg : `Login failed (HTTP ${e.response?.status}).`)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <img src={logo} alt="FYPulse" className="mb-3 h-16 w-auto" />
          <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
          <p className="mt-1 text-sm text-gray-500">Sign in to your FYPulse account</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-card">
          {serverError && (
            <div className="mb-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
              {serverError}
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <div>
              <label htmlFor="email" className="label">Email address</label>
              <input id="email" type="email" autoComplete="email" className="input" placeholder="you@example.com"
                {...register('email', { required: 'Email is required', pattern: { value: /\S+@\S+\.\S+/, message: 'Enter a valid email' } })} />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div>
              <label htmlFor="password" className="label">Password</label>
              <input id="password" type="password" autoComplete="current-password" className="input" placeholder="••••••••"
                {...register('password', { required: 'Password is required' })} />
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>Sign in</Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-accent-600 hover:text-accent-700">Create one</Link>
        </p>
      </div>
    </div>
  )
}
