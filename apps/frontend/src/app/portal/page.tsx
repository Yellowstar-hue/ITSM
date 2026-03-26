'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, CheckCircle2, Loader2, RotateCcw, ExternalLink } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Reuse the same API base logic as lib/api.ts
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/api`
    : process.env.NODE_ENV === 'production'
    ? 'https://simplenowapi-production.up.railway.app/api'
    : '/api'

type Step = 'name' | 'email' | 'describe' | 'analyzing' | 'confirm' | 'submitting' | 'done'

interface Message {
  id: string
  from: 'bot' | 'user'
  text: string
  isCard?: boolean
  cardData?: { priority: string; category: string; summary: string }
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high:     'bg-orange-100 text-orange-700 border-orange-200',
  medium:   'bg-yellow-100 text-yellow-700 border-yellow-200',
  low:      'bg-green-100 text-green-700 border-green-200',
}

const SLA_HOURS: Record<string, number> = { critical: 1, high: 4, medium: 8, low: 24 }

function BotBubble({ msg }: { msg: Message }) {
  return (
    <div className="flex gap-3 items-start">
      <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center shrink-0 mt-0.5 shadow">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="max-w-[80%]">
        {msg.isCard && msg.cardData ? (
          <div className="rounded-2xl rounded-tl-sm border border-gray-200 bg-white shadow-sm p-4 space-y-3 text-sm">
            <p className="font-medium text-gray-800">Here's what I found:</p>
            <div className="flex flex-wrap gap-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${PRIORITY_COLORS[msg.cardData.priority] || PRIORITY_COLORS.medium}`}>
                {msg.cardData.priority.toUpperCase()} priority
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold border bg-violet-50 text-violet-700 border-violet-200">
                {msg.cardData.category}
              </span>
            </div>
            <p className="text-gray-600 leading-relaxed">{msg.cardData.summary}</p>
            <p className="text-xs text-gray-400">Expected response: within {SLA_HOURS[msg.cardData.priority] || 8} hour{(SLA_HOURS[msg.cardData.priority] || 8) > 1 ? 's' : ''}</p>
          </div>
        ) : (
          <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed whitespace-pre-line">
            {msg.text}
          </div>
        )}
      </div>
    </div>
  )
}

function UserBubble({ msg }: { msg: Message }) {
  return (
    <div className="flex gap-3 items-start flex-row-reverse">
      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold text-gray-500">
        Me
      </div>
      <div className="max-w-[80%] bg-violet-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed">
        {msg.text}
      </div>
    </div>
  )
}

