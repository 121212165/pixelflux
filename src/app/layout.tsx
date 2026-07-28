import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { QueryProvider } from '@/components/providers/QueryProvider'

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
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen bg-surface text-text-primary font-body antialiased">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  )
}
