'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, CheckCircle2, Loader2, RotateCcw, ExternalLink, Zap, AlertTriangle, Clock, Shield } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/api`
    : process.env.NODE_ENV === 'production'
    ? 'https://simplenowapi-production.up.railway.app/api'
    : '/api'

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 'name' | 'email' | 'category' | 'describe' | 'urgency' | 'analyzing' | 'confirm' | 'submitting' | 'done'

interface Message {
  id: string
  from: 'bot' | 'user'
  text?: string
  chips?: Array<{ emoji: string; label: string; value: string }>
  urgencyButtons?: boolean
  analysisCard?: { priority: string; category: string; summary: string; slaHours: number }
  successCard?: { ticketNumber: string; email: string; slaHours: number; priority: string }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SLA_MAP: Record<string, number> = { critical: 1, high: 4, medium: 8, low: 24 }

const PRIORITY_CONFIG: Record<string, { bg: string; text: string; border: string; label: string; icon: string }> = {
  critical: { bg: 'bg-red-500/10',    text: 'text-red-400',    border: 'border-red-500/30',    label: 'CRITICAL', icon: '🔴' },
  high:     { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30', label: 'HIGH',     icon: '🟠' },
  medium:   { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30', label: 'MEDIUM',   icon: '🟡' },
  low:      { bg: 'bg-emerald-500/10',text: 'text-emerald-400',border: 'border-emerald-500/30',label: 'LOW',      icon: '🟢' },
}

const CATEGORIES = [
  { emoji: '💻', label: 'Laptop / PC',       value: 'Hardware',              hint: 'slow, won\'t start, blue screen...' },
  { emoji: '🔐', label: 'Password / Access',  value: 'Access Management',     hint: 'locked out, can\'t login...' },
  { emoji: '🌐', label: 'Network / VPN',      value: 'Network',               hint: 'no internet, VPN dropping...' },
  { emoji: '📧', label: 'Email / Teams',      value: 'Email & Collaboration',  hint: 'not sending, calendar broken...' },
  { emoji: '🖨️', label: 'Printer / Hardware', value: 'Hardware',              hint: 'won\'t print, jammed...' },
  { emoji: '☁️', label: 'App / Software',     value: 'Application',           hint: 'crashing, need install...' },
  { emoji: '🔒', label: 'Security Alert',     value: 'Security',              hint: 'virus, phishing, breach...' },
  { emoji: '📱', label: 'Mobile Device',      value: 'Mobile',                hint: 'phone, MDM, corp apps...' },
  { emoji: '🆘', label: 'Something Else',     value: 'General IT',            hint: 'I\'ll explain below...' },
]

const OFF_TOPIC_RESPONSES = [
  (topic: string) => `Ha! ${topic} is definitely NOT in my job description 😄\nTry Claude, ChatGPT, or Google for that one — they won't judge you.\n\nNow, what IT disaster can I actually fix? 👀`,
  (_: string) => `I only speak fluent IT, unfortunately 💻\nFor everything else, there's Google. I hear it's pretty decent 😏\n\nSo... IT problem? Let's go.`,
  (_: string) => `My boss (the IT department) would fire me if I answered that 😅\nStick to tech issues and we're best friends. Deal? 🤝`,
]

const OFF_TOPIC_KEYWORDS = [
  { keys: ['recipe', 'cook', 'food', 'bake', 'dinner', 'lunch', 'chef'], topic: 'Michelin star cooking' },
  { keys: ['weather', 'rain', 'sunny', 'forecast', 'climate'], topic: 'weather forecasting' },
  { keys: ['stock', 'crypto', 'bitcoin', 'invest', 'nifty', 'sensex', 'dow'], topic: 'financial advice' },
  { keys: ['cricket', 'football', 'soccer', 'ipl', 'sports', 'score', 'match'], topic: 'sports commentary' },
  { keys: ['movie', 'netflix', 'film', 'series', 'web series', 'ott'], topic: 'entertainment reviews' },
  { keys: ['girlfriend', 'boyfriend', 'love', 'relationship', 'dating', 'marriage'], topic: 'relationship counseling' },
  { keys: ['politic', 'election', 'modi', 'trump', 'president', 'government'], topic: 'political punditry' },
  { keys: ['travel', 'hotel', 'flight', 'vacation', 'holiday', 'tourism'], topic: 'travel planning' },
  { keys: ['joke', 'funny', 'meme', 'comedy', 'laugh'], topic: 'stand-up comedy (I tried once, it crashed)' },
]

function detectOffTopic(text: string): string | null {
  const lower = text.toLowerCase()
  for (const p of OFF_TOPIC_KEYWORDS) {
    if (p.keys.some(k => lower.includes(k))) return p.topic
  }
  return null
}

function randomOffTopicResponse(topic: string) {
  return OFF_TOPIC_RESPONSES[Math.floor(Math.random() * OFF_TOPIC_RESPONSES.length)](topic)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AriAvatar({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-8 h-8' : 'w-9 h-9'
  return (
    <div className={`${dim} rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25 shrink-0`}>
      <Zap className={size === 'sm' ? 'w-4 h-4 text-white' : 'w-4 h-4 text-white'} />
    </div>
  )
}

function TypingDots() {
  return (
    <div className="flex gap-1 items-center px-1 py-0.5">
      {[0, 1, 2].map(i => (
        <motion.div key={i} className="w-2 h-2 rounded-full bg-slate-400"
          animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }} />
      ))}
    </div>
  )
}

function AnalysisCard({ data }: { data: NonNullable<Message['analysisCard']> }) {
  const cfg = PRIORITY_CONFIG[data.priority] || PRIORITY_CONFIG.medium
  return (
    <div className={`rounded-2xl border ${cfg.border} ${cfg.bg} backdrop-blur-sm p-4 space-y-3`}>
      <div className="flex items-center gap-2">
        <span className="text-base">{cfg.icon}</span>
        <span className={`text-xs font-bold tracking-wider ${cfg.text}`}>{cfg.label} PRIORITY</span>
        <span className="ml-auto text-xs text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded-full">{data.category}</span>
      </div>
      <p className="text-sm text-slate-200 leading-relaxed">{data.summary}</p>
      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        <Clock className="w-3.5 h-3.5" />
        Response within <span className="font-semibold text-slate-300">{data.slaHours} {data.slaHours === 1 ? 'hour' : 'hours'}</span>
      </div>
    </div>
  )
}

function SuccessCard({ data }: { data: NonNullable<Message['successCard']> }) {
  const cfg = PRIORITY_CONFIG[data.priority] || PRIORITY_CONFIG.medium
  return (
    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
        <span className="font-bold text-emerald-300 text-base">Ticket Created!</span>
      </div>
      <div className="bg-slate-800/60 rounded-xl px-4 py-3 text-center">
        <p className="text-xs text-slate-400 mb-1">Your ticket number</p>
        <p className="text-2xl font-black tracking-wide text-white">{data.ticketNumber}</p>
      </div>
      <div className="text-xs text-slate-300 space-y-1.5">
        <div className="flex items-center gap-2"><span className="text-slate-500">📬 Updates to</span> <span className="font-medium">{data.email}</span></div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">⏱️ Expected reply</span>
          <span className={`font-medium ${cfg.text}`}>within {data.slaHours} {data.slaHours === 1 ? 'hour' : 'hours'}</span>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ msg, onChipClick, onUrgencyClick }: {
  msg: Message
  onChipClick?: (value: string, label: string) => void
  onUrgencyClick?: (blocked: boolean) => void
}) {
  if (msg.from === 'user') {
    return (
      <div className="flex justify-end gap-2.5 items-end">
        <div className="max-w-[78%] bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-2xl rounded-br-sm px-4 py-3 text-sm leading-relaxed shadow-lg shadow-violet-500/20">
          {msg.text}
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-2.5 items-end">
      <AriAvatar size="sm" />
      <div className="max-w-[82%] space-y-2">
        {msg.text && (
          <div className="bg-slate-800/80 border border-slate-700/50 text-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 text-sm leading-relaxed backdrop-blur-sm whitespace-pre-line">
            {msg.text}
          </div>
        )}
        {msg.analysisCard && <AnalysisCard data={msg.analysisCard} />}
        {msg.successCard && <SuccessCard data={msg.successCard} />}
        {msg.chips && (
          <div className="flex flex-wrap gap-2 pt-1">
            {msg.chips.map(c => (
              <button key={c.value + c.label}
                onClick={() => onChipClick?.(c.value, c.label)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-600/50 hover:border-violet-500/60 hover:bg-violet-500/10 text-slate-200 text-xs font-medium transition-all duration-200 backdrop-blur-sm">
                <span>{c.emoji}</span>{c.label}
              </button>
            ))}
          </div>
        )}
        {msg.urgencyButtons && (
          <div className="flex gap-2 pt-1">
            <button onClick={() => onUrgencyClick?.(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-300 text-xs font-semibold transition-all">
              <AlertTriangle className="w-3.5 h-3.5" /> Yes, totally blocked 🚨
            </button>
            <button onClick={() => onUrgencyClick?.(false)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-700/50 border border-slate-600/50 hover:border-slate-500 text-slate-300 text-xs font-semibold transition-all">
              🙂 No, I can still work
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PortalPage() {
  const [step, setStep] = useState<Step>('name')
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [aiResult, setAiResult] = useState<{ priority: string; category: string; summary: string } | null>(null)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [messages, setMessages] = useState<Message[]>([{
    id: '0', from: 'bot',
    text: "Hey there! 👋 I'm Aria, your personal IT Help Bot.\n\nI'm here to make your IT problems disappear faster than your Wi-Fi on a Monday morning ⚡\n\nFirst things first — what's your name?",
  }])

  const nextId = () => String(Date.now() + Math.random())

  const addMessage = (msg: Omit<Message, 'id'>) =>
    setMessages(prev => [...prev, { ...msg, id: nextId() }])

  const botSay = (msg: Omit<Message, 'id' | 'from'>, delay = 600) => {
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      addMessage({ from: 'bot', ...msg })
    }, delay)
  }

  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }, [messages, isTyping])

  useEffect(() => {
    if (!isTyping) setTimeout(() => inputRef.current?.focus(), 100)
  }, [isTyping, step])

  // ── Input handlers ──────────────────────────────────────────────────────────

  const handleSend = () => {
    const val = input.trim()
    if (!val || isTyping || !['name', 'email', 'describe'].includes(step)) return
    setInput('')
    setError('')
    addMessage({ from: 'user', text: val })

    if (step === 'name') {
      const firstName = val.split(' ')[0]
      setName(val)
      setStep('email')
      botSay({ text: `${firstName}! Love the name 😄\n\nDrop your work email — I'll make sure updates find their way to you.` })

    } else if (step === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        setError('That doesn\'t look like a valid email... try again?')
        setInput(val); return
      }
      setEmail(val)
      setStep('category')
      botSay({
        text: `Perfect! Now — what flavour of IT chaos are we dealing with? Pick the closest one 👇`,
        chips: CATEGORIES.map(c => ({ emoji: c.emoji, label: c.label, value: c.value })),
      })

    } else if (step === 'describe') {
      if (val.length < 10) {
        setError('Give me a little more to work with! 🙏')
        setInput(val); return
      }
      const offTopic = detectOffTopic(val)
      if (offTopic) {
        botSay({ text: randomOffTopicResponse(offTopic) })
        return
      }
      setDescription(val)
      setStep('urgency')
      botSay({
        text: `Got it! One last thing before I work my magic ✨\n\nIs this issue completely blocking your work right now?`,
        urgencyButtons: true,
      })
    }
  }

  const handleCategoryChip = (value: string, label: string) => {
    if (step !== 'category') return
    setCategory(value)
    setStep('describe')
    addMessage({ from: 'user', text: label })
    const cat = CATEGORIES.find(c => c.value === value)
    botSay({
      text: `${cat?.emoji || '🔧'} ${label} issues — my bread and butter!\n\nTell me exactly what's happening. The more detail you give me, the faster I can get the right person on it. Don't hold back! 💬`,
    })
  }

  const handleUrgencyClick = async (blocked: boolean) => {
    if (step !== 'urgency') return
    setStep('analyzing')
    addMessage({ from: 'user', text: blocked ? 'Yes, totally blocked 🚨' : 'No, I can still work 🙂' })
    if (blocked) {
      botSay({ text: `Yikes! That's rough 😬 Flagging this as urgent.\n\nRunning AI analysis on your issue...` }, 400)
    } else {
      botSay({ text: `Good to know! Let me analyze this properly for you...` }, 400)
    }

    try {
      const res = await fetch(`${API_BASE}/tickets/guest/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: description.slice(0, 120), description }),
      })
      const raw = res.ok ? await res.json() : {}
      const result = {
        priority: blocked
          ? (raw.priority === 'low' || raw.priority === 'medium' ? 'high' : raw.priority || 'high')
          : (raw.priority || 'medium'),
        category: raw.category || category || 'General IT',
        summary: raw.summary || description,
      }
      setAiResult(result)
      setStep('confirm')
      const slaHours = SLA_MAP[result.priority] || 8
      botSay({
        analysisCard: { ...result, slaHours },
      }, 1200)
      setTimeout(() => botSay({
        text: `Does this look right? If yes, I'll raise the ticket right now! 🚀`,
      }), 2400)
    } catch {
      const result = { priority: blocked ? 'high' : 'medium', category: category || 'General IT', summary: description }
      setAiResult(result)
      setStep('confirm')
      botSay({ analysisCard: { ...result, slaHours: SLA_MAP[result.priority] || 8 } }, 1000)
      setTimeout(() => botSay({ text: `Ready to submit? I'll get the IT team on this right away! 🙌` }), 2000)
    }
  }

  const handleSubmit = async () => {
    if (step !== 'confirm' || !aiResult) return
    setStep('submitting')
    addMessage({ from: 'user', text: '🚀 Submit my ticket!' })
    botSay({ text: `On it! Creating your ticket...` }, 300)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/tickets/guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reporterName: name, reporterEmail: email, title: description.slice(0, 120), description }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      const slaHours = SLA_MAP[data.priority] || 8
      setStep('done')
      botSay({
        successCard: { ticketNumber: data.ticketNumber, email, slaHours, priority: data.priority },
      }, 800)
      setTimeout(() => botSay({
        text: `You're all set, ${name.split(' ')[0]}! 🎉\n\nPro tip: If things get worse before someone reaches out, reply to the email thread with "URGENT" — it'll auto-escalate. 📬`,
      }), 2200)
    } catch {
      setStep('confirm')
      setError('Oops, something went wrong on my end 😅 Try again?')
    }
  }

  const handleReset = () => {
    setStep('name'); setInput(''); setName(''); setEmail('')
    setCategory(''); setDescription(''); setAiResult(null); setError('')
    setMessages([{ id: nextId(), from: 'bot', text: `No problem — fresh start! 🔄\n\nWhat's your name?` }])
  }

  const showTextInput = ['name', 'email', 'describe'].includes(step)
  const isDescribeStep = step === 'describe'

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">

      {/* Animated background orbs */}
      <motion.div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-violet-700/20 blur-3xl pointer-events-none"
        animate={{ x: [0, 40, 0], y: [0, 30, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="absolute bottom-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-700/15 blur-3xl pointer-events-none"
        animate={{ x: [0, -50, 0], y: [0, -40, 0], scale: [1.1, 1, 1.1] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="absolute top-[40%] left-[60%] w-[300px] h-[300px] rounded-full bg-purple-600/10 blur-3xl pointer-events-none"
        animate={{ x: [0, -30, 0], y: [0, 50, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }} />

      {/* Dot grid overlay */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

      {/* Main card */}
      <div className="w-full max-w-[440px] flex flex-col relative z-10" style={{ height: 'min(720px, 92vh)' }}>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4 px-1">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-violet-500/30">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-950" />
          </div>
          <div>
            <h1 className="font-bold text-white text-base leading-tight">Aria · IT Help Bot</h1>
            <p className="text-xs text-slate-400">Powered by SimpleNow ITSM</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-400/10 border border-emerald-400/20 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Online
          </div>
        </div>

        {/* Chat window */}
        <div className="flex-1 overflow-y-auto rounded-2xl bg-slate-900/60 border border-slate-700/40 backdrop-blur-xl p-4 space-y-4 mb-3 shadow-2xl"
          style={{ scrollbarWidth: 'none' }}>

          <AnimatePresence initial={false}>
            {messages.map(msg => (
              <motion.div key={msg.id}
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', damping: 22, stiffness: 300 }}>
                <MessageBubble msg={msg} onChipClick={handleCategoryChip} onUrgencyClick={handleUrgencyClick} />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {isTyping && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex gap-2.5 items-end">
              <AriAvatar size="sm" />
              <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl rounded-bl-sm px-4 py-3">
                <TypingDots />
              </div>
            </motion.div>
          )}

          {/* Confirm buttons */}
          {step === 'confirm' && !isTyping && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2 pt-1 pl-11">
              <button onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-600/50 hover:border-slate-500 text-slate-300 text-xs font-medium transition-all">
                <RotateCcw className="w-3.5 h-3.5" /> Start Over
              </button>
              <button onClick={handleSubmit}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-violet-500/25">
                <Zap className="w-3.5 h-3.5" /> Submit Ticket 🚀
              </button>
            </motion.div>
          )}

          {/* Done buttons */}
          {step === 'done' && !isTyping && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2 pt-1 pl-11">
              <button onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-600/50 hover:border-slate-500 text-slate-300 text-xs font-medium transition-all">
                <RotateCcw className="w-3.5 h-3.5" /> New Issue
              </button>
              <a href="/login"
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-600/50 hover:border-slate-500 text-slate-300 text-xs font-medium transition-all">
                <Shield className="w-3.5 h-3.5" /> Agent Login
              </a>
            </motion.div>
          )}

          {/* Submitting spinner */}
          {step === 'submitting' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 pl-11">
              <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
              <span className="text-xs text-slate-400">Raising your ticket...</span>
            </motion.div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-xs text-red-400 mb-2 px-1 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />{error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Input */}
        {showTextInput && (
          <div className="flex gap-2">
            {isDescribeStep ? (
              <textarea
                ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                value={input}
                onChange={e => { setInput(e.target.value); setError('') }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                placeholder="Describe your issue in detail... (Shift+Enter for new line)"
                rows={3}
                disabled={isTyping}
                className="flex-1 px-4 py-3 rounded-2xl bg-slate-800/80 border border-slate-700/50 focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 text-slate-100 placeholder-slate-500 text-sm resize-none outline-none transition-all backdrop-blur-sm disabled:opacity-50"
              />
            ) : (
              <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                type={step === 'email' ? 'email' : 'text'}
                value={input}
                onChange={e => { setInput(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder={step === 'name' ? 'Your full name...' : 'your.email@company.com'}
                disabled={isTyping}
                className="flex-1 px-4 py-3 rounded-2xl bg-slate-800/80 border border-slate-700/50 focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 text-slate-100 placeholder-slate-500 text-sm outline-none transition-all backdrop-blur-sm disabled:opacity-50"
              />
            )}
            <button onClick={handleSend} disabled={!input.trim() || isTyping}
              className="w-12 h-12 self-end rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-violet-500/25 transition-all">
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        )}

        <p className="text-center text-xs text-slate-600 mt-3">
          SimpleNow ITSM · <a href="/login" className="hover:text-slate-400 transition-colors">Agent login →</a>
        </p>
      </div>
    </div>
  )
}
