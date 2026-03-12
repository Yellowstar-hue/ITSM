import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import { Providers } from '@/components/providers'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: { default: 'SimpleNow — AI-Native ITSM', template: '%s | SimpleNow' },
  description: 'Next-generation AI ITSM platform. 10x simpler, 10x faster, fully AI-powered.',
  keywords: ['ITSM', 'IT Service Management', 'AI', 'Incident Management', 'ServiceNow alternative'],
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <Providers>
            {children}
            <Toaster
              position="bottom-right"
              toastOptions={{
                classNames: {
                  toast: 'border border-border bg-card text-card-foreground shadow-lg',
                  title: 'font-semibold text-sm',
                  description: 'text-muted-foreground text-sm',
                },
              }}
            />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
