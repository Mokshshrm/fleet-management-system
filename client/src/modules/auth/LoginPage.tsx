import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { loginSchema, type LoginFormValues } from '@/schemas'
import { authService } from '@/services'
import { useAuthStore } from '@/store'
import { Button, Input } from '@/components/ui'
import { getErrorMessage } from '@/utils'

export default function LoginPage() {
  const { setUser, setInitialized } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: Location })?.from?.pathname ?? '/dashboard'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const data = await authService.login(values.email, values.password)
      setUser(data.user, data.accessToken, data.refreshToken, data.permissions)
      setInitialized()
      toast.success(`Welcome back, ${data.user.firstName}!`)
      navigate(from, { replace: true })
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
            <Zap size={20} className="text-white" />
          </div>
          <span className="text-2xl font-bold text-white">FleetFlow</span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-6 shadow-modal">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-900">Sign in to your account</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your credentials to access FleetFlow
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              placeholder="admin@company.com"
              required
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              required
              error={errors.password?.message}
              {...register('password')}
            />

            <Button
              type="submit"
              loading={isSubmitting}
              className="w-full mt-1"
              size="md"
            >
              Sign in
            </Button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-xs text-slate-500">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-secondary-600 hover:text-secondary-700 font-medium"
              >
                Create company account
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-4">
          FleetFlow &copy; {new Date().getFullYear()} — Enterprise Fleet Management
        </p>
      </div>
    </div>
  )
}
