import { z } from 'zod'

export const maintenanceSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  type: z.enum(['preventive', 'corrective', 'inspection', 'repair', 'emergency']),
  category: z
    .enum(['engine', 'transmission', 'brakes', 'tires', 'electrical', 'body', 'oil_change', 'general', 'other'])
    .default('general'),
  description: z.string().min(1, 'Description is required'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  scheduledDate: z.string().min(1, 'Scheduled date is required'),
  serviceProviderType: z.enum(['internal', 'external']).optional(),
  serviceProviderName: z.string().optional(),
  serviceProviderContact: z.string().optional(),
  costTotal: z.coerce.number().min(0).default(0),
  costCurrency: z.string().default('USD'),
  notes: z.string().optional(),
  status: z
    .enum(['scheduled', 'in_progress', 'completed', 'cancelled'])
    .default('scheduled'),
})

export const completeMaintenanceSchema = z.object({
  completedAt: z.string().min(1, 'Completion date is required'),
  notes: z.string().optional(),
})

export type MaintenanceFormValues = z.infer<typeof maintenanceSchema>
export type CompleteMaintenanceFormValues = z.infer<typeof completeMaintenanceSchema>
