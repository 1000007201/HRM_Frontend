import { API_BASE_URL } from './auth-client'

export class ApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

// The backend's error.message is written to be shown to users, so prefer it
// whenever the failure came from the API and fall back only for the unexpected
// (a thrown TypeError, an aborted request). Pages that need to branch on a
// specific status keep doing `error instanceof ApiError && error.status === 404`
// — that's per-page messaging, not this.
export const errorMessage = (error: unknown, fallback: string): string =>
  error instanceof ApiError ? error.message : fallback

// Backend envelope (every route except /api/auth/*): { success, data } on
// success, { success: false, error: { code, message, details? } } on failure.
interface ApiEnvelope<TResponse> {
  success: boolean
  data?: TResponse
  error?: { code: string; message: string; details?: unknown }
}

export async function apiFetch<TResponse>(path: string, init?: RequestInit): Promise<TResponse> {
  // FormData (file uploads) must NOT get a manual Content-Type — fetch sets
  // its own with the multipart boundary, and overriding it breaks parsing.
  const isFormData = init?.body instanceof FormData

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      credentials: 'include',
      ...init,
      headers: {
        ...(init?.body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
    })
  } catch {
    throw new ApiError('Could not reach the server. Check your connection and try again.', 0)
  }

  const body: ApiEnvelope<TResponse> | null = await response.json().catch(() => null)
  if (!response.ok || !body?.success) {
    throw new ApiError(
      body?.error?.message ?? 'Something went wrong. Please try again.',
      response.status,
      body?.error?.code,
    )
  }
  return body.data as TResponse
}
