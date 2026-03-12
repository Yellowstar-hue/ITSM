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

export default function SettingsPage() {
  const { user, setUser } = useAuthStore()
  const { register, handleSubmit } = useForm({ defaultValues: { firstName: user?.firstName, lastName: user?.lastName, email: user?.email } })

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => api.patch('/auth/profile', data),
    onSuccess: (res) => { setUser(res.data); toast.success('Profile updated') },
    onError: () => toast.error('Failed to update profile'),
  })

  const integrations = [
    { name: 'Slack', desc: 'Send notifications to Slack channels', icon: '💬', status: 'available' },
    { name: 'Microsoft Teams', desc: 'Post updates to Teams channels', icon: '🔵', status: 'available' },
    { name: 'Jira Software', desc: 'Sync tickets with Jira issues', icon: '🎯', status: 'available' },
    { name: 'GitHub', desc: 'Link tickets to GitHub issues/PRs', icon: '⚫', status: 'available' },
    { name: 'PagerDuty', desc: 'On-call alerting and escalation', icon: '🚨', status: 'available' },
    { name: 'Datadog', desc: 'Auto-create incidents from alerts', icon: '📊', status: 'available' },
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

        <TabsContent value="profile">
          <Card>
            <CardHeader><CardTitle>Profile Information</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(d => updateProfileMutation.mutate(d))} className="space-y-4">
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
                    <Input {...register('firstName')} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Last Name</label>
                    <Input {...register('lastName')} />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input {...register('email')} type="email" disabled />
                  </div>
                </div>
                <Button type="submit" loading={updateProfileMutation.isPending}><Save className="w-4 h-4 mr-1.5" />Save Changes</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader><CardTitle>Notification Preferences</CardTitle><CardDescription>Choose when and how you receive notifications.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'Ticket Assigned to Me', desc: 'Get notified when a ticket is assigned to you' },
                { label: 'SLA Warning', desc: 'Alert when SLA is 30 minutes from breach' },
                { label: 'Critical Incidents', desc: 'Immediate alert for P1 incidents' },
                { label: 'Ticket Resolved', desc: 'Notification when your tickets are resolved' },
                { label: 'New Comment', desc: 'When someone comments on your tickets' },
              ].map((n, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">{n.label}</p>
                    <p className="text-xs text-muted-foreground">{n.desc}</p>
                  </div>
                  <div className="flex gap-3 text-xs">
                    {['Email', 'In-app'].map(ch => (
                      <label key={ch} className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="text-muted-foreground">{ch}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <Button size="sm"><Save className="w-3.5 h-3.5 mr-1.5" />Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <div className="grid gap-3">
            {integrations.map((int, i) => (
              <Card key={i}>
                <CardContent className="p-4 flex items-center gap-4">
                  <span className="text-2xl">{int.icon}</span>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{int.name}</p>
                    <p className="text-xs text-muted-foreground">{int.desc}</p>
                  </div>
                  <Button variant="outline" size="sm">Connect</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ai">
          <Card>
            <CardHeader><CardTitle>AI Configuration</CardTitle><CardDescription>Configure AI providers and features.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">OpenAI API Key</label>
                <Input type="password" placeholder="sk-..." />
                <p className="text-xs text-muted-foreground">Used for ticket triage, summarization, and chat</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Anthropic API Key</label>
                <Input type="password" placeholder="sk-ant-..." />
                <p className="text-xs text-muted-foreground">Alternative AI provider for complex reasoning</p>
              </div>
              <Separator />
              <div className="space-y-3">
                <p className="text-sm font-medium">AI Features</p>
                {['Auto-triage new tickets', 'Generate KB articles from resolved tickets', 'Detect major incident patterns', 'Predict SLA breaches', 'Sentiment analysis on tickets'].map((f, i) => (
                  <label key={i} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm">{f}</span>
                  </label>
                ))}
              </div>
              <Button size="sm"><Save className="w-3.5 h-3.5 mr-1.5" />Save AI Config</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader><CardTitle>Security</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Current Password</label>
                  <Input type="password" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">New Password</label>
                  <Input type="password" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Confirm New Password</label>
                  <Input type="password" />
                </div>
                <Button size="sm">Change Password</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
