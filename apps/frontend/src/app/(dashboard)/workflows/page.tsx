'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Plus, Play, Pause, Zap, Activity, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatRelativeTime } from '@/lib/utils'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

export default function WorkflowsPage() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['workflows'],
    queryFn: () => api.get('/workflows').then(r => r.data),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.post(`/workflows/${id}/${active ? 'activate' : 'deactivate'}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
      toast.success('Workflow updated')
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
        <Button size="sm"><Plus className="w-4 h-4 mr-1.5" />New Workflow</Button>
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
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        }
      </div>
    </div>
  )
}
