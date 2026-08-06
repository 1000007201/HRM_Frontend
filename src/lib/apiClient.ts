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

// Backend envelope (every route except /api/auth/*): { success, data } on
// success, { success: false, error: { code, message, details? } } on failure.
interface ApiEnvelope<TResponse> {
  success: boolean
  data?: TResponse
  error?: { code: string; message: string; details?: unknown }
}

export async function apiFetch<TResponse>(path: string, init?: RequestInit): Promise<TResponse> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      credentials: 'include',
      ...init,
      headers: {
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
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
