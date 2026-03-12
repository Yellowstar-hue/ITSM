'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { Clock, Users, ChevronRight, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { motion } from 'framer-motion'

export default function CatalogPage() {
  const router = useRouter()
  const [category, setCategory] = useState('')

  const { data: items, isLoading } = useQuery({
    queryKey: ['catalog', category],
    queryFn: () => api.get('/catalog', { params: { category: category || undefined } }).then(r => r.data),
  })

  const { data: categories } = useQuery({
    queryKey: ['catalog-categories'],
    queryFn: () => api.get('/catalog/categories').then(r => r.data),
  })

  const ICONS: Record<string, string> = {
    UserPlus: '👤', Package: '📦', Key: '🔑', Shield: '🛡️', Lock: '🔒', Wrench: '🔧', Monitor: '🖥️', Cloud: '☁️'
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Service Catalog</h1>
        <p className="text-muted-foreground text-sm">Browse and request IT services</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setCategory('')} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${!category ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>All</button>
        {(categories || []).map((cat: string) => (
          <button key={cat} onClick={() => setCategory(cat)} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${category === cat ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>{cat}</button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40" />)}</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(items || []).map((item: any, idx: number) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer group h-full" onClick={() => router.push(`/incidents/new?type=service_request&catalogId=${item.id}`)}>
                <CardContent className="p-5 flex flex-col gap-3 h-full">
                  <div className="flex items-start justify-between">
                    <div className="text-2xl">{ICONS[item.icon] || '📋'}</div>
                    {item.requiresApproval && <Badge variant="outline" className="text-xs">Requires Approval</Badge>}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold group-hover:text-primary transition-colors">{item.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{item.slaHours}h SLA</span>
                    <span className="flex items-center gap-1"><Star className="w-3 h-3" />{item.requestCount} requests</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
