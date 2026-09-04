import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { QueryProvider } from '@/components/providers/QueryProvider'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: 'Pixelflux — One Subscription, All AI Models',
    template: '%s | Pixelflux',
  },
  description:
    'Access the best AI video generation models with one subscription. Generate stunning videos with Kling, Veo, Seedance and more.',
  openGraph: {
    title: 'Pixelflux — AI Video Generation Platform',
    description:
      'One subscription, all AI video models. Generate, download, and create.',
    siteName: 'Pixelflux',
    type: 'website',
    locale: 'en_US',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-surface text-text-primary font-body antialiased">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  )
}
