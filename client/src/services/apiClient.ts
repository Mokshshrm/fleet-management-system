import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://192.168.10.21:8000/api'

// Storage keys
const ACCESS_TOKEN_KEY = 'ff_access_token'
const REFRESH_TOKEN_KEY = 'ff_refresh_token'

// ─── Token Helpers ──────────────────────────────────────────────────────────

export const tokenStorage = {
  getAccess: () => sessionStorage.getItem(ACCESS_TOKEN_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setAccess: (token: string) => sessionStorage.setItem(ACCESS_TOKEN_KEY, token),
  setRefresh: (token: string) => localStorage.setItem(REFRESH_TOKEN_KEY, token),
  clear: () => {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },
}

// ─── Axios Instance ──────────────────────────────────────────────────────────

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
})

// ─── Request Interceptor ─────────────────────────────────────────────────────

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.getAccess()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// ─── Token Refresh State ─────────────────────────────────────────────────────

let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token!)
  })
  failedQueue = []
}

// ─── Response Interceptor ────────────────────────────────────────────────────

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            return apiClient(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = tokenStorage.getRefresh()
      if (!refreshToken) {
        tokenStorage.clear()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
          refreshToken,
        })
        const newToken: string = data.data.accessToken
        tokenStorage.setAccess(newToken)
        processQueue(null, newToken)
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
        }
        return apiClient(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        tokenStorage.clear()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    // Normalize error
    const message =
      (error.response?.data as { message?: string })?.message ??
      error.message ??
      'An unexpected error occurred'

    return Promise.reject(new ApiError(message, error.response?.status ?? 0, error))
  },
)

// ─── ApiError ────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public originalError: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export default apiClient
