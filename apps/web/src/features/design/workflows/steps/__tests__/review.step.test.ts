import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@app/core/ai/client', () => ({
  generateWithFallback: vi.fn(),
}));

vi.mock('@app/core/prompts/review', () => ({
  buildReviewPrompt: vi.fn(() => 'mocked review prompt'),
}));

vi.mock('@app/shared', () => ({
  validateReview: vi.fn(),
}));

vi.mock('../../../lib/strip-base64', () => ({
  stripBase64Images: vi.fn(),
}));

vi.mock('../../../lib/parse-html', () => ({
  parseHtmlWithSize: vi.fn(),
}));

import { generateWithFallback } from '@app/core/ai/client';
import { buildReviewPrompt } from '@app/core/prompts/review';
import { validateReview } from '@app/shared';
import { stripBase64Images } from '../../../lib/strip-base64';
import { parseHtmlWithSize } from '../../../lib/parse-html';

const { reviewStep } = await import('../review.step');

describe('reviewStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return reviewed HTML via validateReview on success', async () => {
    const mockRestore = vi.fn((s: string) => s);
    (stripBase64Images as ReturnType<typeof vi.fn>).mockReturnValue({
      stripped: 'clean-html',
      restore: mockRestore,
    });

    (generateWithFallback as ReturnType<typeof vi.fn>).mockResolvedValue({
      result: { text: '<!--size:800x600-->\n<div>reviewed</div>' },
    } as any);

    (validateReview as ReturnType<typeof vi.fn>).mockReturnValue({
      html: '<div>reviewed</div>',
      width: 800,
      height: 600,
    });

    const result = (await reviewStep.execute({
      inputData: { html: '<div>original</div>', prompt: 'A card', width: 800, height: 600 },
    } as any)) as any;

    expect(result.html).toBe('<div>reviewed</div>');
    expect(result.width).toBe(800);
    expect(result.height).toBe(600);
    expect(stripBase64Images).toHaveBeenCalledWith('<div>original</div>');
    expect(buildReviewPrompt).toHaveBeenCalledWith('A card', 800, 600, 'clean-html');
  });

  it('should strip and restore base64 images', async () => {
    const mockRestore = vi.fn((s: string) => s.replace('PLACEHOLDER', 'data:image/png;base64,abc'));
    (stripBase64Images as ReturnType<typeof vi.fn>).mockReturnValue({
      stripped: 'html-without-base64',
      restore: mockRestore,
    });

    (generateWithFallback as ReturnType<typeof vi.fn>).mockResolvedValue({
      result: { text: 'some-ai-output' },
    } as any);

    (validateReview as ReturnType<typeof vi.fn>).mockReturnValue({
      html: '<div>PLACEHOLDER</div>',
      width: 100,
      height: 100,
    });

    const result = (await reviewStep.execute({
      inputData: { html: '<div>with-base64</div>', prompt: 'test', width: 100, height: 100 },
    } as any)) as any;

    expect(mockRestore).toHaveBeenCalledWith('<div>PLACEHOLDER</div>');
    expect(result.html).toContain('data:image/png;base64,abc');
  });

  it('should fall back to parseHtmlWithSize when validateReview throws', async () => {
    (stripBase64Images as ReturnType<typeof vi.fn>).mockReturnValue({
      stripped: 'clean',
      restore: (s: string) => s,
    });

    (generateWithFallback as ReturnType<typeof vi.fn>).mockResolvedValue({
      result: { text: 'raw-output' },
    } as any);

    (validateReview as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error('Validation failed');
    });

    (parseHtmlWithSize as ReturnType<typeof vi.fn>).mockReturnValue({
      html: '<div>fallback-parsed</div>',
      width: 500,
      height: 400,
    });

    const result = (await reviewStep.execute({
      inputData: { html: '<div>input</div>', prompt: 'test', width: 600, height: 400 },
    } as any)) as any;

    expect(parseHtmlWithSize).toHaveBeenCalledWith('raw-output');
    expect(result.html).toBe('<div>fallback-parsed</div>');
    expect(result.width).toBe(500);
  });

  it('should use default model when none provided', async () => {
    (stripBase64Images as ReturnType<typeof vi.fn>).mockReturnValue({
      stripped: 'clean',
      restore: (s: string) => s,
    });

    (generateWithFallback as ReturnType<typeof vi.fn>).mockResolvedValue({
      result: { text: 'output' },
    } as any);

    (validateReview as ReturnType<typeof vi.fn>).mockReturnValue({
      html: '<div></div>',
      width: 100,
      height: 100,
    });

    await reviewStep.execute({
      inputData: { html: '<div></div>', prompt: 'test' },
    } as any);

    expect(generateWithFallback).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'claude-opus-4-6' }),
    );
  });
});
