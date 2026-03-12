'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useUIStore } from '@/store/ui.store'
import {
  LayoutDashboard, AlertTriangle, BookOpen, Server, Workflow,
  ShoppingCart, BarChart3, Bot, Settings, Plus, Search,
  GitBranch, RefreshCcw, Inbox
} from 'lucide-react'

const pages = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Incidents', href: '/incidents', icon: AlertTriangle },
  { label: 'Problems', href: '/problems', icon: RefreshCcw },
  { label: 'Changes', href: '/changes', icon: GitBranch },
  { label: 'Service Requests', href: '/service-requests', icon: Inbox },
  { label: 'Knowledge Base', href: '/knowledge', icon: BookOpen },
  { label: 'CMDB', href: '/cmdb', icon: Server },
  { label: 'Service Catalog', href: '/catalog', icon: ShoppingCart },
  { label: 'Workflows', href: '/workflows', icon: Workflow },
  { label: 'Reports', href: '/reports', icon: BarChart3 },
  { label: 'AI Assistant', href: '/ai-assistant', icon: Bot },
  { label: 'Settings', href: '/settings', icon: Settings },
]

const actions = [
  { label: 'New Incident', href: '/incidents/new?type=incident', icon: Plus },
  { label: 'New Service Request', href: '/incidents/new?type=service_request', icon: Plus },
  { label: 'New Problem', href: '/incidents/new?type=problem', icon: Plus },
  { label: 'New Change Request', href: '/incidents/new?type=change', icon: Plus },
]

export function CommandPalette() {
  const router = useRouter()
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore()
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!commandPaletteOpen) setQuery('')
  }, [commandPaletteOpen])

  const navigate = (href: string) => {
    setCommandPaletteOpen(false)
    router.push(href)
  }

  return (
    <Dialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <DialogContent className="p-0 gap-0 max-w-lg overflow-hidden">
        <Command className="rounded-xl" shouldFilter={true}>
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Search or jump to..."
              className="flex-1 h-12 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-sm text-muted-foreground">No results found.</Command.Empty>

            <Command.Group heading="Create New" className="[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
              {actions.map(action => (
                <Command.Item key={action.href} value={action.label} onSelect={() => navigate(action.href)}
                  className="flex items-center gap-2.5 px-2 py-2 rounded-md text-sm cursor-pointer aria-selected:bg-accent">
                  <action.icon className="w-4 h-4 text-primary" />
                  {action.label}
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Separator className="my-1 border-t border-border" />

            <Command.Group heading="Navigation">
              {pages.map(page => (
                <Command.Item key={page.href} value={page.label} onSelect={() => navigate(page.href)}
                  className="flex items-center gap-2.5 px-2 py-2 rounded-md text-sm cursor-pointer aria-selected:bg-accent">
                  <page.icon className="w-4 h-4 text-muted-foreground" />
                  {page.label}
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
          <div className="flex items-center gap-3 border-t border-border px-3 py-2 text-xs text-muted-foreground">
            <span>↑↓ navigate</span>
            <span>↵ select</span>
            <span>Esc close</span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
