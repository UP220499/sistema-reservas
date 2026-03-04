"use client"

import { useState, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-media-query"

const SIDEBAR_WIDTH = 260
const SIDEBAR_MINI = 72

export function AppShell({ children }: { children: React.ReactNode }) {
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (isMobile) {
      setMobileOpen(false)
    }
  }, [isMobile])

  const sidebarWidth = collapsed ? SIDEBAR_MINI : SIDEBAR_WIDTH

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      {!isMobile && (
        <aside
          className="hidden shrink-0 md:block transition-all duration-200 ease-in-out"
          style={{ width: sidebarWidth }}
        >
          <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        </aside>
      )}

      {/* Mobile sidebar overlay */}
      {isMobile && mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-[260px]">
            <AppSidebar
              collapsed={false}
              onToggle={() => setCollapsed(!collapsed)}
              onMobileClose={() => setMobileOpen(false)}
            />
          </aside>
        </>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader
          onMenuClick={() => setMobileOpen(!mobileOpen)}
          isMobile={isMobile}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