export default function PortalPage() {
  const [step, setStep] = useState<Step>('name')
  const [input, setInput] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [description, setDescription] = useState('')
  const [aiResult, setAiResult] = useState<{ priority: string; category: string; summary: string } | null>(null)
  const [ticketNumber, setTicketNumber] = useState('')
  const [error, setError] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', from: 'bot', text: "Hi there! 👋 I'm the IT Help Bot.\n\nI can help you report an IT issue and get it to the right team quickly.\n\nFirst, what's your name?" },
  ])
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, step])

  const addMessage = (msg: Omit<Message, 'id'>) => {
    setMessages(prev => [...prev, { ...msg, id: Date.now().toString() }])
  }

  const handleSend = async () => {
    const value = input.trim()
    if (!value || step === 'analyzing' || step === 'submitting' || step === 'done') return
    setInput('')
    setError('')

    addMessage({ from: 'user', text: value })

    if (step === 'name') {
      setName(value)
      setStep('email')
      setTimeout(() => addMessage({
        from: 'bot',
        text: `Nice to meet you, ${value.split(' ')[0]}! 😊\n\nWhat's your work email address? We'll use this to keep you updated on your ticket.`,
      }), 400)

    } else if (step === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        setError('Please enter a valid email address.')
        setInput(value)
        return
      }
      setEmail(value)
      setStep('describe')
      setTimeout(() => addMessage({
        from: 'bot',
        text: `Got it! ✉️\n\nNow, please describe your IT issue in as much detail as you can. The more you tell me, the faster we can fix it.`,
      }), 400)

    } else if (step === 'describe') {
      if (value.length < 10) {
        setError('Please describe your issue in a bit more detail.')
        setInput(value)
        return
      }
      setDescription(value)
      setStep('analyzing')
      setTimeout(() => addMessage({ from: 'bot', text: '🔍 Analysing your issue...' }), 400)

      try {
        const res = await fetch(`${API_BASE}/tickets/guest/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: value.slice(0, 120), description: value }),
        })
        if (!res.ok) throw new Error()
        const data = await res.json()
        const result = { priority: data.priority || 'medium', category: data.category || 'General IT', summary: data.summary || value }
        setAiResult(result)
        setStep('confirm')
        setTimeout(() => {
          addMessage({ from: 'bot', text: '', isCard: true, cardData: result })
          setTimeout(() => addMessage({ from: 'bot', text: 'Does this look right? Click **Submit Ticket** to raise it, or **Start Over** if you want to re-describe your issue.' }), 600)
        }, 500)
      } catch {
        // Fallback — proceed without AI
        const result = { priority: 'medium', category: 'General IT', summary: value }
        setAiResult(result)
        setStep('confirm')
        setTimeout(() => {
          addMessage({ from: 'bot', text: '', isCard: true, cardData: result })
          setTimeout(() => addMessage({ from: 'bot', text: 'Ready to submit your ticket? Click **Submit Ticket** below.' }), 600)
        }, 500)
      }
    }
  }

  const handleSubmit = async () => {
    setStep('submitting')
    addMessage({ from: 'user', text: 'Submit Ticket' })
    setError('')
    try {
      const res = await fetch(`${API_BASE}/tickets/guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reporterName: name, reporterEmail: email, title: description.slice(0, 120), description }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setTicketNumber(data.ticketNumber)
      setStep('done')
      setTimeout(() => addMessage({
        from: 'bot',
        text: `✅ Done! Your ticket **${data.ticketNumber}** has been created.\n\nThe IT team will contact you at **${email}**.\nExpected response: within ${SLA_HOURS[data.priority] || 8} hour${(SLA_HOURS[data.priority] || 8) > 1 ? 's' : ''}.\n\nIs there anything else I can help you with?`,
      }), 500)
    } catch {
      setStep('confirm')
      setError('Something went wrong submitting your ticket. Please try again.')
    }
  }

  const handleReset = () => {
    setStep('name')
    setInput('')
    setName('')
    setEmail('')
    setDescription('')
    setAiResult(null)
    setTicketNumber('')
    setError('')
    setMessages([{ id: Date.now().toString(), from: 'bot', text: "No problem! Let's start over.\n\nWhat's your name?" }])
  }

  const inputPlaceholder =
    step === 'name'     ? 'Your full name...' :
    step === 'email'    ? 'your.email@company.com' :
    step === 'describe' ? 'Describe your IT issue in detail...' :
    step === 'done'     ? 'Issue resolved? Type your follow-up...' : ''

  const showInput   = ['name', 'email', 'describe', 'done'].includes(step)
  const showConfirm = step === 'confirm'
  const showSpinner = step === 'analyzing' || step === 'submitting'

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-blue-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg flex flex-col" style={{ height: 'min(700px, 90vh)' }}>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center shadow">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 text-lg leading-tight">IT Help Bot</h1>
            <p className="text-xs text-gray-500">Powered by SimpleNow ITSM</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-green-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Online
          </div>
        </div>

        {/* Chat window */}
        <div className="flex-1 overflow-y-auto bg-white rounded-2xl shadow-lg border border-gray-100 p-4 space-y-4 mb-3">
          <AnimatePresence initial={false}>
            {messages.map(msg => (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                {msg.from === 'bot' ? <BotBubble msg={msg} /> : <UserBubble msg={msg} />}
              </motion.div>
            ))}
          </AnimatePresence>

          {showSpinner && (
            <div className="flex gap-3 items-center">
              <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center shrink-0 shadow">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
                <span className="text-sm text-gray-500">{step === 'submitting' ? 'Creating your ticket...' : 'Analysing your issue...'}</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-red-600 mb-2 px-1">{error}</p>
        )}

        {/* Input area */}
        {showInput && (
          <div className="flex gap-2">
            <input
              type={step === 'email' ? 'email' : 'text'}
              value={input}
              onChange={e => { setInput(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder={inputPlaceholder}
              autoFocus
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent shadow-sm"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="w-12 h-12 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shadow transition-colors"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        )}

        {/* Confirm buttons */}
        {showConfirm && (
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
            >
              <RotateCcw className="w-4 h-4" /> Start Over
            </button>
            <button
              onClick={handleSubmit}
              className="flex-2 flex-[2] flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors shadow"
            >
              <CheckCircle2 className="w-4 h-4" /> Submit Ticket
            </button>
          </div>
        )}

        {/* Done — new ticket button */}
        {step === 'done' && (
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
            >
              <RotateCcw className="w-4 h-4" /> Report Another Issue
            </button>
            <a
              href="/login"
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-800 hover:bg-gray-900 text-white text-sm font-semibold transition-colors shadow"
            >
              <ExternalLink className="w-4 h-4" /> Agent Login
            </a>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-3">
          SimpleNow ITSM · <a href="/login" className="hover:text-gray-600 underline">Agent login</a>
        </p>
      </div>
    </div>
  )
}
