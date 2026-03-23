'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Zap, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/auth.store'
import { motion } from 'framer-motion'

interface LoginForm {
  email: string
  password: string
}

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginForm>()

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data.email, data.password)
      toast.success('Welcome back!')
      router.push('/dashboard')
    } catch (error: any) {
      const status = error.response?.status
      const msg = Array.isArray(error.response?.data?.message)
        ? error.response.data.message.join(', ')
        : error.response?.data?.message
      if (!error.response || status === 502 || status === 503 || status === 504) {
        toast.error(`API unreachable (HTTP ${status ?? 'no response'}) — check Railway logs`)
      } else {
        toast.error(`[${status}] ${msg || error.message || 'Login failed'}`)
      }
    }
  }

  const demoLogin = (email: string) => {
    setValue('email', email)
    setValue('password', 'admin123')
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="absolute rounded-full bg-white"
              style={{
                width: Math.random() * 100 + 20,
                height: Math.random() * 100 + 20,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.5,
              }}
            />
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative z-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">SimpleNow</h1>
          <p className="text-white/80 text-lg mb-12">AI-Native ITSM Platform</p>

          <div className="space-y-4 text-left">
            {[
              { icon: '🤖', title: 'AI-Powered Triage', desc: 'Intelligent classification and routing' },
              { icon: '⚡', title: '10x Faster Resolution', desc: 'Smart workflows and automation' },
              { icon: '📊', title: 'Real-time Analytics', desc: 'Instant insights and reporting' },
            ].map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.1 }}
                className="flex items-start gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <span className="text-2xl">{f.icon}</span>
                <div>
                  <div className="text-white font-semibold text-sm">{f.title}</div>
                  <div className="text-white/70 text-xs">{f.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right panel - login form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">SimpleNow</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
            <p className="text-muted-foreground mt-1">Sign in to your ITSM workspace</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input
                type="email"
                placeholder="admin@simplenow.io"
                autoComplete="email"
                {...register('email', { required: 'Email is required' })}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...register('password', { required: 'Password is required' })}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full gap-2" size="lg" loading={isLoading}>
              Sign in <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6 p-4 rounded-xl border border-border bg-muted/30">
            <div className="flex items-center gap-1.5 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-muted-foreground">DEMO ACCOUNTS</span>
            </div>
            <div className="space-y-2">
              {[
                { email: 'admin@simplenow.io', role: 'Admin', color: 'text-purple-600 dark:text-purple-400' },
                { email: 'sarah.agent@simplenow.io', role: 'Agent', color: 'text-blue-600 dark:text-blue-400' },
                { email: 'viewer@simplenow.io', role: 'Viewer', color: 'text-green-600 dark:text-green-400' },
              ].map(acc => (
                <button key={acc.email} type="button" onClick={() => demoLogin(acc.email)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-background hover:bg-accent transition-colors text-left group">
                  <span className="text-xs text-muted-foreground group-hover:text-foreground">{acc.email}</span>
                  <span className={`text-xs font-semibold ${acc.color}`}>{acc.role}</span>
                </button>
              ))}
              <p className="text-xs text-muted-foreground text-center mt-1">Password: <code className="bg-muted px-1 rounded">admin123</code></p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
