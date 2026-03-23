'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import api from '@/lib/api'
import { Plus, Play, Pause, Zap, Activity, CheckCircle2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { formatRelativeTime } from '@/lib/utils'

const TRIGGER_TYPES = [
  { value: 'ticket_created', label: 'Ticket Created' },
  { value: 'ticket_updated', label: 'Ticket Updated' },
  { value: 'ticket_resolved', label: 'Ticket Resolved' },
  { value: 'sla_breach_imminent', label: 'SLA Breach Imminent' },
  { value: 'schedule', label: 'Scheduled' },
  { value: 'manual', label: 'Manual' },
]

interface WFForm {
  name: string
  description: string
  triggerType: string
  conditionField: string
  conditionValue: string
  actionType: string
}

export default function WorkflowsPage() {
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['workflows'],
    queryFn: () => api.get('/workflows').then(r => r.data),
  })

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<WFForm>({
    defaultValues: { triggerType: 'ticket_created', actionType: 'send_notification' }
  })
  const watchTrigger = watch('triggerType')
  const watchAction = watch('actionType')

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.post(`/workflows/${id}/${active ? 'activate' : 'deactivate'}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
      toast.success('Workflow updated')
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: WFForm) => api.post('/workflows', {
      name: data.name,
      description: data.description,
      status: 'active',
      trigger: { type: data.triggerType },
      conditions: data.conditionField && data.conditionValue
        ? [{ field: data.conditionField, operator: 'equals', value: data.conditionValue }]
        : [],
      actions: [{ type: data.actionType, order: 1, config: {} }],
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
      toast.success('Workflow created')
      setShowCreate(false)
      reset()
    },
    onError: () => toast.error('Failed to create workflow'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/workflows/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
      toast.success('Workflow deleted')
    },
  })

  const workflows = data?.items || []

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Workflow Automation</h1>
          <p className="text-muted-foreground text-sm">Automate IT processes with no-code workflows</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-1.5" />New Workflow
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Active', value: workflows.filter((w: any) => w.status === 'active').length, icon: Play, color: 'text-green-600 dark:text-green-400' },
          { label: 'Total Executions', value: workflows.reduce((s: number, w: any) => s + (w.executionCount || 0), 0), icon: Activity, color: 'text-blue-600 dark:text-blue-400' },
          { label: 'Success Rate', value: workflows.length ? `${Math.round(workflows.reduce((s: number, w: any) => s + (w.successCount || 0), 0) / Math.max(1, workflows.reduce((s: number, w: any) => s + (w.executionCount || 0), 0)) * 100)}%` : '—', icon: CheckCircle2, color: 'text-purple-600 dark:text-purple-400' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`w-5 h-5 ${s.color}`} />
              <div>
                <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Workflow list */}
      <div className="space-y-3">
        {isLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />) :
          workflows.map((wf: any, idx: number) => (
            <motion.div key={wf.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 p-2 rounded-lg ${wf.status === 'active' ? 'bg-green-100 dark:bg-green-950/30' : 'bg-muted'}`}>
                        <Zap className={`w-4 h-4 ${wf.status === 'active' ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{wf.name}</span>
                          <Badge variant={wf.status === 'active' ? 'resolved' : wf.status === 'inactive' ? 'closed' : 'pending'} className="text-xs capitalize">{wf.status}</Badge>
                        </div>
                        {wf.description && <p className="text-xs text-muted-foreground mt-0.5">{wf.description}</p>}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Trigger: <strong>{wf.trigger?.type?.replace(/_/g, ' ')}</strong></span>
                          <span className="flex items-center gap-1"><Activity className="w-3 h-3" />{wf.executionCount || 0} runs</span>
                          {wf.lastExecutedAt && <span>Last: {formatRelativeTime(wf.lastExecutedAt)}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button variant="outline" size="sm" onClick={() => toggleMutation.mutate({ id: wf.id, active: wf.status !== 'active' })}>
                        {wf.status === 'active' ? <><Pause className="w-3.5 h-3.5 mr-1" />Pause</> : <><Play className="w-3.5 h-3.5 mr-1" />Activate</>}
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"
                        onClick={() => { if (confirm('Delete this workflow?')) deleteMutation.mutate(wf.id) }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        }
        {!isLoading && workflows.length === 0 && (
          <div className="py-16 text-center text-muted-foreground">
            <Zap className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No workflows yet. Create one to automate your IT processes.</p>
          </div>
        )}
      </div>

      {/* Create Workflow Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>New Workflow</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Workflow Name *</label>
              <Input placeholder="e.g. Auto-assign Critical Incidents" {...register('name', { required: true })} />
              {errors.name && <p className="text-xs text-destructive">Name is required</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Description</label>
              <Input placeholder="What does this workflow do?" {...register('description')} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Trigger</label>
              <Select onValueChange={v => setValue('triggerType', v)} value={watchTrigger}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TRIGGER_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Condition (optional)</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Field</label>
                  <Select onValueChange={v => setValue('conditionField', v)}>
                    <SelectTrigger><SelectValue placeholder="Select field..." /></SelectTrigger>
                    <SelectContent>
                      {['priority', 'type', 'category', 'status'].map(f => <SelectItem key={f} value={f} className="capitalize">{f}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Value</label>
                  <Input placeholder="e.g. critical" {...register('conditionValue')} />
                </div>
              </div>
            </div>
            <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Action</p>
              <Select onValueChange={v => setValue('actionType', v)} value={watchAction}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[
                    { value: 'send_notification', label: 'Send Notification' },
                    { value: 'assign_ticket', label: 'Assign Ticket' },
                    { value: 'send_email', label: 'Send Email' },
                    { value: 'call_webhook', label: 'Call Webhook' },
                    { value: 'create_ticket', label: 'Create Ticket' },
                  ].map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setShowCreate(false); reset() }}>Cancel</Button>
              <Button type="submit" loading={createMutation.isPending}>Create Workflow</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
