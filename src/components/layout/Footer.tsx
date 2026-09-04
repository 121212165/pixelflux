import Link from 'next/link'

const modelLinks = [
  { href: '/models/kling-2.5', label: 'Kling 2.5' },
  { href: '/models/veo-3.1', label: 'Veo 3.1' },
  { href: '/models/seedance-2', label: 'Seedance 2' },
  { href: '/models/hailuo-02', label: 'Hailuo 02' },
]

const legalLinks = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' },
  { href: '/faq', label: 'FAQ' },
]

export function Footer() {
  return (
    <footer className="border-t border-border-default bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="text-h5 font-semibold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent"
            >
              Pixelflux
            </Link>
            <p className="mt-2 text-body-sm text-text-secondary max-w-xs">
              One subscription, all AI models. Generate stunning videos with
              cutting-edge AI technology.
            </p>
          </div>

          {/* Models */}
          <div>
            <h4 className="text-body-sm font-semibold text-text-primary mb-3">
              Models
            </h4>
            <ul className="space-y-2">
              {modelLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-body-sm text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-body-sm font-semibold text-text-primary mb-3">
              Legal
            </h4>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-body-sm text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border-default pt-6">
          <p className="text-center text-caption text-text-tertiary">
            &copy; {new Date().getFullYear()} Pixelflux. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
