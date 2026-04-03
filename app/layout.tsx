import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from '@vercel/speed-insights/next'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    default: 'alt.win',
    template: '%s | alt.win'
  },
  description: 'Your Alternative Way of Winning',
  icons: {
    icon: [
      { url: 'https://wmbkedgxpkgrfet3.public.blob.vercel-storage.com/logo.svg', type: 'image/svg+xml' },
      { url: 'https://wmbkedgxpkgrfet3.public.blob.vercel-storage.com/logo.svg', sizes: 'any' }
    ],
    shortcut: 'https://wmbkedgxpkgrfet3.public.blob.vercel-storage.com/logo.svg',
    apple: 'https://wmbkedgxpkgrfet3.public.blob.vercel-storage.com/logo.svg',
  },
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({
  children,
}: RootLayoutProps) {
  return (
    <html className='touch-manipulation' suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
      </head>
      <body className={`${inter.className} antialiased`}>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}