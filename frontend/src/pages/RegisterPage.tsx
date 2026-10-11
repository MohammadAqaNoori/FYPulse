import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Zap } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/common/Button'

interface FormValues {
  full_name: string
  email: string
  password: string
  confirm_password: string
}

export default function RegisterPage() {
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>()

  async function onSubmit(values: FormValues) {
    setServerError('')
    try {
      await registerUser(values.full_name, values.email, values.password)
      navigate('/profile?onboarding=true')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: unknown }; status?: number }; message?: string }
      if (!e.response) {
        // Network error — backend not reachable
        setServerError('Cannot reach the server. Make sure the backend is running on port 8000.')
        return
      }
      const raw = e.response?.data?.detail
      if (Array.isArray(raw)) {
        setServerError(raw.map((e: { msg: string }) => e.msg).join(', '))
      } else if (typeof raw === 'string') {
        setServerError(raw)
      } else {
        setServerError(`Registration failed (HTTP ${e.response?.status ?? 'unknown'}).`)
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 shadow-lg">
            <Zap size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="mt-1 text-sm text-gray-500">Start discovering your perfect FYP</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          {serverError && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <div>
              <label htmlFor="full_name" className="mb-1.5 block text-sm font-medium text-gray-700">
                Full name
              </label>
              <input
                id="full_name"
                type="text"
                autoComplete="name"
                className="input"
                {...register('full_name', { required: 'Full name is required' })}
              />
              {errors.full_name && (
                <p className="mt-1 text-xs text-red-600">{errors.full_name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="input"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /\S+@\S+\.\S+/, message: 'Enter a valid email' },
                })}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                className="input"
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 8, message: 'At least 8 characters' },
                })}
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirm_password"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Confirm password
              </label>
              <input
                id="confirm_password"
                type="password"
                autoComplete="new-password"
                className="input"
                {...register('confirm_password', {
                  required: 'Please confirm your password',
                  validate: (v) => v === watch('password') || 'Passwords do not match',
                })}
              />
              {errors.confirm_password && (
                <p className="mt-1 text-xs text-red-600">{errors.confirm_password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
              Create account
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
