'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/models/kling-2.5', label: 'Models' },
  { href: '/templates', label: 'Templates' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/faq', label: 'FAQ' },
]

interface NavbarProps {
  user?: { id: string; email?: string; name?: string; avatar?: string } | null
}

export function Navbar({ user }: NavbarProps) {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-default bg-surface/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-h5 font-semibold text-text-primary"
        >
          <span className="bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
            Pixelflux
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-body text-text-secondary transition-colors hover:text-text-primary"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop auth */}
        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <Link href="/generate">
              <Button variant="primary" size="sm">
                Start Creating
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/api/auth/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/api/auth/login">
                <Button variant="primary" size="sm">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 text-text-secondary"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-border-default bg-surface md:hidden">
          <div className="space-y-2 px-4 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block py-2 text-body text-text-secondary"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2">
              {user ? (
                <Link href="/generate" onClick={() => setOpen(false)}>
                  <Button className="w-full">Start Creating</Button>
                </Link>
              ) : (
                <Link href="/api/auth/login" onClick={() => setOpen(false)}>
                  <Button className="w-full">Get Started</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
