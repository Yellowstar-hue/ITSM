'use client'

import { useState } from 'react'
import { Search, Bell, Plus, Moon, Sun, ChevronDown, X } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { getInitials } from '@/lib/utils'
import { useNotifications } from '@/hooks/use-notifications'
import { NotificationsPanel } from '@/components/notifications/notifications-panel'
import Link from 'next/link'
import { useHotkeys } from 'react-hotkeys-hook'

export function Header() {
  const { user, logout } = useAuthStore()
  const { setCommandPaletteOpen } = useUIStore()
  const { theme, setTheme } = useTheme()
  const { unreadCount } = useNotifications()
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  useHotkeys('meta+k, ctrl+k', (e) => {
    e.preventDefault()
    setCommandPaletteOpen(true)
  }, { enableOnFormTags: false })

  return (
    <header className="flex items-center justify-between h-14 px-4 border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-20">
      {/* Search trigger */}
      <button
        onClick={() => setCommandPaletteOpen(true)}
        className="flex items-center gap-2 h-8 px-3 rounded-md border border-input bg-muted/50 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors min-w-[200px] lg:min-w-[300px]"
      >
        <Search className="w-3.5 h-3.5" />
        <span>Search everything...</span>
        <kbd className="ml-auto hidden sm:flex items-center gap-0.5 text-xs border border-border/60 rounded px-1.5 py-0.5 font-mono bg-background">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* New ticket */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New</span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Create New</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/incidents/new?type=incident">🔥 Incident</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/incidents/new?type=service_request">📋 Service Request</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/incidents/new?type=problem">🔍 Problem</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/incidents/new?type=change">🔄 Change Request</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme toggle */}
        <Button variant="ghost" size="icon-sm" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>

        {/* Notifications */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon-sm"
            className="relative"
            onClick={() => setNotificationsOpen((v) => !v)}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-destructive rounded-full text-[9px] font-bold text-white flex items-center justify-center px-0.5">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Button>

          {notificationsOpen && (
            <div className="absolute right-0 top-10 w-80 max-h-[500px] border border-border rounded-xl shadow-xl bg-background overflow-hidden z-50 flex flex-col">
              <NotificationsPanel onClose={() => setNotificationsOpen(false)} />
            </div>
          )}
        </div>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 pl-2">
              <Avatar className="w-6 h-6">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  {user ? getInitials(`${user.firstName} ${user.lastName}`) : '??'}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline text-sm">{user?.firstName}</span>
              <ChevronDown className="w-3 h-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="font-semibold">{user?.firstName} {user?.lastName}</div>
              <div className="text-xs text-muted-foreground font-normal">{user?.email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive">Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
