import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { authService } from '@/services'
import { useAuthStore } from '@/store'
import { Button, Input } from '@/components/ui'
import { getErrorMessage } from '@/utils'

const schema = z
  .object({
    phone: z.string().min(7, 'Enter a valid phone number'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof schema>

export default function AcceptInvitePage() {
  const { setUser, setInitialized } = useAuthStore()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    if (!token) {
      toast.error('Invalid invitation link')
      return
    }
    try {
      const data = await authService.acceptInvitation(token, values.password, values.phone)
      setUser(data.user, data.accessToken, data.refreshToken)
      setInitialized()
      toast.success(`Welcome, ${data.user.firstName}!`)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
            <Zap size={20} className="text-white" />
          </div>
          <span className="text-2xl font-bold text-white">FleetFlow</span>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-modal">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Accept Invitation</h2>
          <p className="text-xs text-slate-500 mb-5">Set up your account to get started</p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            <Button type="submit" loading={isSubmitting} className="w-full" size="md">
              Activate account
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
