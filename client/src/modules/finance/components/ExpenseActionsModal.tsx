import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { expenseService } from '@/services'
import { rejectExpenseSchema, type RejectExpenseFormValues } from '@/schemas'
import type { Expense } from '@/types'
import { Modal, Button, Textarea, StatusBadge } from '@/components/ui'
import { formatDate, formatCurrency, getErrorMessage, humanize } from '@/utils'

interface Props {
  isOpen: boolean
  expense?: Expense
  onClose: () => void
}

type View = 'main' | 'reject'

export function ExpenseActionsModal({ isOpen, expense, onClose }: Props) {
  const qc = useQueryClient()
  const [view, setView] = useState<View>('main')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RejectExpenseFormValues>({
    resolver: zodResolver(rejectExpenseSchema),
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['expenses'] })
    qc.invalidateQueries({ queryKey: ['expense-stats'] })
  }

  const approveMutation = useMutation({
    mutationFn: () => expenseService.approve(expense!._id),
    onSuccess: () => { toast.success('Expense approved'); invalidate(); onClose() },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ reason }: RejectExpenseFormValues) => expenseService.reject(expense!._id, reason),
    onSuccess: () => { toast.success('Expense rejected'); invalidate(); onClose() },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const handleClose = () => { setView('main'); reset(); onClose() }

  if (!expense) return null

  if (view === 'reject') {
    return (
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Reject Expense"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setView('main')}>Back</Button>
            <Button
              variant="danger"
              loading={rejectMutation.isPending}
              onClick={handleSubmit((v) => rejectMutation.mutate(v))}
            >
              Reject Expense
            </Button>
          </div>
        }
      >
        <form className="space-y-3">
          <Textarea
            label="Rejection Reason"
            rows={3}
            {...register('reason')}
            error={errors.reason?.message}
          />
        </form>
      </Modal>
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Review Expense"
      size="sm"
      footer={<Button variant="secondary" onClick={handleClose}>Close</Button>}
    >
      <div className="space-y-4">
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-800">
              {formatCurrency(expense.amount ?? 0, expense.currency)}
            </span>
            <StatusBadge status={expense.approvalStatus ?? expense.paymentStatus ?? 'pending'} />
          </div>
          <p className="text-slate-600">{expense.description}</p>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{humanize(expense.category)}</span>
            <span>{formatDate(expense.date)}</span>
          </div>
        </div>

        {expense.approvalStatus === 'pending' && (
          <div className="space-y-2">
            <Button
              className="w-full justify-start"
              variant="secondary"
              leftIcon={<CheckCircle size={15} className="text-emerald-600" />}
              loading={approveMutation.isPending}
              onClick={() => approveMutation.mutate()}
            >
              Approve Expense
            </Button>
            <Button
              className="w-full justify-start"
              variant="danger"
              leftIcon={<XCircle size={15} />}
              onClick={() => { reset(); setView('reject') }}
            >
              Reject Expense
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
