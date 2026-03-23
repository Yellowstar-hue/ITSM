'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import api from '@/lib/api'
import { Server, Plus, Search, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

const STATUS_COLORS: Record<string, any> = {
  operational: 'resolved', degraded: 'high', offline: 'critical', maintenance: 'pending', decommissioned: 'closed'
}
const TYPE_ICONS: Record<string, string> = {
  server: '🖥️', database: '🗄️', application: '📱', network_device: '🔌', storage: '💾',
  virtual_machine: '☁️', container: '📦', service: '⚙️', endpoint: '💻', other: '📦'
}
const CI_TYPES = ['server', 'database', 'application', 'network_device', 'storage', 'virtual_machine', 'container', 'service', 'endpoint', 'other']
const CI_STATUSES = ['operational', 'degraded', 'offline', 'maintenance', 'decommissioned']
const ENVIRONMENTS = ['production', 'staging', 'development', 'test']

interface CIForm {
  name: string; ciType: string; status: string; environment: string
  hostname: string; ipAddress: string; businessService: string; department: string; tags: string
}

export default function CmdbPage() {
  const [search, setSearch] = useState('')
  const [ciType, setCiType] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['cmdb', { search, ciType }],
    queryFn: () => api.get('/cmdb', { params: { search: search || undefined, ciType: ciType || undefined, limit: 50 } }).then(r => r.data),
  })

  const { data: stats } = useQuery({
    queryKey: ['cmdb-stats'],
    queryFn: () => api.get('/cmdb/stats').then(r => r.data),
  })

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CIForm>({
    defaultValues: { status: 'operational', environment: 'production' }
  })
  const watchType = watch('ciType')
  const watchStatus = watch('status')
  const watchEnv = watch('environment')

  const createMutation = useMutation({
    mutationFn: (data: CIForm) => api.post('/cmdb', {
      ...data,
      tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cmdb'] })
      queryClient.invalidateQueries({ queryKey: ['cmdb-stats'] })
      toast.success('Configuration item created')
      setShowCreate(false)
      reset()
    },
    onError: () => toast.error('Failed to create CI'),
  })

  const items = data?.items || []

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">CMDB</h1>
          <p className="text-muted-foreground text-sm">Configuration Management Database — {data?.total || 0} items</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-1.5" />Add CI
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats?.total, icon: Server, color: 'text-blue-600 dark:text-blue-400' },
          { label: 'Operational', value: stats?.operational, icon: CheckCircle2, color: 'text-green-600 dark:text-green-400' },
          { label: 'Degraded', value: stats?.degraded, icon: AlertTriangle, color: 'text-orange-600 dark:text-orange-400' },
          { label: 'Offline', value: stats?.offline, icon: XCircle, color: 'text-red-600 dark:text-red-400' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`w-5 h-5 ${s.color}`} />
              <div>
                <div className={`text-xl font-bold ${s.color}`}>{s.value ?? '—'}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search CIs..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {['', 'server', 'database', 'application', 'network_device', 'virtual_machine', 'container'].map(t => (
            <button key={t} onClick={() => setCiType(t)}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium border transition-all ${ciType === t ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
              {t === '' ? 'All' : t.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* CI Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((ci: any, idx: number) => (
            <motion.div key={ci.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{TYPE_ICONS[ci.ciType] || '📦'}</span>
                      <div>
                        <p className="font-semibold text-sm group-hover:text-primary transition-colors">{ci.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{ci.ciType?.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <Badge variant={STATUS_COLORS[ci.status] || 'secondary'} className="text-xs capitalize">{ci.status}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    {ci.hostname && <div>🔗 {ci.hostname}</div>}
                    {ci.ipAddress && <div>🌐 {ci.ipAddress}</div>}
                    {ci.environment && <div>🏷️ {ci.environment}</div>}
                    {ci.businessService && <div>⚙️ {ci.businessService}</div>}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          {items.length === 0 && (
            <div className="col-span-3 py-16 text-center text-muted-foreground">
              <Server className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No configuration items found</p>
            </div>
          )}
        </div>
      )}

      {/* Create CI Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Configuration Item</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <label className="text-sm font-medium">Name *</label>
                <Input placeholder="e.g. PROD-DB-03" {...register('name', { required: true })} />
                {errors.name && <p className="text-xs text-destructive">Name is required</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Type *</label>
                <Select onValueChange={v => setValue('ciType', v)} value={watchType}>
                  <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
                  <SelectContent>
                    {CI_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Status</label>
                <Select onValueChange={v => setValue('status', v)} value={watchStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CI_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Environment</label>
                <Select onValueChange={v => setValue('environment', v)} value={watchEnv}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ENVIRONMENTS.map(e => <SelectItem key={e} value={e} className="capitalize">{e}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Hostname</label>
                <Input placeholder="hostname.internal" {...register('hostname')} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">IP Address</label>
                <Input placeholder="10.0.1.10" {...register('ipAddress')} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Business Service</label>
                <Input placeholder="Core Platform" {...register('businessService')} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Department</label>
                <Input placeholder="Infrastructure" {...register('department')} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <label className="text-sm font-medium">Tags</label>
                <Input placeholder="production, critical (comma separated)" {...register('tags')} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setShowCreate(false); reset() }}>Cancel</Button>
              <Button type="submit" loading={createMutation.isPending}>Add CI</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
