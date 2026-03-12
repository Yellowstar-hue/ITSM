'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import Link from 'next/link'
import {
  ArrowLeft, Brain, Clock, User, Tag, Zap, MessageSquare,
  FileText, Edit, CheckCircle2, AlertTriangle, Sparkles, Send
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { PRIORITY_CONFIG, STATUS_CONFIG, TYPE_CONFIG, getSlaTimeLeft, getSlaStatus, formatRelativeTime, formatDateTime, getInitials } from '@/lib/utils'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

export default function TicketDetailPage() {
  const params = useParams()
  const id = params.id as string
  const queryClient = useQueryClient()
  const [worklogContent, setWorklogContent] = useState('')
  const [commentContent, setCommentContent] = useState('')
  const [isAddingWorklog, setIsAddingWorklog] = useState(false)
  const [isAddingComment, setIsAddingComment] = useState(false)

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => api.get(`/tickets/${id}`).then(r => r.data),
  })

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/auth/users').then(r => r.data),
  })

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.patch(`/tickets/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] })
      toast.success('Ticket updated')
    },
    onError: () => toast.error('Failed to update ticket'),
  })

  const triageMutation = useMutation({
    mutationFn: () => api.post(`/tickets/${id}/ai-triage`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] })
      toast.success('AI triage completed')
    },
    onError: () => toast.error('AI triage failed'),
  })

  const addWorklogMutation = useMutation({
    mutationFn: (content: string) => api.post(`/tickets/${id}/worklogs`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] })
      setWorklogContent('')
      setIsAddingWorklog(false)
      toast.success('Work note added')
    },
  })

  const addCommentMutation = useMutation({
    mutationFn: (content: string) => api.post(`/tickets/${id}/comments`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] })
      setCommentContent('')
      setIsAddingComment(false)
      toast.success('Comment added')
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-40" />
            <Skeleton className="h-60" />
          </div>
          <Skeleton className="h-80" />
        </div>
      </div>
    )
  }

  if (!ticket) return <div className="text-center py-16 text-muted-foreground">Ticket not found</div>

  const priorityConf = PRIORITY_CONFIG[ticket.priority as keyof typeof PRIORITY_CONFIG]
  const statusConf = STATUS_CONFIG[ticket.status as keyof typeof STATUS_CONFIG]
  const slaStatus = getSlaStatus(ticket.slaBreachAt)

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild className="gap-1.5 -ml-2">
          <Link href="/incidents"><ArrowLeft className="w-4 h-4" />Back</Link>
        </Button>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-medium">{ticket.number}</span>
      </div>

      {/* Ticket header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={ticket.type as any}>{TYPE_CONFIG[ticket.type as keyof typeof TYPE_CONFIG]?.label}</Badge>
              <Badge variant={ticket.status as any}>{statusConf?.label}</Badge>
              <Badge variant={ticket.priority as any}>{priorityConf?.label}</Badge>
              {ticket.slaBreachAt && (
                <Badge variant={slaStatus === 'breached' ? 'critical' : slaStatus === 'warning' ? 'high' : 'outline'}
                  className="font-mono">
                  <Clock className="w-3 h-3 mr-1" /> SLA: {getSlaTimeLeft(ticket.slaBreachAt)}
                </Badge>
              )}
            </div>
            <h1 className="text-xl font-bold text-foreground">{ticket.title}</h1>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => triageMutation.mutate()} loading={triageMutation.isPending}>
              <Brain className="w-4 h-4 mr-1.5" />
              AI Triage
            </Button>
            <Select value={ticket.status} onValueChange={(v) => updateMutation.mutate({ status: v })}>
              <SelectTrigger className="w-36 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['open', 'in_progress', 'pending', 'resolved', 'closed'].map(s => (
                  <SelectItem key={s} value={s}>{STATUS_CONFIG[s as keyof typeof STATUS_CONFIG]?.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* AI Analysis card */}
          {(ticket.aiSummary || ticket.aiRootCause || ticket.aiSentiment) && (
            <Card className="border-primary/20 bg-primary/5 dark:bg-primary/10">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <CardTitle className="text-sm font-semibold text-primary">AI Analysis</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {ticket.aiSummary && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Summary</p>
                    <p className="text-sm">{ticket.aiSummary}</p>
                  </div>
                )}
                {ticket.aiRootCause && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Root Cause</p>
                    <p className="text-sm">{ticket.aiRootCause}</p>
                  </div>
                )}
                <div className="flex gap-3 flex-wrap">
                  {ticket.aiSentiment && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">Sentiment:</span>
                      <Badge variant={ticket.aiSentiment === 'urgent' ? 'critical' : ticket.aiSentiment === 'frustrated' ? 'high' : 'secondary'}
                        className="text-xs capitalize">{ticket.aiSentiment}</Badge>
                    </div>
                  )}
                  {ticket.aiCategory && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">AI Category:</span>
                      <span className="text-xs font-medium">{ticket.aiCategory}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Description */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
            </CardContent>
          </Card>

          {/* Activity */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="worklogs">
                <TabsList className="mb-4">
                  <TabsTrigger value="worklogs">Work Notes ({ticket.worklogs?.length || 0})</TabsTrigger>
                  <TabsTrigger value="comments">Comments ({ticket.comments?.length || 0})</TabsTrigger>
                </TabsList>

                <TabsContent value="worklogs" className="space-y-3">
                  {ticket.worklogs?.map((log: any) => (
                    <div key={log.id} className="flex gap-3">
                      <Avatar className="w-7 h-7 shrink-0 mt-0.5">
                        <AvatarFallback className="text-xs bg-primary/20 text-primary">{getInitials(log.authorName)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 bg-muted/50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold">{log.authorName}</span>
                          <span className="text-xs text-muted-foreground">{formatRelativeTime(log.createdAt)}</span>
                        </div>
                        <p className="text-sm">{log.content}</p>
                        {log.timeSpentMinutes > 0 && <p className="text-xs text-muted-foreground mt-1.5">⏱ {log.timeSpentMinutes} min spent</p>}
                      </div>
                    </div>
                  ))}

                  {isAddingWorklog ? (
                    <div className="space-y-2">
                      <Textarea value={worklogContent} onChange={e => setWorklogContent(e.target.value)} placeholder="Document work performed..." rows={3} />
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => setIsAddingWorklog(false)}>Cancel</Button>
                        <Button size="sm" onClick={() => addWorklogMutation.mutate(worklogContent)} loading={addWorklogMutation.isPending} disabled={!worklogContent.trim()}>
                          <Send className="w-3.5 h-3.5 mr-1.5" />Add Note
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" className="w-full" onClick={() => setIsAddingWorklog(true)}>
                      <FileText className="w-4 h-4 mr-1.5" /> Add Work Note
                    </Button>
                  )}
                </TabsContent>

                <TabsContent value="comments" className="space-y-3">
                  {ticket.comments?.map((comment: any) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="w-7 h-7 shrink-0 mt-0.5">
                        <AvatarFallback className="text-xs">{getInitials(comment.authorName)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 bg-muted/50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold">{comment.authorName}</span>
                          <span className="text-xs text-muted-foreground">{formatRelativeTime(comment.createdAt)}</span>
                        </div>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                    </div>
                  ))}

                  {isAddingComment ? (
                    <div className="space-y-2">
                      <Textarea value={commentContent} onChange={e => setCommentContent(e.target.value)} placeholder="Add a comment..." rows={3} />
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => setIsAddingComment(false)}>Cancel</Button>
                        <Button size="sm" onClick={() => addCommentMutation.mutate(commentContent)} loading={addCommentMutation.isPending} disabled={!commentContent.trim()}>
                          <Send className="w-3.5 h-3.5 mr-1.5" />Comment
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" className="w-full" onClick={() => setIsAddingComment(true)}>
                      <MessageSquare className="w-4 h-4 mr-1.5" /> Add Comment
                    </Button>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar - Properties */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Properties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'Priority', value: <Badge variant={ticket.priority as any}>{priorityConf?.label}</Badge> },
                { label: 'Status', value: <Badge variant={ticket.status as any}>{statusConf?.label}</Badge> },
                { label: 'Assignee', value: (
                  <Select value={ticket.assigneeId || ''} onValueChange={(v) => updateMutation.mutate({ assigneeId: v })}>
                    <SelectTrigger className="h-7 text-xs w-full">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      {(users || []).map((u: any) => (
                        <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )},
                { label: 'Category', value: <span className="text-sm">{ticket.category || '—'}</span> },
                { label: 'Affected Service', value: <span className="text-sm">{ticket.affectedService || '—'}</span> },
                { label: 'Created', value: <span className="text-xs text-muted-foreground">{formatDateTime(ticket.createdAt)}</span> },
                { label: 'Updated', value: <span className="text-xs text-muted-foreground">{formatRelativeTime(ticket.updatedAt)}</span> },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground shrink-0">{label}</span>
                  <div className="min-w-0">{value}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Tags */}
          {ticket.tags?.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" />Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {ticket.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
