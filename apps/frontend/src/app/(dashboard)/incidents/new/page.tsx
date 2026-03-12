'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import api from '@/lib/api'
import { ArrowLeft, Brain, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PRIORITY_CONFIG, TYPE_CONFIG } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'

const CATEGORIES = ['Network', 'Hardware', 'Software', 'Access Management', 'Email & Collaboration', 'Infrastructure', 'Security', 'Application', 'Cloud Services', 'Other']

export default function NewTicketPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultType = searchParams.get('type') || 'incident'
  const [aiTriage, setAiTriage] = useState<any>(null)
  const [isTriaging, setIsTriaging] = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: { type: defaultType, priority: 'medium', title: '', description: '', category: '', assigneeId: '' },
  })

  const watchTitle = watch('title')
  const watchDescription = watch('description')
  const watchType = watch('type')

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/auth/users').then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/tickets', data),
    onSuccess: (res) => {
      toast.success(`${TYPE_CONFIG[res.data.type as keyof typeof TYPE_CONFIG]?.label} ${res.data.number} created`)
      router.push(`/incidents/${res.data.id}`)
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create ticket'),
  })

  const runAiTriage = async () => {
    if (!watchTitle || !watchDescription) {
      toast.error('Please add a title and description first')
      return
    }
    setIsTriaging(true)
    try {
      const { data } = await api.post('/ai/triage', { title: watchTitle, description: watchDescription, type: watchType })
      setAiTriage(data)
      setValue('priority', data.priority)
      setValue('category', data.category)
      toast.success('AI triage completed!')
    } catch {
      toast.error('AI triage failed')
    } finally {
      setIsTriaging(false)
    }
  }

  const onSubmit = (data: any) => createMutation.mutate(data)

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild className="-ml-2"><Link href="/incidents"><ArrowLeft className="w-4 h-4" />Back</Link></Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Create New {TYPE_CONFIG[watchType as keyof typeof TYPE_CONFIG]?.label || 'Ticket'}</h1>
        <p className="text-muted-foreground mt-1">Fill in the details. AI triage will auto-suggest priority and category.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Type selector */}
        <div className="flex gap-2">
          {['incident', 'service_request', 'problem', 'change'].map(t => (
            <button key={t} type="button" onClick={() => setValue('type', t)}
              className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${watchType === t ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
              {TYPE_CONFIG[t as keyof typeof TYPE_CONFIG]?.label}
            </button>
          ))}
        </div>

        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Title <span className="text-destructive">*</span></label>
              <Input placeholder={watchType === 'incident' ? 'e.g. VPN service is down for all remote users' : 'Brief description...'} {...register('title', { required: 'Title is required' })} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message as string}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Description <span className="text-destructive">*</span></label>
              <Textarea placeholder="Provide detailed information about the issue, including impact, steps to reproduce, and any error messages..." rows={5} {...register('description', { required: 'Description is required' })} />
              {errors.description && <p className="text-xs text-destructive">{errors.description.message as string}</p>}
            </div>

            {/* AI Triage button */}
            <Button type="button" variant="outline" onClick={runAiTriage} loading={isTriaging} className="gap-2 border-primary/30 text-primary hover:bg-primary/5">
              <Brain className="w-4 h-4" />
              AI Auto-Triage
            </Button>

            {/* AI Results */}
            {aiTriage && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <Sparkles className="w-3.5 h-3.5" />AI Suggestions Applied
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="text-muted-foreground">Priority:</span>
                  <Badge variant={aiTriage.priority as any} className="text-xs">{PRIORITY_CONFIG[aiTriage.priority as keyof typeof PRIORITY_CONFIG]?.label}</Badge>
                  <span className="text-muted-foreground ml-2">Category:</span>
                  <span className="font-medium">{aiTriage.category}</span>
                  <span className="text-muted-foreground ml-2">Sentiment:</span>
                  <span className="font-medium capitalize">{aiTriage.sentiment}</span>
                </div>
                <p className="text-xs text-muted-foreground italic">"{aiTriage.summary}"</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional fields */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Details</CardTitle></CardHeader>
          <CardContent className="p-5 pt-0 grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Priority</label>
              <Select defaultValue="medium" onValueChange={v => setValue('priority', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['critical', 'high', 'medium', 'low'].map(p => (
                    <SelectItem key={p} value={p}>{PRIORITY_CONFIG[p as keyof typeof PRIORITY_CONFIG]?.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Category</label>
              <Select onValueChange={v => setValue('category', v)}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Assign To</label>
              <Select onValueChange={v => setValue('assigneeId', v)}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  {(users || []).map((u: any) => (
                    <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Affected Service</label>
              <Input placeholder="e.g. VPN, Email, Salesforce..." {...register('affectedService')} />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" loading={createMutation.isPending}>
            Create {TYPE_CONFIG[watchType as keyof typeof TYPE_CONFIG]?.label}
          </Button>
        </div>
      </form>
    </div>
  )
}
