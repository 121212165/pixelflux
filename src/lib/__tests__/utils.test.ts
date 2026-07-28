import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { formatRelativeTime } from '../utils'

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return "Just now" for time less than 1 minute ago', () => {
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'))

    const result = formatRelativeTime(new Date('2024-01-01T11:59:30Z'))
    expect(result).toBe('Just now')
  })

  it('should return "Just now" for a Date object just now', () => {
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'))

    const result = formatRelativeTime(new Date('2024-01-01T11:59:50Z'))
    expect(result).toBe('Just now')
  })

  it('should return minutes ago for time between 1-59 minutes', () => {
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'))

    expect(formatRelativeTime(new Date('2024-01-01T11:45:00Z'))).toBe('15m ago')
    expect(formatRelativeTime(new Date('2024-01-01T11:59:00Z'))).toBe('1m ago')
    expect(formatRelativeTime('2024-01-01T11:30:00Z')).toBe('30m ago')
  })

  it('should return hours ago for time between 1-23 hours', () => {
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'))

    expect(formatRelativeTime(new Date('2024-01-01T10:00:00Z'))).toBe('2h ago')
    expect(formatRelativeTime(new Date('2024-01-01T11:00:00Z'))).toBe('1h ago')
    expect(formatRelativeTime('2024-01-01T06:30:00Z')).toBe('5h ago')
  })

  it('should return days ago for time between 1-6 days', () => {
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'))

    expect(formatRelativeTime(new Date('2023-12-31T12:00:00Z'))).toBe('1d ago')
    expect(formatRelativeTime(new Date('2023-12-29T12:00:00Z'))).toBe('3d ago')
    expect(formatRelativeTime('2023-12-27T12:00:00Z')).toBe('5d ago')
  })

  it('should return formatted date for time older than 7 days', () => {
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'))

    const result = formatRelativeTime(new Date('2023-12-20T12:00:00Z'))
    expect(result).toBe('Dec 20, 2023')
  })

  it('should accept string date input', () => {
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'))

    expect(formatRelativeTime('2024-01-01T11:45:00Z')).toBe('15m ago')
  })

  it('should handle edge case of exactly 60 minutes', () => {
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'))

    expect(formatRelativeTime(new Date('2024-01-01T11:00:00Z'))).toBe('1h ago')
  })

  it('should handle edge case of exactly 24 hours', () => {
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'))

    expect(formatRelativeTime(new Date('2023-12-31T12:00:00Z'))).toBe('1d ago')
  })

  it('should handle edge case of exactly 7 days', () => {
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'))

    const result = formatRelativeTime(new Date('2023-12-25T12:00:00Z'))
    expect(result).toBe('Dec 25, 2023')
  })
})
