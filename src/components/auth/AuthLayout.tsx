import type { ReactNode } from 'react'

interface AuthLayoutProps {
  children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-charcoal-50 px-4 py-12">
      <span className="mb-6 text-xl font-semibold text-heading">HRM Portal</span>
      <div className="w-full max-w-[420px] rounded-lg border border-card-border bg-white p-8 shadow-sm">
        {children}
      </div>
    </div>
  )
}
