'use client'

import { useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Video,
  Sparkles,
  ArrowLeft,
  Download,
  Copy,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ChevronLeft,
} from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { Badge } from '@/components/ui/Badge'
import { useGenerationPoll } from '@/hooks/use-generation'
import { MODEL_CONFIGS } from '@/lib/providers/registry'
import { formatRelativeTime } from '@/lib/utils'

export default function GenerationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const poll = useGenerationPoll(id)
  const [copied, setCopied] = useState(false)

  const handleCopyPrompt = useCallback(async () => {
    if (poll.data?.prompt) {
      await navigator.clipboard.writeText(poll.data.prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [poll.data?.prompt])

  const handleDelete = useCallback(async () => {
    await fetch(`/api/generations/${id}`, { method: 'DELETE' })
    router.push('/generate')
  }, [id, router])

  const isLoading = poll.isLoading
  const generation = poll.data
  const model = MODEL_CONFIGS.find((m) => m.id === generation?.modelId)

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back navigation */}
        <Link
          href="/generate"
          className="mb-6 flex items-center gap-1.5 text-body-sm text-text-secondary transition-colors hover:text-text-primary"
        >
          <ChevronLeft size={16} />
          Back to Generator
        </Link>

        {isLoading && (
          <div className="space-y-6">
            <Skeleton className="aspect-video w-full rounded-xl" />
            <div className="space-y-3">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-96" />
            </div>
          </div>
        )}

        {!isLoading && !generation && (
          <div className="flex flex-col items-center justify-center py-20">
            <XCircle size={48} className="text-error-500" />
            <h2 className="mt-4 text-h4 font-semibold text-text-primary">
              Generation Not Found
            </h2>
            <p className="mt-2 text-body text-text-secondary">
              This generation doesn&apos;t exist or has been deleted.
            </p>
            <Link href="/generate" className="mt-6">
              <Button variant="primary">
                <Sparkles size={16} />
                Create New
              </Button>
            </Link>
          </div>
        )}

        {generation && !isLoading && (
          <>
            {/* Video / Preview */}
            <div className="overflow-hidden rounded-xl border border-border-default bg-black">
              {generation.status === 'completed' && generation.resultUrl ? (
                <video
                  src={generation.resultUrl}
                  controls
                  autoPlay
                  loop
                  className="w-full aspect-video"
                >
                  Your browser does not support video playback.
                </video>
              ) : generation.status === 'processing' || generation.status === 'pending' ? (
                <div className="flex aspect-video items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center">
                      <Loader2 size={40} className="animate-spin text-primary-500" />
                    </div>
                    <p className="text-body text-neutral-400">
                      {generation.status === 'pending'
                        ? 'Starting generation...'
                        : 'Generating your video...'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex aspect-video items-center justify-center">
                  <div className="text-center">
                    <XCircle size={48} className="mx-auto text-error-500" />
                    <p className="mt-3 text-body text-neutral-400">
                      {generation.errorMessage || 'Generation failed'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Info & Actions */}
            <div className="mt-6 space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <h1 className="text-h3 font-semibold text-text-primary">
                    {generation.prompt}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="default">{model?.displayName || generation.modelId}</Badge>
                    <Badge
                      variant={
                        generation.status === 'completed'
                          ? 'success'
                          : generation.status === 'failed'
                            ? 'error'
                            : 'warning'
                      }
                    >
                      {generation.status}
                    </Badge>
                    {generation.creditsCost && (
                      <span className="text-body-sm text-text-secondary">
                        {generation.creditsCost} credits
                      </span>
                    )}
                    {generation.createdAt && (
                      <span className="flex items-center gap-1 text-body-sm text-text-secondary">
                        <Clock size={14} />
                        {formatRelativeTime(generation.createdAt)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {generation.status === 'completed' && generation.resultUrl && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        const a = document.createElement('a')
                        a.href = generation.resultUrl!
                        a.download = `pixelflux-${id}.mp4`
                        a.click()
                      }}
                    >
                      <Download size={16} />
                      Download
                    </Button>
                  )}
                  <Button variant="secondary" size="sm" onClick={handleCopyPrompt}>
                    {copied ? (
                      <>
                        <CheckCircle2 size={16} />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        Copy Prompt
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-error-500 hover:text-error-500"
                    onClick={handleDelete}
                  >
                    <Trash2 size={16} />
                    Delete
                  </Button>
                </div>
              </div>

              {/* Generation Details */}
              <div className="rounded-lg border border-border-default bg-surface-elevated p-4">
                <h3 className="mb-3 text-body-sm font-semibold text-text-primary">
                  Details
                </h3>
                <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {[
                    { label: 'Model', value: model?.displayName || generation.modelId },
                    { label: 'Status', value: generation.status },
                    {
                      label: 'Duration',
                      value: generation.durationMs
                        ? `${(generation.durationMs / 1000).toFixed(1)}s`
                        : '-',
                    },
                    {
                      label: 'Aspect Ratio',
                      value: generation.params?.aspectRatio || '16:9',
                    },
                  ].map((item) => (
                    <div key={item.label}>
                      <dt className="text-caption text-text-tertiary">
                        {item.label}
                      </dt>
                      <dd className="mt-0.5 text-body-sm font-medium text-text-primary capitalize">
                        {item.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Retry if failed */}
              {generation.status === 'failed' && (
                <div className="flex justify-center">
                  <Link href={`/generate?prompt=${encodeURIComponent(generation.prompt)}`}>
                    <Button variant="primary">
                      <Sparkles size={16} />
                      Retry with Same Prompt
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </>
        )}
      </main>
      <Footer />
    </>
  )
}
