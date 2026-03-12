'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import Link from 'next/link'
import { ArrowLeft, ThumbsUp, ThumbsDown, Eye, Calendar, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'

export default function ArticlePage() {
  const { id } = useParams()

  const { data: article, isLoading } = useQuery({
    queryKey: ['article', id],
    queryFn: () => api.get(`/knowledge/${id}`).then(r => r.data),
  })

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-96" /></div>
  if (!article) return <div className="text-center py-16 text-muted-foreground">Article not found</div>

  return (
    <div className="max-w-3xl space-y-5">
      <Button variant="ghost" size="sm" asChild className="-ml-2"><Link href="/knowledge"><ArrowLeft className="w-4 h-4 mr-1" />Knowledge Base</Link></Button>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {article.category && <Badge variant="outline">{article.category}</Badge>}
          {article.aiGenerated && <Badge variant="secondary">AI Generated</Badge>}
          <Badge variant={article.status === 'published' ? 'resolved' : 'pending'}>{article.status}</Badge>
        </div>
        <h1 className="text-2xl font-bold">{article.title}</h1>
        {article.summary && <p className="text-muted-foreground">{article.summary}</p>}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{article.viewCount} views</span>
          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(article.createdAt)}</span>
          {article.authorName && <span>By {article.authorName}</span>}
        </div>
      </div>

      <Card>
        <CardContent className="p-6 prose dark:prose-invert prose-sm max-w-none">
          <pre className="whitespace-pre-wrap font-sans text-sm text-foreground leading-relaxed">{article.content}</pre>
        </CardContent>
      </Card>

      {article.tags?.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Tag className="w-4 h-4 text-muted-foreground" />
          {article.tags.map((t: string) => <Badge key={t} variant="secondary">{t}</Badge>)}
        </div>
      )}

      <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-muted/30">
        <p className="text-sm text-muted-foreground flex-1">Was this article helpful?</p>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => api.post(`/knowledge/${id}/helpful`, { helpful: true })}>
          <ThumbsUp className="w-3.5 h-3.5" />Yes ({article.helpfulCount})
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => api.post(`/knowledge/${id}/helpful`, { helpful: false })}>
          <ThumbsDown className="w-3.5 h-3.5" />No
        </Button>
      </div>
    </div>
  )
}
