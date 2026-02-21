import { z } from 'zod'

export const driverSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().min(7, 'Phone number is required'),
  dateOfBirth: z.string().optional(),
  profileImage: z.string().optional(),
  // license nested object
  licenseNumber: z.string().min(1, 'License number is required'),
  licenseCategory: z.enum(['car', 'van', 'truck', 'bike', 'commercial', 'heavy']).default('car'),
  licenseIssueDate: z.string().optional(),
  licenseExpiryDate: z.string().min(1, 'License expiry is required'),
  licenseIssuingAuthority: z.string().optional(),
  status: z
    .enum(['on_duty', 'off_duty', 'on_trip', 'suspended', 'terminated'])
    .default('on_duty'),
  employmentType: z
    .enum(['full_time', 'part_time', 'contract', 'temporary'])
    .optional(),
  hireDate: z.string().optional(),
  notes: z.string().optional(),
})

export const incidentSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  type: z.enum(['accident', 'violation', 'complaint', 'other']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  description: z.string().min(1, 'Description is required'),
  location: z.string().optional(),
  resolved: z.boolean().default(false),
})

export const safetyScoreSchema = z.object({
  score: z.coerce.number().min(0).max(100, 'Score must be 0-100'),
  reason: z.string().min(1, 'Reason is required'),
})

export type DriverFormValues = z.infer<typeof driverSchema>
export type IncidentFormValues = z.infer<typeof incidentSchema>
export type SafetyScoreFormValues = z.infer<typeof safetyScoreSchema>
