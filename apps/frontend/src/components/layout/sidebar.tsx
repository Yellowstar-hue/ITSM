'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/store/ui.store'
import { useAuthStore } from '@/store/auth.store'
import {
  LayoutDashboard, AlertTriangle, BookOpen, Server, Workflow,
  ShoppingCart, BarChart3, Bot, Settings, ChevronLeft, ChevronRight,
  GitBranch, RefreshCcw, Inbox, Shield, Zap, LogOut, User
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { getInitials } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Incidents', href: '/incidents', icon: AlertTriangle, badge: 'inc' },
  { label: 'Problems', href: '/problems', icon: RefreshCcw },
  { label: 'Changes', href: '/changes', icon: GitBranch },
  { label: 'Service Requests', href: '/service-requests', icon: Inbox },
  null, // separator
  { label: 'Knowledge', href: '/knowledge', icon: BookOpen },
  { label: 'CMDB', href: '/cmdb', icon: Server },
  { label: 'Service Catalog', href: '/catalog', icon: ShoppingCart },
  { label: 'Workflows', href: '/workflows', icon: Workflow },
  null,
  { label: 'Reports', href: '/reports', icon: BarChart3 },
  { label: 'AI Assistant', href: '/ai-assistant', icon: Bot },
  null,
  { label: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const { user, logout } = useAuthStore()

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarOpen ? 240 : 64 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="relative flex flex-col bg-sidebar border-r border-sidebar-border h-full overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 h-14 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shrink-0 shadow-md">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}>
              <span className="font-bold text-sidebar-foreground text-base tracking-tight">SimpleNow</span>
              <span className="ml-1.5 text-xs text-sidebar-primary/70 font-medium">ITSM</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map((item, idx) => {
          if (!item) {
            return <div key={idx} className="my-2 border-t border-sidebar-border/50" />
          }
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                'flex items-center gap-3 px-2.5 py-2 rounded-md text-sm font-medium transition-all duration-100 group cursor-pointer',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-foreground'
                  : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
              )}>
                <Icon className={cn('w-4 h-4 shrink-0', isActive && 'text-sidebar-primary')} />
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }}
                      className="truncate">
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {isActive && sidebarOpen && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-sidebar-primary" />
                )}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* User footer */}
      {user && (
        <div className="p-2 border-t border-sidebar-border">
          <div className={cn('flex items-center gap-2.5 p-2 rounded-md', sidebarOpen && 'hover:bg-sidebar-accent cursor-pointer')}>
            <Avatar className="w-7 h-7 shrink-0">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="text-xs bg-sidebar-primary text-white">{getInitials(`${user.firstName} ${user.lastName}`)}</AvatarFallback>
            </Avatar>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-sidebar-foreground truncate">{user.firstName} {user.lastName}</div>
                  <div className="text-xs text-sidebar-foreground/50 capitalize truncate">{user.role}</div>
                </motion.div>
              )}
            </AnimatePresence>
            {sidebarOpen && (
              <Button variant="ghost" size="icon-sm" onClick={logout} className="text-sidebar-foreground/50 hover:text-destructive hover:bg-transparent shrink-0">
                <LogOut className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-6 w-6 h-6 rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground/60 hover:text-sidebar-foreground flex items-center justify-center shadow-sm z-10 transition-colors"
      >
        {sidebarOpen ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>
    </motion.aside>
  )
}
