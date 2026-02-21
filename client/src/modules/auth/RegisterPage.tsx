import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { registerSchema, type RegisterFormValues } from '@/schemas'
import { authService } from '@/services'
import { useAuthStore } from '@/store'
import { Button, Input } from '@/components/ui'
import { getErrorMessage } from '@/utils'

export default function RegisterPage() {
  const { setUser, setInitialized } = useAuthStore()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) })

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      const data = await authService.register({
        companyName: values.companyName,
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
      })
      setUser(data.user, data.accessToken, data.refreshToken, data.permissions)
      setInitialized()
      toast.success(`Company registered! Welcome, ${data.user.firstName}!`)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
            <Zap size={20} className="text-white" />
          </div>
          <span className="text-2xl font-bold text-white">FleetFlow</span>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-modal">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-900">Create company account</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Register your company to start managing your fleet
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <Input
              label="Company name"
              placeholder="Acme Logistics Inc."
              required
              error={errors.companyName?.message}
              {...register('companyName')}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First name"
                placeholder="John"
                required
                error={errors.firstName?.message}
                {...register('firstName')}
              />
              <Input
                label="Last name"
                placeholder="Doe"
                required
                error={errors.lastName?.message}
                {...register('lastName')}
              />
            </div>
            <Input
              label="Email address"
              type="email"
              placeholder="admin@company.com"
              required
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Phone"
              type="tel"
              placeholder="+1 234 567 8900"
              required
              error={errors.phone?.message}
              {...register('phone')}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Min. 8 characters"
              required
              error={errors.password?.message}
              {...register('password')}
            />
            <Input
              label="Confirm password"
              type="password"
              placeholder="••••••••"
              required
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <Button
              type="submit"
              loading={isSubmitting}
              className="w-full mt-1"
              size="md"
            >
              Create account
            </Button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-xs text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="text-secondary-600 hover:text-secondary-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
