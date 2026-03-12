'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth.store'
import api from '@/lib/api'
import {
  AlertTriangle, CheckCircle2, Clock, TrendingUp, TrendingDown,
  Zap, AlertOctagon, Activity, Brain, ArrowRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import { PRIORITY_CONFIG, STATUS_CONFIG, formatRelativeTime, getSlaTimeLeft, getSlaStatus } from '@/lib/utils'
import { motion } from 'framer-motion'

// Fallback data for demo
const fallbackTrend = [
  { day: 'Mon', created: 8, resolved: 6 }, { day: 'Tue', created: 12, resolved: 9 },
  { day: 'Wed', created: 7, resolved: 11 }, { day: 'Thu', created: 15, resolved: 8 },
  { day: 'Fri', created: 10, resolved: 12 }, { day: 'Sat', created: 4, resolved: 5 },
  { day: 'Sun', created: 3, resolved: 4 },
]

const fallbackPriority = [
  { priority: 'critical', count: 2 }, { priority: 'high', count: 7 },
  { priority: 'medium', count: 14 }, { priority: 'low', count: 8 },
]

const PRIORITY_COLORS = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#3b82f6' }

const StatCard = ({ title, value, subtitle, icon: Icon, trend, color, loading }: any) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className={`text-3xl font-bold ${color || 'text-foreground'}`}>{value}</p>
            )}
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className={`p-2.5 rounded-xl ${color ? color.replace('text-', 'bg-').replace('600', '100').replace('400', '950/30') : 'bg-muted'}`}>
            <Icon className={`w-5 h-5 ${color || 'text-muted-foreground'}`} />
          </div>
        </div>
        {trend !== undefined && !loading && (
          <div className={`flex items-center gap-1 mt-3 text-xs font-medium ${trend > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
            {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}% vs last week
          </div>
        )}
      </CardContent>
    </Card>
  </motion.div>
)

export default function DashboardPage() {
  const { user } = useAuthStore()

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['dashboard', 'metrics'],
    queryFn: () => api.get('/dashboard/metrics').then(r => r.data),
    refetchInterval: 30000,
  })

  const { data: trend } = useQuery({
    queryKey: ['dashboard', 'trend'],
    queryFn: () => api.get('/dashboard/trend').then(r => r.data),
  })

  const { data: priorityDist } = useQuery({
    queryKey: ['dashboard', 'priority'],
    queryFn: () => api.get('/dashboard/priority-distribution').then(r => r.data),
  })

  const { data: recentTickets } = useQuery({
    queryKey: ['dashboard', 'recent'],
    queryFn: () => api.get('/dashboard/recent-tickets').then(r => r.data),
    refetchInterval: 15000,
  })

  const { data: aiInsights } = useQuery({
    queryKey: ['dashboard', 'ai'],
    queryFn: () => api.get('/dashboard/ai-insights').then(r => r.data),
  })

  const trendData = trend?.map((t: any) => ({ ...t, day: t.day || new Date(t.date).toLocaleDateString('en', { weekday: 'short' }) })) || fallbackTrend
  const priorityData = priorityDist || fallbackPriority

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.firstName} 👋</h1>
        <p className="text-muted-foreground mt-1">Here's what's happening with your IT operations today.</p>
      </div>

      {/* AI Alert - if major incident detected */}
      {aiInsights?.majorIncident?.isMajor && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden rounded-xl border border-orange-200 dark:border-orange-800 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
              <Brain className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-orange-900 dark:text-orange-100">AI Detected Major Incident Pattern</span>
                <Badge variant="high" className="text-xs">AI Alert</Badge>
              </div>
              <p className="text-sm text-orange-800 dark:text-orange-200 mt-1">{aiInsights.majorIncident.pattern} — {aiInsights.majorIncident.affectedCount} related tickets in the last 2 hours</p>
            </div>
            <Button variant="outline" size="sm" className="ml-auto shrink-0 border-orange-300" asChild>
              <Link href="/problems">View Problems <ArrowRight className="w-3 h-3 ml-1" /></Link>
            </Button>
          </div>
        </motion.div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Open Incidents" value={metrics?.openIncidents ?? '—'} subtitle={`${metrics?.inProgressIncidents ?? 0} in progress`} icon={AlertTriangle} color="text-orange-600 dark:text-orange-400" trend={12} loading={metricsLoading} />
        <StatCard title="SLA Compliance" value={`${metrics?.slaCompliance ?? '—'}%`} subtitle={`${metrics?.slaBreached ?? 0} at risk`} icon={CheckCircle2} color={metrics?.slaCompliance >= 90 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"} trend={-3} loading={metricsLoading} />
        <StatCard title="Avg. Resolution" value={`${metrics?.avgResolutionHours ?? '—'}h`} subtitle="Last 30 days" icon={Clock} color="text-blue-600 dark:text-blue-400" trend={-8} loading={metricsLoading} />
        <StatCard title="Critical Open" value={metrics?.criticalOpen ?? '—'} subtitle="Requires immediate action" icon={AlertOctagon} color="text-red-600 dark:text-red-400" loading={metricsLoading} />
      </div>

      {/* Second row stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Open Requests', value: metrics?.openRequests ?? '—', icon: Activity, color: 'text-purple-600 dark:text-purple-400' },
          { label: 'Open Problems', value: metrics?.openProblems ?? '—', icon: AlertOctagon, color: 'text-orange-600 dark:text-orange-400' },
          { label: 'Pending Changes', value: metrics?.openChanges ?? '—', icon: Zap, color: 'text-cyan-600 dark:text-cyan-400' },
        ].map(s => (
          <Card key={s.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-muted`}><s.icon className={`w-4 h-4 ${s.color}`} /></div>
              <div>
                {metricsLoading ? <Skeleton className="h-6 w-10" /> : <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>}
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Incident trend */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Incident Volume (7 Days)</CardTitle>
            <CardDescription>Created vs. resolved incidents</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trendData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <defs>
                  <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="created" name="Created" stroke="#7c3aed" strokeWidth={2} fill="url(#colorCreated)" />
                <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#10b981" strokeWidth={2} fill="url(#colorResolved)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Priority distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Priority Distribution</CardTitle>
            <CardDescription>Open & in-progress</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={priorityData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="count" nameKey="priority">
                  {priorityData.map((entry: any) => (
                    <Cell key={entry.priority} fill={PRIORITY_COLORS[entry.priority as keyof typeof PRIORITY_COLORS] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights + Recent tickets */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* AI insights */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Brain className="w-4 h-4 text-primary" />
              </div>
              <CardTitle className="text-base">AI Insights</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {aiInsights?.insights?.length > 0 ? (
              aiInsights.insights.map((insight: string, i: number) => (
                <div key={i} className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/50">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <p className="text-sm text-foreground">{insight}</p>
                </div>
              ))
            ) : (
              [
                '🔍 3 recurring VPN incidents detected — possible root cause: firmware v7.2.4',
                '⚠️ SLA breach risk: INC-0001 (32 min remaining)',
                '📈 Incident volume 12% above baseline this week',
                '✅ Email incidents resolved 23% faster than average',
              ].map((insight, i) => (
                <div key={i} className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/50">
                  <p className="text-sm text-foreground">{insight}</p>
                </div>
              ))
            )}
            <Button variant="ghost" size="sm" className="w-full text-primary hover:text-primary hover:bg-primary/5" asChild>
              <Link href="/ai-assistant">Chat with AI Assistant <ArrowRight className="w-3.5 h-3.5 ml-1" /></Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent tickets */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Tickets</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/incidents">View all <ArrowRight className="w-3.5 h-3.5 ml-1" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {(recentTickets || []).slice(0, 6).map((ticket: any) => {
                const priorityConf = PRIORITY_CONFIG[ticket.priority as keyof typeof PRIORITY_CONFIG]
                const statusConf = STATUS_CONFIG[ticket.status as keyof typeof STATUS_CONFIG]
                const slaStatus = getSlaStatus(ticket.slaBreachAt)
                return (
                  <Link key={ticket.id} href={`/incidents/${ticket.id}`}>
                    <div className="flex items-center gap-3 px-5 py-3 hover:bg-muted/40 transition-colors">
                      <div className={`w-1.5 h-8 rounded-full shrink-0 ${priorityConf?.dot ? `bg-${priorityConf.dot}` : 'bg-muted'}`}
                        style={{ background: PRIORITY_COLORS[ticket.priority as keyof typeof PRIORITY_COLORS] }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground">{ticket.number}</span>
                          <Badge variant={ticket.status as any} className="text-xs py-0">{statusConf?.label}</Badge>
                        </div>
                        <p className="text-sm font-medium truncate mt-0.5">{ticket.title}</p>
                      </div>
                      {ticket.slaBreachAt && (
                        <div className={`text-xs font-mono shrink-0 ${slaStatus === 'breached' ? 'text-red-600 dark:text-red-400' : slaStatus === 'warning' ? 'text-orange-600 dark:text-orange-400' : 'text-muted-foreground'}`}>
                          {getSlaTimeLeft(ticket.slaBreachAt)}
                        </div>
                      )}
                    </div>
                  </Link>
                )
              })}
              {(!recentTickets || recentTickets.length === 0) && (
                <div className="py-8 text-center text-sm text-muted-foreground">No recent tickets</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
