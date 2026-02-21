import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns'

// ─── Class utility ────────────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

export function formatDate(date: string | Date | undefined | null, fmt = 'MMM d, yyyy'): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(d)) return '—'
  return format(d, fmt)
}

export function formatDateTime(date: string | Date | undefined | null): string {
  return formatDate(date, 'MMM d, yyyy HH:mm')
}

export function timeAgo(date: string | Date | undefined | null): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(d)) return '—'
  return formatDistanceToNow(d, { addSuffix: true })
}

export function isLicenseExpiringSoon(expiryDate: string, daysThreshold = 30): boolean {
  const exp = parseISO(expiryDate)
  if (!isValid(exp)) return false
  const daysLeft = (exp.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  return daysLeft <= daysThreshold && daysLeft > 0
}

export function isLicenseExpired(expiryDate: string): boolean {
  const exp = parseISO(expiryDate)
  if (!isValid(exp)) return false
  return exp.getTime() < Date.now()
}

// ─── Currency ─────────────────────────────────────────────────────────────────

export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

// ─── String helpers ───────────────────────────────────────────────────────────

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function humanize(str: string): string {
  return str
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .split(' ')
    .map(capitalize)
    .join(' ')
    .trim()
}

export function truncate(str: string, len = 50): string {
  if (str.length <= len) return str
  return str.slice(0, len) + '…'
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase()
}

// ─── Misc ─────────────────────────────────────────────────────────────────────

export function getErrorMessage(err: unknown): string {
  if (typeof err === 'string') return err
  if (err instanceof Error) return err.message
  return 'An unexpected error occurred'
}

export function buildQueryString(params: Record<string, unknown>): string {
  const filtered = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  )
  return filtered.length ? '?' + new URLSearchParams(filtered as [string, string][]).toString() : ''
}

export function downloadCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return
  const headers = Object.keys(data[0])
  const rows = data.map((row) =>
    headers.map((h) => JSON.stringify(row[h] ?? '')).join(','),
  )
  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
