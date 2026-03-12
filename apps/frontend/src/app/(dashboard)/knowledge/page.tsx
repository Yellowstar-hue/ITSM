'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import Link from 'next/link'
import { Plus, Search, BookOpen, ThumbsUp, Eye, Bot, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatRelativeTime } from '@/lib/utils'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

export default function KnowledgePage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['knowledge', { search, category }],
    queryFn: () => api.get('/knowledge', { params: { search: search || undefined, category: category || undefined } }).then(r => r.data),
  })

  const { data: categories } = useQuery({
    queryKey: ['knowledge-categories'],
    queryFn: () => api.get('/knowledge/categories').then(r => r.data),
  })

  const articles = data?.items || []

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Knowledge Base</h1>
          <p className="text-muted-foreground text-sm">{data?.total || 0} articles</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 border-primary/30 text-primary hover:bg-primary/5">
            <Sparkles className="w-3.5 h-3.5" />AI Generate
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-1.5" />New Article
          </Button>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search knowledge base..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8" />
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setCategory('')} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${!category ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
          All
        </button>
        {(categories || []).map((cat: string) => (
          <button key={cat} onClick={() => setCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${category === cat ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
            {cat}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.map((article: any, idx: number) => (
            <motion.div key={article.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
              <Link href={`/knowledge/${article.id}`}>
                <Card className="h-full hover:shadow-md transition-shadow hover:border-primary/20 cursor-pointer group">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <BookOpen className="w-4 h-4 text-primary" />
                      </div>
                      {article.aiGenerated && (
                        <Badge variant="secondary" className="text-xs gap-1"><Sparkles className="w-2.5 h-2.5" />AI</Badge>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-2">{article.title}</h3>
                      {article.summary && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{article.summary}</p>}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{article.viewCount}</span>
                        <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" />{article.helpfulCount}</span>
                      </div>
                      {article.category && <Badge variant="outline" className="text-xs">{article.category}</Badge>}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
          {articles.length === 0 && (
            <div className="col-span-3 py-16 text-center text-muted-foreground">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No articles found</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
