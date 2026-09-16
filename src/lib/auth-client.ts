import { createAuthClient } from 'better-auth/react'
import { organizationClient } from 'better-auth/client/plugins'

// Defaults to whatever host loaded this page (localhost, or a LAN IP when
// opened from another device) so the same build works from both without
// picking one in VITE_API_BASE_URL. Override the env var for setups where
// the API isn't on the same host as the frontend (e.g. production).
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? `http://${window.location.hostname}:4000`

export const authClient = createAuthClient({
  baseURL: API_BASE_URL,
  plugins: [organizationClient()],
})
