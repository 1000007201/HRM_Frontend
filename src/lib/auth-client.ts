import { createAuthClient } from 'better-auth/react'
import { organizationClient } from 'better-auth/client/plugins'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000'

export const authClient = createAuthClient({
  baseURL: API_BASE_URL,
  plugins: [organizationClient()],
})
