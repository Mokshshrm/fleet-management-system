import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { expenseService, vehicleService, driverService } from '@/services'
import { expenseSchema, type ExpenseFormValues } from '@/schemas'
import type { Expense } from '@/types'
import { Modal, Button, Input, Select, Textarea } from '@/components/ui'
import { getErrorMessage } from '@/utils'

interface Props {
  isOpen: boolean
  expense?: Expense
  onClose: () => void
}

const categoryOptions = [
  { value: 'fuel', label: 'Fuel' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'repair', label: 'Repair' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'registration', label: 'Registration' },
  { value: 'toll', label: 'Toll' },
  { value: 'parking', label: 'Parking' },
  { value: 'fine', label: 'Fine' },
  { value: 'salary', label: 'Salary' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'tire', label: 'Tire' },
  { value: 'parts', label: 'Parts' },
  { value: 'permit', label: 'Permit' },
  { value: 'other', label: 'Other' },
]

export function ExpenseFormModal({ isOpen, expense, onClose }: Props) {
  const qc = useQueryClient()
  const isEditing = !!expense

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles-all'],
    queryFn: () => vehicleService.getAll({ limit: 200 }),
    enabled: isOpen,
    select: (d) => d.vehicles.map((v) => ({ value: v._id, label: `${v.licensePlate} — ${v.make} ${v.model}` })),
  })

  const { data: drivers } = useQuery({
    queryKey: ['drivers-all'],
    queryFn: () => driverService.getAll({ limit: 200 }),
    enabled: isOpen,
    select: (d) => d.drivers.map((dr) => ({ value: dr._id, label: `${dr.firstName} ${dr.lastName}` })),
  })

  const vehicleOptions = [{ value: '', label: 'No vehicle' }, ...(vehicles ?? [])]
  const driverOptions = [{ value: '', label: 'No driver' }, ...(drivers ?? [])]

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { currency: 'USD', isRecurring: false, tax: 0, date: new Date().toISOString().split('T')[0] },
  })

  const amount = watch('amount') || 0
  const tax = watch('tax') || 0
  const totalAmount = Number(amount) + Number(tax)

  useEffect(() => {
    if (isOpen) {
      if (expense) {
        reset({
          category: expense.category,
          amount: expense.amount ?? 0,
          currency: expense.currency ?? 'USD',
          tax: expense.tax ?? 0,
          date: expense.date?.split('T')[0] ?? '',
          description: expense.description ?? '',
          vehicleId: expense.vehicleId
            ? (typeof expense.vehicleId === 'object' ? (expense.vehicleId as any)._id : expense.vehicleId)
            : '',
          driverId: expense.driverId
            ? (typeof expense.driverId === 'object' ? (expense.driverId as any)._id : expense.driverId)
            : '',
          isRecurring: expense.isRecurring ?? false,
        })
      } else {
        reset({ currency: 'USD', isRecurring: false, tax: 0, date: new Date().toISOString().split('T')[0] })
      }
    }
  }, [isOpen, expense, reset])

  const mutation = useMutation({
    mutationFn: (values: ExpenseFormValues) => {
      const amount = Number(values.amount)
      const tax = Number(values.tax || 0)
      const totalAmount = amount + tax
      
      const payload = {
        category: values.category,
        amount,
        currency: values.currency,
        tax,
        totalAmount,
        date: values.date,
        description: values.description,
        vehicleId: values.vehicleId || undefined,
        driverId: values.driverId || undefined,
        paymentMethod: values.paymentMethod || undefined,
        vendorName: values.vendorName || undefined,
        invoiceNumber: values.invoiceNumber || undefined,
        isRecurring: values.isRecurring,
        notes: values.notes || undefined,
      }
      return isEditing ? expenseService.update(expense!._id, payload) : expenseService.create(payload)
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Expense updated' : 'Expense added')
      qc.invalidateQueries({ queryKey: ['expenses'] })
      qc.invalidateQueries({ queryKey: ['expense-stats'] })
      onClose()
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Expense' : 'Add Expense'}
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button loading={mutation.isPending} onClick={handleSubmit((v) => mutation.mutate(v))}>
            {isEditing ? 'Save Changes' : 'Add Expense'}
          </Button>
        </div>
      }
    >
      <form className="grid grid-cols-2 gap-4">
        <Select
          label="Category"
          options={categoryOptions}
          {...register('category')}
          error={errors.category?.message}
        />
        <Input
          label="Amount"
          type="number"
          step="0.01"
          leftAddon={<span className="text-xs text-slate-500">$</span>}
          {...register('amount')}
          error={errors.amount?.message}
        />
        <Input
          label="Tax"
          type="number"
          step="0.01"
          leftAddon={<span className="text-xs text-slate-500">$</span>}
          {...register('tax')}
          error={errors.tax?.message}
        />
        <div className="col-span-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-slate-700">Total Amount:</span>
            <span className="text-lg font-bold text-slate-900">
              ${totalAmount.toFixed(2)}
            </span>
          </div>
        </div>
        <Input
          label="Date"
          type="date"
          {...register('date')}
          error={errors.date?.message}
        />
        <Select
          label="Vehicle (optional)"
          options={vehicleOptions}
          {...register('vehicleId')}
          error={errors.vehicleId?.message}
        />
        <Select
          label="Driver (optional)"
          options={driverOptions}
          {...register('driverId')}
          error={errors.driverId?.message}
        />
        <div className="col-span-2">
          <Textarea
            label="Description"
            rows={2}
            {...register('description')}
            error={errors.description?.message}
          />
        </div>
        <div className="col-span-2 flex items-center gap-2">
          <input type="checkbox" id="isRecurring" {...register('isRecurring')} className="rounded border-slate-300" />
          <label htmlFor="isRecurring" className="text-sm text-slate-600">Recurring expense</label>
        </div>
      </form>
    </Modal>
  )
}
