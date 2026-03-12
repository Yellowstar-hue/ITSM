'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Plus, Search, Filter, RefreshCcw, Loader2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { PRIORITY_CONFIG, STATUS_CONFIG, TYPE_CONFIG, getSlaTimeLeft, getSlaStatus, formatRelativeTime, getInitials, truncate } from '@/lib/utils'
import { Ticket } from '@/types/ticket.types'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

const PAGE_LABELS: Record<string, string> = {
  incident: 'Incidents',
  service_request: 'Service Requests',
  problem: 'Problems',
  change: 'Changes',
}

export default function IncidentsPage() {
  const searchParams = useSearchParams()
  const defaultType = searchParams.get('type') || 'incident'
  const queryClient = useQueryClient()

  const [type, setType] = useState(defaultType)
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['tickets', { type, status, priority, search, page }],
    queryFn: () => api.get('/tickets', {
      params: { type, status: status || undefined, priority: priority || undefined, search: search || undefined, page, limit: 20 }
    }).then(r => r.data),
    keepPreviousData: true,
  })

  const tickets: Ticket[] = data?.items || []
  const total = data?.total || 0

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{PAGE_LABELS[type] || 'Tickets'}</h1>
          <p className="text-muted-foreground text-sm">{total} total {total !== 1 ? 'records' : 'record'}</p>
        </div>
        <Button asChild>
          <Link href={`/incidents/new?type=${type}`}>
            <Plus className="w-4 h-4 mr-1.5" />
            New {PAGE_LABELS[type]?.replace(/s$/, '')}
          </Link>
        </Button>
      </div>

      {/* Type tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
        {['incident', 'service_request', 'problem', 'change'].map(t => (
          <button key={t} onClick={() => { setType(t); setPage(1) }}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${type === t ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            {PAGE_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search tickets..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} className="pl-8" />
        </div>
        <Select value={status} onValueChange={v => { setStatus(v === 'all' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {['open', 'in_progress', 'pending', 'resolved', 'closed'].map(s => (
              <SelectItem key={s} value={s}>{STATUS_CONFIG[s as keyof typeof STATUS_CONFIG]?.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priority} onValueChange={v => { setPriority(v === 'all' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            {['critical', 'high', 'medium', 'low'].map(p => (
              <SelectItem key={p} value={p}>{PRIORITY_CONFIG[p as keyof typeof PRIORITY_CONFIG]?.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon" onClick={() => refetch()}>
          <RefreshCcw className="w-4 h-4" />
        </Button>
      </div>

      {/* Ticket list */}
      <Card className="overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[1fr,120px,100px,100px,140px] gap-4 px-4 py-2.5 border-b bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          <div>Title</div>
          <div>Status</div>
          <div>Priority</div>
          <div>Assignee</div>
          <div>SLA / Created</div>
        </div>

        {isLoading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="grid grid-cols-[1fr,120px,100px,100px,140px] gap-4 px-4 py-3.5">
                <div className="space-y-1.5"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div>
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-7 w-7 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-16 text-center">
            <AlertTriangle className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No tickets found</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {tickets.map((ticket, idx) => {
              const priorityConf = PRIORITY_CONFIG[ticket.priority]
              const statusConf = STATUS_CONFIG[ticket.status]
              const slaStatus = getSlaStatus(ticket.slaBreachAt)

              return (
                <motion.div key={ticket.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }}>
                  <Link href={`/incidents/${ticket.id}`}>
                    <div className="grid grid-cols-[1fr,120px,100px,100px,140px] gap-4 px-4 py-3.5 hover:bg-muted/30 transition-colors items-center group">
                      {/* Title */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-mono text-muted-foreground">{ticket.number}</span>
                          <Badge variant={ticket.type as any} className="text-xs py-0 px-1.5">{TYPE_CONFIG[ticket.type]?.label}</Badge>
                          {ticket.aiSentiment === 'urgent' || ticket.aiSentiment === 'frustrated' ? (
                            <span className="text-xs">😤</span>
                          ) : null}
                        </div>
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">{ticket.title}</p>
                        {ticket.category && <p className="text-xs text-muted-foreground mt-0.5">{ticket.category}</p>}
                      </div>

                      {/* Status */}
                      <div>
                        <Badge variant={ticket.status as any}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 inline-block`}
                            style={{ background: ticket.status === 'open' ? '#3b82f6' : ticket.status === 'in_progress' ? '#a855f7' : ticket.status === 'resolved' ? '#10b981' : ticket.status === 'pending' ? '#eab308' : '#94a3b8' }} />
                          {statusConf?.label}
                        </Badge>
                      </div>

                      {/* Priority */}
                      <div>
                        <Badge variant={ticket.priority as any}>{priorityConf?.label}</Badge>
                      </div>

                      {/* Assignee */}
                      <div>
                        {ticket.assigneeId ? (
                          <Avatar className="w-7 h-7">
                            <AvatarFallback className="text-xs bg-primary/20 text-primary font-semibold">
                              {ticket.assignee ? getInitials(`${ticket.assignee.firstName} ${ticket.assignee.lastName}`) : '??'}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <span className="text-xs text-muted-foreground">Unassigned</span>
                        )}
                      </div>

                      {/* SLA */}
                      <div className="space-y-0.5">
                        {ticket.slaBreachAt ? (
                          <div className={`text-xs font-mono font-medium ${slaStatus === 'breached' ? 'text-red-600 dark:text-red-400' : slaStatus === 'warning' ? 'text-orange-600 dark:text-orange-400 animate-pulse' : 'text-muted-foreground'}`}>
                            {slaStatus === 'breached' ? '🔴' : slaStatus === 'warning' ? '⚠️' : '🟢'} {getSlaTimeLeft(ticket.slaBreachAt)}
                          </div>
                        ) : null}
                        <div className="text-xs text-muted-foreground">{formatRelativeTime(ticket.createdAt)}</div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
            <p className="text-sm text-muted-foreground">Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, total)} of {total}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= data.pages}>Next</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
