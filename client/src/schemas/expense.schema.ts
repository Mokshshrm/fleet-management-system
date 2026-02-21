import { z } from 'zod'

export const expenseSchema = z.object({
  category: z.enum([
    'fuel',
    'maintenance',
    'repair',
    'insurance',
    'registration',
    'toll',
    'parking',
    'fine',
    'salary',
    'cleaning',
    'tire',
    'parts',
    'permit',
    'other',
  ]),
  amount: z.coerce.number().positive('Amount must be positive'),
  currency: z.string().default('USD'),
  tax: z.coerce.number().min(0).default(0),
  date: z.string().min(1, 'Date is required'),
  description: z.string().min(1, 'Description is required'),
  vehicleId: z.string().optional(),
  driverId: z.string().optional(),
  tripId: z.string().optional(),
  paymentMethod: z
    .enum(['cash', 'card', 'bank_transfer', 'cheque', 'fleet_card', 'credit', 'other'])
    .optional(),
  vendorName: z.string().optional(),
  invoiceNumber: z.string().optional(),
  isRecurring: z.boolean().default(false),
  notes: z.string().optional(),
})

export const rejectExpenseSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required'),
})

export type ExpenseFormValues = z.infer<typeof expenseSchema>
export type RejectExpenseFormValues = z.infer<typeof rejectExpenseSchema>
