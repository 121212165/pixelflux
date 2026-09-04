'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Video,
  Sparkles,
  ArrowRight,
  Loader2,
  CheckCircle2,
  XCircle,
  Download,
  Copy,
  Trash2,
  ChevronDown,
  AlertTriangle,
} from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useGenerate, useGenerationPoll } from '@/hooks/use-generation'
import { MODEL_CONFIGS } from '@/lib/providers/registry'

const aspectRatios = [
  { value: '16:9', label: '16:9' },
  { value: '9:16', label: '9:16' },
  { value: '1:1', label: '1:1' },
  { value: '4:3', label: '4:3' },
]

const durations = [
  { value: 5, label: '5s' },
  { value: 10, label: '10s' },
  { value: 15, label: '15s' },
  { value: 30, label: '30s' },
]

const styles = [
  'Cinematic',
  'Realistic',
  'Anime',
  'Fantasy',
  'Artistic',
  'Animation',
]

const stages = [
  'Analyzing prompt...',
  'Generating frames...',
  'Enhancing quality...',
  'Finalizing...',
]

export default function GeneratePage() {
  const [selectedModel, setSelectedModel] = useState(MODEL_CONFIGS[0])
  const [prompt, setPrompt] = useState('')
  const [aspectRatio, setAspectRatio] = useState('16:9')
  const [duration, setDuration] = useState(10)
  const [style, setStyle] = useState('Cinematic')
  const [modelOpen, setModelOpen] = useState(false)
  const [stageIndex, setStageIndex] = useState(0)
  const [copied, setCopied] = useState(false)

  const { mutation, activeId, setActiveId } = useGenerate()
  const poll = useGenerationPoll(activeId)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (ta) {
      ta.style.height = 'auto'
      ta.style.height = `${ta.scrollHeight}px`
    }
  }, [prompt])

  // Rotate stage messages during generation
  useEffect(() => {
    if (poll.data?.status === 'processing') {
      const interval = setInterval(() => {
        setStageIndex((i) => (i + 1) % stages.length)
      }, 4000)
      return () => clearInterval(interval)
    }
  }, [poll.data?.status])

  // Reset active ID when generation completes/fails
  useEffect(() => {
    if (poll.data?.status === 'completed' || poll.data?.status === 'failed') {
      // Keep activeId so the result shows
    }
  }, [poll.data?.status])

  const handleGenerate = useCallback(() => {
    if (!prompt.trim()) return
    setStageIndex(0)
    mutation.mutate({
      modelId: selectedModel.id,
      prompt: prompt.trim(),
      params: { aspectRatio, duration, style },
    })
  }, [prompt, selectedModel, aspectRatio, duration, style, mutation])

  const handleRegenerate = useCallback(() => {
    setActiveId(null)
    setTimeout(() => handleGenerate(), 100)
  }, [handleGenerate, setActiveId])

  const handleCopyPrompt = useCallback(async () => {
    if (poll.data?.prompt) {
      await navigator.clipboard.writeText(poll.data.prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [poll.data?.prompt])

  const handleDelete = useCallback(async () => {
    if (activeId) {
      await fetch(`/api/generations/${activeId}`, { method: 'DELETE' })
      setActiveId(null)
      setPrompt('')
    }
  }, [activeId, setActiveId])

  const creditsCost = selectedModel.creditsPerSecond * duration
  const isGenerating = poll.data?.status === 'processing' || poll.data?.status === 'pending'
  const isComplete = poll.data?.status === 'completed'
  const isFailed = poll.data?.status === 'failed'
  const hasResult = isComplete || isFailed

  return (
    <>
      <Navbar />
      <main className="flex min-h-[calc(100vh-4rem)] flex-col lg:flex-row">
        {/* Left Panel */}
        <aside className="w-full border-b border-border-default bg-surface lg:w-[400px] lg:border-b-0 lg:border-r">
          <div className="flex flex-col gap-5 p-5">
            {/* Model Selector */}
            <div>
              <label className="mb-1.5 block text-body-sm font-medium text-text-primary">
                Model
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setModelOpen(!modelOpen)}
                  disabled={isGenerating}
                  className="flex w-full items-center justify-between rounded-lg border border-border-default bg-surface-elevated px-3 py-2.5 text-body text-text-primary transition-colors hover:border-border-focus disabled:opacity-50"
                >
                  <span className="flex items-center gap-2">
                    <Video size={16} className="text-primary-500" />
                    {selectedModel.displayName}
                    <Badge variant="neutral" className="text-[10px]">
                      {selectedModel.provider}
                    </Badge>
                  </span>
                  <ChevronDown size={16} className="text-text-tertiary" />
                </button>
                {modelOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setModelOpen(false)}
                    />
                    <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-lg border border-border-default bg-surface-elevated py-1 shadow-lg">
                      {MODEL_CONFIGS.map((model) => (
                        <button
                          key={model.id}
                          type="button"
                          onClick={() => {
                            setSelectedModel(model)
                            setModelOpen(false)
                          }}
                          className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-body transition-colors hover:bg-primary-500/5 ${
                            selectedModel.id === model.id
                              ? 'text-primary-500'
                              : 'text-text-primary'
                          }`}
                        >
                          <div className="flex flex-1 items-center justify-between">
                            <div>
                              <span className="font-medium">{model.displayName}</span>
                              <span className="ml-2 text-caption text-text-tertiary">
                                {model.provider}
                              </span>
                            </div>
                            <span className="text-caption text-text-tertiary">
                              {model.creditsPerSecond}cr/s
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Prompt Input */}
            <div>
              <label className="mb-1.5 block text-body-sm font-medium text-text-primary">
                Prompt
              </label>
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the video you want to create..."
                disabled={isGenerating}
                rows={4}
                className="w-full resize-none rounded-lg border border-border-default bg-surface-elevated px-3 py-2.5 text-body text-text-primary placeholder:text-text-tertiary transition-colors focus:border-primary-500 focus:outline-none disabled:opacity-50"
              />
            </div>

            {/* Parameter Controls */}
            <div className="space-y-4">
              {/* Aspect Ratio */}
              <div>
                <label className="mb-1.5 block text-body-sm font-medium text-text-primary">
                  Aspect Ratio
                </label>
                <div className="flex gap-1.5">
                  {aspectRatios.map((ar) => (
                    <button
                      key={ar.value}
                      type="button"
                      onClick={() => setAspectRatio(ar.value)}
                      disabled={isGenerating}
                      className={`flex-1 rounded-md px-2 py-1.5 text-center text-caption font-medium transition-colors ${
                        aspectRatio === ar.value
                          ? 'bg-primary-500 text-white'
                          : 'bg-surface-elevated text-text-secondary hover:bg-surface-border border border-border-default'
                      } disabled:opacity-50`}
                    >
                      {ar.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="mb-1.5 block text-body-sm font-medium text-text-primary">
                  Duration
                </label>
                <div className="flex gap-1.5">
                  {durations.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => setDuration(d.value)}
                      disabled={d.value > selectedModel.capabilities.maxDuration || isGenerating}
                      className={`flex-1 rounded-md px-2 py-1.5 text-center text-caption font-medium transition-colors ${
                        duration === d.value
                          ? 'bg-primary-500 text-white'
                          : 'bg-surface-elevated text-text-secondary hover:bg-surface-border border border-border-default'
                      } disabled:cursor-not-allowed disabled:opacity-30`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Style */}
              <div>
                <label className="mb-1.5 block text-body-sm font-medium text-text-primary">
                  Style
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {styles.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStyle(s)}
                      disabled={isGenerating}
                      className={`rounded-full px-3 py-1 text-caption font-medium transition-colors ${
                        style === s
                          ? 'bg-primary-500/15 text-primary-500'
                          : 'bg-surface-elevated text-text-secondary hover:bg-surface-border border border-border-default'
                      } disabled:opacity-50`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Credits + Generate */}
            <div className="mt-auto space-y-3 border-t border-border-default pt-4">
              <div className="flex items-center justify-between">
                <span className="text-body-sm text-text-secondary">
                  Cost: <strong className="text-text-primary">{creditsCost}</strong> credits
                </span>
                <span className="text-body-sm text-text-secondary">
                  ~{duration + 10}s
                </span>
              </div>

              {isGenerating ? (
                <Button className="w-full" disabled>
                  <Loader2 size={18} className="animate-spin" />
                  Generating...
                </Button>
              ) : isComplete ? (
                <div className="flex gap-2">
                  <Button className="flex-1" variant="secondary" onClick={handleRegenerate}>
                    <Sparkles size={16} />
                    Re-generate
                  </Button>
                  <Link href={`/generate/${activeId}`} className="flex-1">
                    <Button className="w-full" variant="primary">
                      View Detail
                      <ArrowRight size={16} />
                    </Button>
                  </Link>
                </div>
              ) : (
                <Button
                  className="w-full"
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || mutation.isPending}
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Generate Video
                    </>
                  )}
                </Button>
              )}

              {mutation.isError && (
                <div className="flex items-start gap-2 rounded-lg border border-error-500/30 bg-error-500/5 p-3">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0 text-error-500" />
                  <p className="text-body-sm text-error-500">
                    {mutation.error instanceof Error
                      ? mutation.error.message
                      : '生成失败'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Right Panel — Preview Area */}
        <section className="flex flex-1 items-center justify-center bg-neutral-950 p-4">
          {!activeId && !mutation.isPending && (
            /* Empty State */
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-neutral-900">
                <Video size={48} className="text-neutral-600" />
              </div>
              <h2 className="text-h4 font-semibold text-neutral-400">
                Enter a prompt to start
              </h2>
              <p className="mt-2 text-body text-neutral-600 max-w-sm">
                Describe the video you want to create, choose your model, and
                click Generate.
              </p>
            </div>
          )}

          {mutation.isPending && !activeId && (
            /* Starting state */
            <div className="text-center">
              <Loader2 size={48} className="mx-auto animate-spin text-primary-500" />
              <p className="mt-4 text-body text-neutral-400">
                Preparing generation...
              </p>
            </div>
          )}

          {isGenerating && (
            /* Generating State */
            <div className="w-full max-w-2xl">
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center">
                  <div className="relative">
                    <Loader2
                      size={40}
                      className="animate-spin text-primary-500"
                    />
                    <div className="absolute inset-0 animate-ping rounded-full bg-primary-500/20" />
                  </div>
                </div>
                <p className="text-body text-neutral-400">{stages[stageIndex]}</p>
                <p className="mt-1 text-caption text-neutral-600">
                  This usually takes {duration + 5}-{duration + 15} seconds
                </p>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-neutral-800">
                <div className="h-full animate-progress rounded-full bg-gradient-to-r from-primary-500 to-accent-500" />
              </div>
            </div>
          )}

          {isComplete && poll.data?.resultUrl && (
            /* Result State */
            <div className="w-full max-w-4xl">
              <div className="overflow-hidden rounded-xl border border-neutral-800 bg-black">
                <video
                  src={poll.data.resultUrl}
                  controls
                  autoPlay
                  loop
                  className="w-full aspect-video"
                  poster={undefined}
                >
                  Your browser does not support video playback.
                </video>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const a = document.createElement('a')
                    a.href = poll.data!.resultUrl!
                    a.download = `pixelflux-${activeId}.mp4`
                    a.click()
                  }}
                >
                  <Download size={16} />
                  Download
                </Button>
                <Button variant="secondary" size="sm" onClick={handleCopyPrompt}>
                  {copied ? (
                    <>
                      <CheckCircle2 size={16} />
                      Copied!
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
          )}

          {isFailed && (
            /* Error State */
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-error-500/10">
                <XCircle size={40} className="text-error-500" />
              </div>
              <h2 className="text-h4 font-semibold text-neutral-300">
                Generation Failed
              </h2>
              <p className="mt-2 text-body text-neutral-500">
                {poll.data?.errorMessage || 'Something went wrong. Your credits have been refunded.'}
              </p>
              <Button
                variant="primary"
                className="mt-6"
                onClick={() => {
                  setActiveId(null)
                  setPrompt(poll.data?.prompt || '')
                }}
              >
                <Sparkles size={16} />
                Try Again
              </Button>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  )
}
