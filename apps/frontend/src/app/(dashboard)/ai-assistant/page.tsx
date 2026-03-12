'use client'

import { useState, useRef, useEffect } from 'react'
import api from '@/lib/api'
import { Send, Bot, User, Sparkles, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/store/auth.store'
import { getInitials, formatRelativeTime } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface Message { id: string; role: 'user' | 'assistant'; content: string; createdAt: Date }

const SUGGESTIONS = [
  'Show me critical incidents from the last 24 hours',
  'Which tickets are at risk of SLA breach?',
  'Analyze the VPN outage pattern',
  'Generate a summary of this week\'s incidents',
  'What are the top 5 recurring issues?',
  'Help me write an incident communication',
]

export default function AiAssistantPage() {
  const { user } = useAuthStore()
  const [messages, setMessages] = useState<Message[]>([{
    id: '0',
    role: 'assistant',
    content: "Hello! I'm your AI Operations Assistant. I can help you analyze incidents, detect patterns, generate reports, predict SLA breaches, and answer questions about your IT operations. What would you like to explore?",
    createdAt: new Date(),
  }])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content, createdAt: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const chatMessages = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }))
      const { data } = await api.post('/ai/chat', { messages: chatMessages })
      const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: data.content, createdAt: new Date() }
      setMessages(prev => [...prev, assistantMsg])
    } catch (e) {
      const errorMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: "I encountered an error processing your request. Please try again.", createdAt: new Date() }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 pb-4 border-b">
        <div className="p-2.5 rounded-xl gradient-primary">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold">AI Operations Assistant</h1>
          <p className="text-xs text-muted-foreground">Powered by advanced AI • Real-time incident intelligence</p>
        </div>
        <Badge variant="secondary" className="ml-auto gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />Online
        </Badge>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <Avatar className="w-8 h-8 shrink-0 mt-0.5">
                {msg.role === 'assistant' ? (
                  <AvatarFallback className="bg-primary text-primary-foreground"><Bot className="w-4 h-4" /></AvatarFallback>
                ) : (
                  <AvatarFallback className="bg-secondary">{user ? getInitials(`${user.firstName} ${user.lastName}`) : 'U'}</AvatarFallback>
                )}
              </Avatar>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-tr-sm'
                  : 'bg-muted/70 dark:bg-muted/30 text-foreground rounded-tl-sm'
              }`}>
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <Avatar className="w-8 h-8 shrink-0">
              <AvatarFallback className="bg-primary text-primary-foreground"><Bot className="w-4 h-4" /></AvatarFallback>
            </Avatar>
            <div className="bg-muted/70 dark:bg-muted/30 rounded-2xl rounded-tl-sm px-4 py-3.5 flex items-center gap-1.5">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-pulse-dot" style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Try asking:</p>
          <div className="flex gap-2 flex-wrap">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => sendMessage(s)}
                className="px-3 py-1.5 rounded-full border border-border text-xs text-muted-foreground hover:border-primary/50 hover:text-foreground transition-all bg-background">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 items-end">
        <div className="flex-1 relative">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
            placeholder="Ask about incidents, SLA status, trends, or anything IT-related..."
            rows={1}
            className="resize-none pr-12 min-h-[44px] max-h-[200px]"
          />
        </div>
        <Button size="icon" onClick={() => sendMessage(input)} disabled={!input.trim() || isLoading} className="h-11 w-11 shrink-0">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
