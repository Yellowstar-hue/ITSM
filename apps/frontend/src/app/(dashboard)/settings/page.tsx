'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { User, Bell, Shield, Plug, Brain, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { getInitials } from '@/lib/utils'
import { toast } from 'sonner'

const NOTIF_PREFS = [
  { key: 'ticketAssigned', label: 'Ticket Assigned to Me', desc: 'Get notified when a ticket is assigned to you' },
  { key: 'slaWarning', label: 'SLA Warning', desc: 'Alert when SLA is 30 minutes from breach' },
  { key: 'criticalIncidents', label: 'Critical Incidents', desc: 'Immediate alert for P1 incidents' },
  { key: 'ticketResolved', label: 'Ticket Resolved', desc: 'Notification when your tickets are resolved' },
  { key: 'newComment', label: 'New Comment', desc: 'When someone comments on your tickets' },
]

const AI_FEATURES = [
  { key: 'autoTriage', label: 'Auto-triage new tickets' },
  { key: 'generateKb', label: 'Generate KB articles from resolved tickets' },
  { key: 'detectPatterns', label: 'Detect major incident patterns' },
  { key: 'predictSla', label: 'Predict SLA breaches' },
  { key: 'sentiment', label: 'Sentiment analysis on tickets' },
]

export default function SettingsPage() {
  const { user, setUser } = useAuthStore()

  // Profile form
  const { register: regProfile, handleSubmit: submitProfile } = useForm({
    defaultValues: { firstName: user?.firstName, lastName: user?.lastName, email: user?.email },
  })

  // Security form
  const { register: regSec, handleSubmit: submitSec, reset: resetSec, watch: watchSec } = useForm<{
    currentPassword: string; newPassword: string; confirmPassword: string
  }>()
  const newPassword = watchSec('newPassword')

  // Notification prefs state
  const [notifEmail, setNotifEmail] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIF_PREFS.map(p => [p.key, true]))
  )
  const [notifInApp, setNotifInApp] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIF_PREFS.map(p => [p.key, true]))
  )

  // AI config state (localStorage persistence)
  const [openaiKey, setOpenaiKey] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('openai_key') || '' : ''
  )
  const [anthropicKey, setAnthropicKey] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('anthropic_key') || '' : ''
  )
  const [aiFeatures, setAiFeatures] = useState<Record<string, boolean>>(
    Object.fromEntries(AI_FEATURES.map(f => [f.key, true]))
  )

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => api.patch('/auth/profile', data),
    onSuccess: (res) => { setUser(res.data); toast.success('Profile updated') },
    onError: () => toast.error('Failed to update profile'),
  })

  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      api.post('/auth/change-password', data),
    onSuccess: () => { toast.success('Password changed successfully'); resetSec() },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to change password'),
  })

  const handleChangePassword = submitSec((data) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    if (data.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters')
      return
    }
    changePasswordMutation.mutate({ currentPassword: data.currentPassword, newPassword: data.newPassword })
  })

  const handleSaveNotifications = () => {
    // Persist to localStorage — backend WebSocket prefs can be added later
    localStorage.setItem('notif_email', JSON.stringify(notifEmail))
    localStorage.setItem('notif_inapp', JSON.stringify(notifInApp))
    toast.success('Notification preferences saved')
  }

  const handleSaveAiConfig = () => {
    localStorage.setItem('openai_key', openaiKey)
    localStorage.setItem('anthropic_key', anthropicKey)
    localStorage.setItem('ai_features', JSON.stringify(aiFeatures))
    toast.success('AI configuration saved')
  }

  const integrations = [
    { name: 'Slack', desc: 'Send notifications to Slack channels', icon: '💬' },
    { name: 'Microsoft Teams', desc: 'Post updates to Teams channels', icon: '🔵' },
    { name: 'Jira Software', desc: 'Sync tickets with Jira issues', icon: '🎯' },
    { name: 'GitHub', desc: 'Link tickets to GitHub issues/PRs', icon: '⚫' },
    { name: 'PagerDuty', desc: 'On-call alerting and escalation', icon: '🚨' },
    { name: 'Datadog', desc: 'Auto-create incidents from alerts', icon: '📊' },
  ]

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your account and platform configuration</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="mb-5">
          <TabsTrigger value="profile" className="gap-1.5"><User className="w-3.5 h-3.5" />Profile</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5"><Bell className="w-3.5 h-3.5" />Notifications</TabsTrigger>
          <TabsTrigger value="integrations" className="gap-1.5"><Plug className="w-3.5 h-3.5" />Integrations</TabsTrigger>
          <TabsTrigger value="ai" className="gap-1.5"><Brain className="w-3.5 h-3.5" />AI Config</TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5"><Shield className="w-3.5 h-3.5" />Security</TabsTrigger>
        </TabsList>

        {/* ── Profile ── */}
        <TabsContent value="profile">
          <Card>
            <CardHeader><CardTitle>Profile Information</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={submitProfile(d => updateProfileMutation.mutate(d))} className="space-y-4">
                <div className="flex items-center gap-4 mb-5">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                      {user ? getInitials(`${user.firstName} ${user.lastName}`) : '??'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{user?.firstName} {user?.lastName}</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                    <Badge variant="outline" className="mt-1 capitalize">{user?.role}</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">First Name</label>
                    <Input {...regProfile('firstName')} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Last Name</label>
                    <Input {...regProfile('lastName')} />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input {...regProfile('email')} type="email" disabled />
                  </div>
                </div>
                <Button type="submit" loading={updateProfileMutation.isPending}>
                  <Save className="w-4 h-4 mr-1.5" />Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Notifications ── */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose when and how you receive notifications.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 text-xs font-medium text-muted-foreground pb-1 border-b">
                <span className="col-span-1">Event</span>
                <span className="text-center">Email</span>
                <span className="text-center">In-app</span>
              </div>
              {NOTIF_PREFS.map((n) => (
                <div key={n.key} className="grid grid-cols-3 items-center py-1.5">
                  <div>
                    <p className="text-sm font-medium">{n.label}</p>
                    <p className="text-xs text-muted-foreground">{n.desc}</p>
                  </div>
                  <div className="flex justify-center">
                    <input type="checkbox" className="rounded" checked={!!notifEmail[n.key]}
                      onChange={e => setNotifEmail(prev => ({ ...prev, [n.key]: e.target.checked }))} />
                  </div>
                  <div className="flex justify-center">
                    <input type="checkbox" className="rounded" checked={!!notifInApp[n.key]}
                      onChange={e => setNotifInApp(prev => ({ ...prev, [n.key]: e.target.checked }))} />
                  </div>
                </div>
              ))}
              <Button size="sm" onClick={handleSaveNotifications}>
                <Save className="w-3.5 h-3.5 mr-1.5" />Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Integrations ── */}
        <TabsContent value="integrations">
          <div className="grid gap-3">
            {integrations.map((int) => (
              <Card key={int.name}>
                <CardContent className="p-4 flex items-center gap-4">
                  <span className="text-2xl">{int.icon}</span>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{int.name}</p>
                    <p className="text-xs text-muted-foreground">{int.desc}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => toast.info(`${int.name} integration coming soon`)}>
                    Connect
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── AI Config ── */}
        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle>AI Configuration</CardTitle>
              <CardDescription>Configure AI providers and features.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">OpenAI API Key</label>
                <Input type="password" placeholder="sk-..." value={openaiKey}
                  onChange={e => setOpenaiKey(e.target.value)} />
                <p className="text-xs text-muted-foreground">Used for ticket triage, summarization, and chat</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Anthropic API Key</label>
                <Input type="password" placeholder="sk-ant-..." value={anthropicKey}
                  onChange={e => setAnthropicKey(e.target.value)} />
                <p className="text-xs text-muted-foreground">Alternative AI provider for complex reasoning</p>
              </div>
              <Separator />
              <div className="space-y-3">
                <p className="text-sm font-medium">AI Features</p>
                {AI_FEATURES.map((f) => (
                  <label key={f.key} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded" checked={!!aiFeatures[f.key]}
                      onChange={e => setAiFeatures(prev => ({ ...prev, [f.key]: e.target.checked }))} />
                    <span className="text-sm">{f.label}</span>
                  </label>
                ))}
              </div>
              <Button size="sm" onClick={handleSaveAiConfig}>
                <Save className="w-3.5 h-3.5 mr-1.5" />Save AI Config
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Security ── */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your account password.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Current Password</label>
                  <Input type="password" {...regSec('currentPassword', { required: true })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">New Password</label>
                  <Input type="password" {...regSec('newPassword', { required: true, minLength: 6 })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Confirm New Password</label>
                  <Input type="password" {...regSec('confirmPassword', { required: true })} />
                </div>
                <Button type="submit" size="sm" loading={changePasswordMutation.isPending}>
                  <Shield className="w-3.5 h-3.5 mr-1.5" />Change Password
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
