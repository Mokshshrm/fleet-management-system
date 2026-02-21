// ─── Core API types ────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  status: 'success' | 'error'
  data?: T
  message?: string
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  pages: number
}

export interface PaginatedResponse<T> {
  status: 'success'
  data: T
  pagination: PaginationMeta
}

export interface MonetaryValue {
  value: number
  currency: string
}

export interface MeasurementValue {
  value: number
  unit: string
}

export interface Coordinates {
  latitude: number
  longitude: number
}

// ─── User & Auth ──────────────────────────────────────────────────────────

export type UserRole =
  | 'owner'
  | 'admin'
  | 'fleet_manager'
  | 'dispatcher'
  | 'driver'
  | 'safety_officer'
  | 'financial_analyst'

export interface User {
  _id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: UserRole
  isActive: boolean
  isEmailVerified?: boolean
  lastLogin?: string
  companyId: string
  createdAt: string
  updatedAt: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthUser {
  userId: string
  email: string
  role: UserRole
  firstName: string
  lastName: string
  permissions?: string[]
}

export interface LoginResponse {
  user: AuthUser
  accessToken: string
  refreshToken: string
  permissions?: string[]
}

export interface MeResponse {
  user: User
  permissions: string[]
  role: UserRole
}

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled'

export interface UserInvitation {
  _id: string
  companyId: string
  invitedBy: string
  email: string
  role: UserRole
  token: string
  status: InvitationStatus
  expiresAt: string
  acceptedAt?: string
  message?: string
  createdAt: string
  updatedAt: string
}

export interface RegisterPayload {
  companyName: string
  email: string
  password: string
  firstName: string
  lastName: string
  phone: string
}

// ─── Vehicle ──────────────────────────────────────────────────────────────

export type VehicleType = 'truck' | 'van' | 'bike' | 'car' | 'other'

export type VehicleStatus =
  | 'available'
  | 'on_trip'
  | 'in_shop'
  | 'out_of_service'
  | 'retired'

export type FuelType = 'petrol' | 'diesel' | 'electric' | 'hybrid' | 'cng' | 'lpg'

export interface Vehicle {
  _id: string
  companyId: string
  name: string
  vehicleType: VehicleType
  licensePlate: string
  make?: string
  model?: string
  year?: number
  vin?: string
  maxLoadCapacity: {
    value: number
    unit: 'kg' | 'tons' | 'lbs'
  }
  odometer: {
    current: number
    unit: 'km' | 'miles'
    lastUpdated?: string
  }
  fuelType: FuelType
  fuelCapacity?: {
    value?: number
    unit?: 'liters' | 'gallons'
  }
  status: VehicleStatus
  registration?: {
    number?: string
    expiryDate?: string
  }
  insurance?: {
    provider?: string
    policyNumber?: string
    expiryDate?: string
    premium?: number
  }
  acquisitionDate?: string
  acquisitionCost?: number
  currentValue?: number
  region?: string
  notes?: string
  images?: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface VehicleStats {
  total: number
  available: number
  on_trip: number
  in_shop: number
  out_of_service: number
  retired: number
}

// ─── Driver ───────────────────────────────────────────────────────────────

export type DriverStatus =
  | 'on_duty'
  | 'off_duty'
  | 'on_trip'
  | 'suspended'
  | 'terminated'

export type LicenseCategory = 'car' | 'van' | 'truck' | 'bike' | 'commercial' | 'heavy'

export type DriverEmploymentType = 'full_time' | 'part_time' | 'contract' | 'temporary'

export interface DriverSafetyScoreHistory {
  score: number
  date: string
  reason?: string
}

export interface DriverIncident {
  _id?: string
  date: string
  type: 'accident' | 'violation' | 'complaint' | 'other'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description?: string
  location?: string
  resolved?: boolean
}

export interface DriverCertification {
  name: string
  issueDate?: string
  expiryDate?: string
  issuingBody?: string
}

export interface Driver {
  _id: string
  companyId: string
  userId?: string
  firstName: string
  lastName: string
  email?: string
  phone: string
  dateOfBirth?: string
  profileImage?: string
  license: {
    number: string
    category: LicenseCategory[]
    issueDate?: string
    expiryDate: string
    issuingAuthority?: string
  }
  status: DriverStatus
  employmentType?: DriverEmploymentType
  hireDate?: string
  terminationDate?: string
  address?: {
    street?: string
    city?: string
    state?: string
    country?: string
  }
  emergencyContact?: {
    name?: string
    relationship?: string
    phone?: string
  }
  salary?: {
    amount?: number
    currency?: string
    payPeriod?: string
  }
  safetyScore: {
    current: number
    history?: DriverSafetyScoreHistory[]
  }
  performance: {
    totalTrips: number
    completedTrips: number
    cancelledTrips: number
    totalDistance: MeasurementValue
    averageRating: number
  }
  incidents: DriverIncident[]
  certifications?: DriverCertification[]
  notes?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface DriverPerformance {
  driver: Driver
  totalTrips: number
  completedTrips: number
  cancelledTrips: number
  totalDistance: number
  avgRating: number
  safetyScore: number
  onTimeDeliveryRate: number
  fuelEfficiency: number
}

// ─── Trip ─────────────────────────────────────────────────────────────────

export type TripStatus =
  | 'draft'
  | 'dispatched'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export interface TripLocation {
  name?: string
  address: string
  city?: string
  state?: string
  country?: string
  coordinates?: Coordinates
  contactPerson?: string
  contactPhone?: string
}

export interface Trip {
  _id: string
  companyId: string
  tripNumber?: string
  vehicleId: string | Vehicle
  driverId: string | Driver
  status: TripStatus
  cargo?: {
    description?: string
    weight?: {
      value: number
      unit: 'kg' | 'tons' | 'lbs'
    }
    quantity?: number
    value?: number
    type?: string
  }
  origin: TripLocation
  destination: TripLocation
  schedule: {
    plannedDepartureTime: string
    plannedArrivalTime?: string
    actualDepartureTime?: string
    actualArrivalTime?: string
  }
  odometer?: {
    start?: number
    end?: number
    unit?: 'km' | 'miles'
  }
  distance?: {
    planned?: number
    actual?: number
    unit?: 'km' | 'miles'
  }
  revenue?: {
    amount?: number
    currency?: string
  }
  customerInfo?: {
    name?: string
    company?: string
    email?: string
    phone?: string
    reference?: string
  }
  documents?: {
    name?: string
    type?: 'invoice' | 'receipt' | 'pod' | 'manifest' | 'other'
    url?: string
    uploadedAt?: string
  }[]
  proofOfDelivery?: {
    signature?: string
    recipientName?: string
    receivedAt?: string
    photos?: string[]
    notes?: string
  }
  rating?: {
    score: number
    feedback?: string
    ratedAt?: string
  }
  notes?: string
  cancelReason?: string
  cancelledAt?: string
  createdBy?: string
  createdAt: string
  updatedAt: string
}

// ─── Maintenance ──────────────────────────────────────────────────────────

export type MaintenanceType =
  | 'preventive'
  | 'corrective'
  | 'inspection'
  | 'repair'
  | 'emergency'

export type MaintenanceCategory =
  | 'engine'
  | 'transmission'
  | 'brakes'
  | 'tires'
  | 'electrical'
  | 'body'
  | 'oil_change'
  | 'general'
  | 'other'

export type MaintenanceStatus =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export interface MaintenancePart {
  name: string
  partNumber?: string
  quantity: number
  unitCost?: number
  totalCost?: number
  supplier?: string
}

export interface MaintenanceLog {
  _id: string
  companyId: string
  vehicleId: string | Vehicle
  maintenanceNumber?: string
  type: MaintenanceType
  category?: MaintenanceCategory
  description: string
  status: MaintenanceStatus
  priority: 'low' | 'medium' | 'high' | 'critical'
  schedule: {
    scheduledDate: string
    startedAt?: string
    completedAt?: string
  }
  odometer?: {
    value?: number
    unit?: 'km' | 'miles'
  }
  serviceProvider?: {
    type?: 'internal' | 'external'
    name?: string
    contact?: string
    address?: string
  }
  parts?: MaintenancePart[]
  labor?: {
    hours?: number
    hourlyRate?: number
    totalCost?: number
    technician?: string
  }
  cost: {
    parts?: number
    labor?: number
    other?: number
    tax?: number
    total: number
    currency?: string
  }
  warranty?: {
    covered?: boolean
    validUntil?: string
    provider?: string
  }
  nextServiceDue?: {
    date?: string
    odometerValue?: number
  }
  notes?: string
  documents?: {
    name?: string
    type?: 'invoice' | 'receipt' | 'report' | 'photo' | 'other'
    url?: string
    uploadedAt?: string
  }[]
  photos?: string[]
  cancelReason?: string
  createdAt: string
  updatedAt: string
}

export interface MaintenanceStats {
  total: number
  scheduled: number
  in_progress: number
  completed: number
  cancelled: number
  totalCost: number
}

// ─── Fuel ─────────────────────────────────────────────────────────────────

export interface FuelLog {
  _id: string
  companyId: string
  vehicleId: string | Vehicle
  driverId?: string | Driver
  tripId?: string | Trip
  date: string
  fuelType: FuelType
  quantity: {
    value: number
    unit: 'liters' | 'gallons' | 'kwh'
  }
  cost: {
    pricePerUnit: number
    total: number
    currency: string
  }
  odometer: {
    value: number
    unit: 'km' | 'miles'
  }
  location?: {
    name?: string
    address?: string
    city?: string
    state?: string
    coordinates?: Coordinates
  }
  station?: {
    name?: string
    brand?: string
  }
  fuelEfficiency?: {
    value?: number
    unit?: 'km/l' | 'miles/gal' | 'l/100km'
  }
  isFull: boolean
  paymentMethod?: 'cash' | 'card' | 'fleet_card' | 'credit' | 'other'
  receiptNumber?: string
  receiptImage?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface FuelStats {
  totalQuantity: number
  totalCost: number
  avgEfficiency: number
  logsCount: number
}

// ─── Expense ──────────────────────────────────────────────────────────────

export type ExpenseCategory =
  | 'fuel'
  | 'maintenance'
  | 'repair'
  | 'insurance'
  | 'registration'
  | 'toll'
  | 'parking'
  | 'fine'
  | 'salary'
  | 'cleaning'
  | 'tire'
  | 'parts'
  | 'permit'
  | 'other'

export type ExpensePaymentStatus = 'pending' | 'paid' | 'overdue' | 'cancelled'
export type ExpenseApprovalStatus = 'pending' | 'approved' | 'rejected'
export type ExpensePaymentMethod =
  | 'cash'
  | 'card'
  | 'bank_transfer'
  | 'cheque'
  | 'fleet_card'
  | 'credit'
  | 'other'

// kept for backward compat in filter/display code
export type ExpenseStatus = ExpenseApprovalStatus

export interface Expense {
  _id: string
  companyId: string
  expenseNumber?: string
  vehicleId?: string | Vehicle
  driverId?: string | Driver
  tripId?: string | Trip
  category: ExpenseCategory
  date: string
  description: string
  amount: number
  currency: string
  tax?: number
  totalAmount: number
  paymentMethod?: ExpensePaymentMethod
  paymentStatus?: ExpensePaymentStatus
  vendor?: {
    name?: string
    contact?: string
    email?: string
    phone?: string
  }
  invoiceNumber?: string
  invoiceDate?: string
  dueDate?: string
  paidDate?: string
  receiptNumber?: string
  receiptImage?: string
  isRecurring?: boolean
  recurringSchedule?: {
    frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
    startDate?: string
    endDate?: string
    nextDate?: string
  }
  isBillable?: boolean
  approvalStatus?: ExpenseApprovalStatus
  approvedBy?: string
  approvedAt?: string
  notes?: string
  tags?: string[]
  recordedBy?: string
  createdAt: string
  updatedAt: string
}

export interface ExpenseStats {
  totalAmount: number
  approved: number
  pending: number
  rejected: number
  byCategory: Record<string, number>
}

// ─── Analytics ────────────────────────────────────────────────────────────

export interface DashboardStats {
  activeVehicles: number
  totalVehicles: number
  activeDrivers: number
  totalDrivers: number
  tripsToday: number
  tripsInProgress: number
  pendingMaintenance: number
  maintenanceAlerts: number
  pendingExpenses: number
  utilizationRate: number
  monthlyRevenue?: MonetaryValue
  monthlyExpenses?: MonetaryValue
}

export interface FleetOverview {
  vehiclesByType: Record<string, number>
  vehiclesByStatus: Record<string, number>
  tripsByStatus: Record<string, number>
  recentTrips: Trip[]
  upcomingMaintenance: MaintenanceLog[]
}
