import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GeneratePage from '../page'

vi.mock('@/hooks/use-generation', () => ({
  useGenerate: () => ({
    mutation: {
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
    },
    activeId: null,
    setActiveId: vi.fn(),
  }),
  useGenerationPoll: () => ({
    data: null,
    isLoading: false,
  }),
}))

vi.mock('@/components/layout/Navbar', () => ({
  Navbar: () => <div data-testid="navbar">Navbar</div>,
}))

vi.mock('@/components/layout/Footer', () => ({
  Footer: () => <div data-testid="footer">Footer</div>,
}))

describe('GeneratePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('renders model selector', () => {
      render(<GeneratePage />)
      expect(screen.getByText('Model')).toBeInTheDocument()
      expect(screen.getByText('Kling 2.5')).toBeInTheDocument()
    })

    it('renders prompt input', () => {
      render(<GeneratePage />)
      expect(screen.getByText('Prompt')).toBeInTheDocument()
      const textarea = screen.getByPlaceholderText('Describe the video you want to create...')
      expect(textarea).toBeInTheDocument()
    })

    it('renders parameter controls (duration, aspect ratio, style)', () => {
      render(<GeneratePage />)
      expect(screen.getByText('Duration')).toBeInTheDocument()
      expect(screen.getByText('Aspect Ratio')).toBeInTheDocument()
      expect(screen.getByText('Style')).toBeInTheDocument()
    })

    it('shows empty state with prompt to start', () => {
      render(<GeneratePage />)
      expect(screen.getByText('Enter a prompt to start')).toBeInTheDocument()
      expect(screen.getByText(/Describe the video you want to create/i)).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('expands model selector to show model list', async () => {
      const user = userEvent.setup()
      render(<GeneratePage />)

      const modelButton = screen.getByRole('button', { name: /kling 2.5/i })
      await user.click(modelButton)

      await waitFor(() => {
        expect(screen.getByText('Veo 3.1')).toBeInTheDocument()
        expect(screen.getByText('Seedance 2')).toBeInTheDocument()
      })
    })

    it('can input prompt text', async () => {
      const user = userEvent.setup()
      render(<GeneratePage />)

      const textarea = screen.getByPlaceholderText('Describe the video you want to create...')
      await user.type(textarea, 'A beautiful sunset over the ocean')

      expect(textarea).toHaveValue('A beautiful sunset over the ocean')
    })

    it('can select duration option', async () => {
      const user = userEvent.setup()
      render(<GeneratePage />)

      const durationButton = screen.getByRole('button', { name: '5s' })
      await user.click(durationButton)

      expect(screen.getByRole('button', { name: '5s' })).toHaveClass(/bg-primary-500/)
    })

    it('can select aspect ratio option', async () => {
      const user = userEvent.setup()
      render(<GeneratePage />)

      const aspectButton = screen.getByRole('button', { name: '9:16' })
      await user.click(aspectButton)

      expect(screen.getByRole('button', { name: '9:16' })).toHaveClass(/bg-primary-500/)
    })

    it('can select style option', async () => {
      const user = userEvent.setup()
      render(<GeneratePage />)

      const styleButton = screen.getByRole('button', { name: 'Anime' })
      await user.click(styleButton)

      expect(screen.getByRole('button', { name: 'Anime' })).toHaveClass(/bg-primary-500/)
    })
  })

  describe('Generate Button States', () => {
    it('Generate button is disabled when prompt is empty', () => {
      render(<GeneratePage />)
      const generateButton = screen.getByRole('button', { name: /generate video/i })
      expect(generateButton).toBeDisabled()
    })

    it('Generate button is enabled when prompt has text', async () => {
      const user = userEvent.setup()
      render(<GeneratePage />)

      const textarea = screen.getByPlaceholderText('Describe the video you want to create...')
      await user.type(textarea, 'Test prompt')

      const generateButton = screen.getByRole('button', { name: /generate video/i })
      expect(generateButton).not.toBeDisabled()
    })
  })
})
