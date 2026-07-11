import axios, { AxiosError } from 'axios'
import type { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios'
import router from '@/router'
import { secureGet, secureRemove } from '@/lib/crypto'
import { getServiceConfig, type ServiceName } from '@/lib/config'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ApiResponse<T = unknown> {
  data: T
  message?: string
  meta?: PaginationMeta
}

export interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
  status: number
}

// ---------------------------------------------------------------------------
// Instance factory — bisa bikin instance per service
// ---------------------------------------------------------------------------

const instances = new Map<ServiceName, AxiosInstance>()

function createInstance(service: ServiceName): AxiosInstance {
  const config = getServiceConfig(service)

  const instance = axios.create({
    baseURL: config.baseURL,
    timeout: config.timeout ?? 30_000,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...config.headers,
    },
  })

  // --- Request Interceptor ---
  instance.interceptors.request.use(
    async (reqConfig: InternalAxiosRequestConfig) => {
      const token = await secureGet('auth_token')
      if (token) {
        reqConfig.headers.Authorization = `Bearer ${token}`
      }

      const locale = localStorage.getItem('app_locale') ?? 'id'
      reqConfig.headers['Accept-Language'] = locale

      return reqConfig
    },
    (error) => Promise.reject(error),
  )

  // --- Response Interceptor ---
  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<{ message?: string; errors?: Record<string, string[]> }>) => {
      // Network error / timeout
      if (!error.response) {
        const apiError: ApiError = {
          message: 'Koneksi gagal. Periksa jaringan internet kamu.',
          status: 0,
        }
        return Promise.reject(apiError)
      }

      const { status, data } = error.response

      const apiError: ApiError = {
        message: data?.message ?? getDefaultMessage(status),
        errors: data?.errors,
        status,
      }

      // 401 Unauthorized — force logout & redirect
      if (status === 401) {
        secureRemove('auth_token')
        secureRemove('auth_user')
        router.push({ name: 'login' })
      }

      // 403 Forbidden
      if (status === 403) {
        apiError.message = data?.message ?? 'Kamu tidak punya akses untuk melakukan ini.'
      }

      // 419 CSRF token mismatch (Laravel)
      if (status === 419) {
        apiError.message = 'Sesi telah kadaluarsa. Silakan refresh halaman.'
      }

      // 429 Too many requests
      if (status === 429) {
        apiError.message = 'Terlalu banyak permintaan. Coba lagi nanti.'
      }

      // 500+ Server error
      if (status >= 500) {
        apiError.message = 'Terjadi kesalahan di server. Coba lagi nanti.'
      }

      return Promise.reject(apiError)
    },
  )

  return instance
}

function getDefaultMessage(status: number): string {
  const messages: Record<number, string> = {
    400: 'Permintaan tidak valid.',
    401: 'Sesi telah berakhir. Silakan login kembali.',
    403: 'Akses ditolak.',
    404: 'Data tidak ditemukan.',
    422: 'Data yang dikirim tidak valid.',
    429: 'Terlalu banyak permintaan.',
    500: 'Terjadi kesalahan di server.',
  }
  return messages[status] ?? `Terjadi kesalahan (${status}).`
}

/**
 * Get (or create) an axios instance for a given service.
 */
export function useHttp(service: ServiceName = 'main'): AxiosInstance {
  if (!instances.has(service)) {
    instances.set(service, createInstance(service))
  }
  return instances.get(service)!
}

// ---------------------------------------------------------------------------
// Default instance (main service)
// ---------------------------------------------------------------------------

const http = useHttp('main')

// ---------------------------------------------------------------------------
// Convenience helpers — all use the main service by default
// ---------------------------------------------------------------------------

export function get<T = unknown>(url: string, config?: AxiosRequestConfig) {
  return http.get<ApiResponse<T>>(url, config).then((r) => r.data)
}

export function post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) {
  return http.post<ApiResponse<T>>(url, data, config).then((r) => r.data)
}

export function put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) {
  return http.put<ApiResponse<T>>(url, data, config).then((r) => r.data)
}

export function patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) {
  return http.patch<ApiResponse<T>>(url, data, config).then((r) => r.data)
}

export function del<T = unknown>(url: string, config?: AxiosRequestConfig) {
  return http.delete<ApiResponse<T>>(url, config).then((r) => r.data)
}

/**
 * Upload file(s) with multipart/form-data.
 */
export function upload<T = unknown>(
  url: string,
  formData: FormData,
  onProgress?: (percent: number) => void,
) {
  return http
    .post<ApiResponse<T>>(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded / e.total) * 100))
        }
      },
    })
    .then((r) => r.data)
}

/**
 * Download file as Blob.
 */
export function download(url: string, config?: AxiosRequestConfig) {
  return http.get<Blob>(url, { ...config, responseType: 'blob' })
}

export { http }
export default http
