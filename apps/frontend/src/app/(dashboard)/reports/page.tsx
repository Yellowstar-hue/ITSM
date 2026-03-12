'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { BarChart3, TrendingUp, Users, CheckCircle2, Brain, Download } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts'

export default function ReportsPage() {
  const { data: sla, isLoading: slaLoading } = useQuery({
    queryKey: ['reports', 'sla'],
    queryFn: () => api.get('/reports/sla').then(r => r.data),
  })

  const { data: trend } = useQuery({
    queryKey: ['reports', 'trend'],
    queryFn: () => api.get('/reports/incidents/trend?period=month').then(r => r.data),
  })

  const { data: categories } = useQuery({
    queryKey: ['reports', 'categories'],
    queryFn: () => api.get('/reports/categories').then(r => r.data),
  })

  const CAT_COLORS = ['#7c3aed', '#3b82f6', '#10b981', '#f97316', '#ef4444', '#eab308', '#8b5cf6', '#06b6d4']

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground text-sm">AI-powered insights for IT operations</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Download className="w-4 h-4" />Export
        </Button>
      </div>

      {/* SLA Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'SLA Compliance', value: sla ? `${sla.compliance}%` : '—', color: (sla?.compliance || 0) >= 90 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400', icon: CheckCircle2 },
          { label: 'Total Tickets', value: sla?.total ?? '—', color: 'text-foreground', icon: BarChart3 },
          { label: 'SLA Breached', value: sla?.breached ?? '—', color: 'text-red-600 dark:text-red-400', icon: TrendingUp },
          { label: 'Met SLA', value: sla?.metSla ?? '—', color: 'text-green-600 dark:text-green-400', icon: CheckCircle2 },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-5 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted"><s.icon className={`w-4 h-4 ${s.color}`} /></div>
              <div>
                {slaLoading ? <Skeleton className="h-7 w-12" /> : <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>}
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* SLA by Priority */}
      {sla?.byPriority && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">SLA Compliance by Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={sla.byPriority} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="priority" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="compliance" name="Compliance %" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                <Bar dataKey="breached" name="Breached" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Incident trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Incident Trend (30 Days)</CardTitle>
            <CardDescription>Daily volume</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={(trend || []).slice(-14)} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.split('-').slice(1).join('/')} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="total" name="Total" stroke="#7c3aed" strokeWidth={2} fill="url(#colorTotal)" />
                <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#10b981" strokeWidth={2} fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tickets by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={(categories || []).slice(0, 8)} layout="vertical" margin={{ top: 5, right: 5, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="category" type="category" tick={{ fontSize: 10 }} width={80} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="total" fill="#7c3aed" radius={[0, 4, 4, 0]}>
                  {(categories || []).slice(0, 8).map((_: any, i: number) => (
                    <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
