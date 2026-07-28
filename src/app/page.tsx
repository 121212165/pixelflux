import Link from 'next/link'
import { Sparkles, Video, Zap, Shapes, ArrowRight } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

const models = [
  { name: 'Kling 2.5', provider: 'Kling', badge: 'POPULAR' as const },
  { name: 'Veo 3.1', provider: 'Google', badge: 'NEW' as const },
  { name: 'Seedance 2', provider: 'Seedance', badge: null },
  { name: 'Hailuo 02', provider: 'Hailuo', badge: null },
  { name: 'Wan 2.6', provider: 'Wan', badge: null },
  { name: 'Sora', provider: 'OpenAI', badge: 'BETA' as const },
]

const features = [
  {
    icon: Video,
    title: 'Multi-Model Access',
    description: 'One subscription gives you access to 6+ top AI video models. No per-model fees, no juggling accounts.',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Generate 10-second cinematic videos in under 30 seconds. Parallel processing means no waiting in line.',
  },
  {
    icon: Shapes,
    title: 'Flexible Parameters',
    description: 'Aspect ratio, duration, style presets — tweak every detail. Or use templates for one-click generation.',
  },
]

const useCases = [
  { title: 'Social Media', description: 'Short-form videos for TikTok, Reels, and Shorts' },
  { title: 'Advertising', description: 'Product demos and ad creatives in minutes' },
  { title: 'Short Films', description: 'Cinematic sequences for indie productions' },
  { title: 'E-commerce', description: 'Product showcase videos at scale' },
]

const faqs = [
  { q: 'How does the credit system work?', a: 'Each video generation costs credits based on duration and model. 1 credit ≈ $0.01. Free users get 50 credits to start.' },
  { q: 'Can I use multiple models?', a: 'Yes! One subscription covers all models. Pick the best model for each project.' },
  { q: 'What happens to my videos?', a: 'Free users: videos auto-delete after 7 days. Paid users: permanent storage. Download anytime.' },
  { q: 'Can I cancel anytime?', a: 'Absolutely. Cancel anytime — credits last until the end of your billing period.' },
]

export default function Home() {
  return (
    <>
      <Navbar />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border-default">
          <div className="absolute inset-0 bg-gradient-to-b from-primary-500/5 via-transparent to-transparent" />
          <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <Badge variant="default" className="mb-6">
                ✦ AI Video Generation Platform
              </Badge>
              <h1 className="text-display font-bold tracking-tight text-text-primary sm:text-display-xl">
                One Subscription,
                <br />
                <span className="bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
                  All AI Models
                </span>
              </h1>
              <p className="mt-6 text-body-lg text-text-secondary max-w-xl mx-auto">
                Access Kling, Veo, Seedance, and more — all from one platform.
                Generate stunning AI videos in seconds, not hours.
              </p>
              <div className="mt-10 flex items-center justify-center gap-4">
                <Link href="/api/auth/login">
                  <Button size="lg" variant="primary">
                    Start Creating Free
                    <ArrowRight size={18} />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button size="lg" variant="secondary">
                    See Pricing
                  </Button>
                </Link>
              </div>
            </div>

            {/* Model carousel */}
            <div className="mt-20 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
              {models.map((model) => (
                <Link
                  key={model.name}
                  href={`/models/${model.name.toLowerCase().replace(/\s+/g, '-')}`}
                  className="group rounded-lg border border-border-default bg-surface-elevated p-4 text-center transition-all duration-200 hover:border-border-focus hover:shadow-md"
                >
                  <div className="flex flex-col items-center gap-1.5">
                    {model.badge && (
                      <Badge
                        variant={
                          model.badge === 'POPULAR'
                            ? 'default'
                            : model.badge === 'NEW'
                              ? 'success'
                              : 'info'
                        }
                      >
                        {model.badge}
                      </Badge>
                    )}
                    <span className="text-body-sm font-medium text-text-primary mt-1">
                      {model.name}
                    </span>
                    <span className="text-caption text-text-tertiary">
                      {model.provider}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Generator Preview */}
        <section className="border-b border-border-default py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <h2 className="text-h2 font-semibold text-text-primary">
                  Left Prompt,
                  <br />
                  Right Preview
                </h2>
                <p className="mt-4 text-body-lg text-text-secondary">
                  Clean, intuitive layout. Select your model, write your prompt,
                  tweak parameters — see the result render in real-time on the
                  right.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    'Model selector with credit cost display',
                    'Smart prompt input with templates',
                    'Parameter controls: ratio, duration, style',
                    'Live progress indicator',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-body text-text-secondary">
                      <Sparkles size={16} className="text-primary-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-border-default bg-neutral-950 p-2">
                <div className="aspect-video rounded-xl bg-neutral-900 flex items-center justify-center">
                  <div className="text-center">
                    <Video size={48} className="mx-auto text-neutral-600" />
                    <p className="mt-3 text-body-sm text-neutral-500">
                      Preview Area
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-b border-border-default py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-h2 font-semibold text-text-primary">
                Why Pixelflux?
              </h2>
              <p className="mt-4 text-body-lg text-text-secondary">
                Built for creators who want power without complexity.
              </p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {features.map((feature) => (
                <Card key={feature.title} variant="hover">
                  <feature.icon size={24} className="text-primary-500" />
                  <h3 className="mt-4 text-h4 font-semibold text-text-primary">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-body text-text-secondary">
                    {feature.description}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="border-b border-border-default py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-h2 font-semibold text-text-primary text-center">
              Built For
            </h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {useCases.map((useCase) => (
                <Card key={useCase.title}>
                  <h3 className="text-h5 font-semibold text-text-primary">
                    {useCase.title}
                  </h3>
                  <p className="mt-2 text-body-sm text-text-secondary">
                    {useCase.description}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="border-b border-border-default py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-h2 font-semibold text-text-primary text-center">
              How It Works
            </h2>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {[
                { step: '01', title: 'Choose a Model', desc: 'Pick from 6+ AI video models. Each optimized for different styles and speeds.' },
                { step: '02', title: 'Write Your Prompt', desc: 'Describe what you want to see. Use templates for inspiration.' },
                { step: '03', title: 'Generate & Download', desc: 'Watch your video render in seconds. Download or share instantly.' },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-500/10 text-primary-500 font-mono text-h5">
                    {item.step}
                  </div>
                  <h3 className="mt-4 text-h4 font-semibold text-text-primary">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-body text-text-secondary">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-b border-border-default py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-h2 font-semibold text-text-primary text-center">
              Frequently Asked Questions
            </h2>
            <div className="mt-10 space-y-4">
              {faqs.map((faq) => (
                <details
                  key={faq.q}
                  className="group rounded-lg border border-border-default p-4 transition-colors open:border-primary-500/30"
                >
                  <summary className="flex cursor-pointer items-center justify-between text-body font-medium text-text-primary list-none">
                    {faq.q}
                    <ArrowRight size={16} className="transition-transform group-open:rotate-90 text-text-tertiary" />
                  </summary>
                  <p className="mt-3 text-body text-text-secondary">
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-h2 font-semibold text-text-primary">
              Ready to Create?
            </h2>
            <p className="mt-4 text-body-lg text-text-secondary">
              Join creators using Pixelflux to generate stunning AI videos.
              Start with 50 free credits — no credit card required.
            </p>
            <div className="mt-8">
              <Link href="/api/auth/login">
                <Button size="lg" variant="primary">
                  Get Started Free
                  <ArrowRight size={18} />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
