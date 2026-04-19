import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@app/core/ai/client', () => ({
  generateWithFallback: vi.fn(),
}));

vi.mock('@app/core/prompts/critique', () => ({
  buildCritiquePrompt: vi.fn(() => 'mocked critique prompt'),
}));

vi.mock('../../../lib/strip-base64', () => ({
  stripBase64Images: vi.fn(),
}));

import { generateWithFallback } from '@app/core/ai/client';
import { buildCritiquePrompt } from '@app/core/prompts/critique';
import { stripBase64Images } from '../../../lib/strip-base64';

const { critiqueStep } = await import('../critique.step');

describe('critiqueStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return critique text on successful generation', async () => {
    (stripBase64Images as ReturnType<typeof vi.fn>).mockReturnValue({
      stripped: 'stripped-html',
      restore: (s: string) => s,
    });

    (generateWithFallback as ReturnType<typeof vi.fn>).mockResolvedValue({
      result: { text: 'The design could improve contrast and spacing.' },
    } as any);

    const result = (await critiqueStep.execute({
      inputData: { html: '<div>design</div>', prompt: 'A pricing card' },
    } as any)) as any;

    expect(result.critique).toBe('The design could improve contrast and spacing.');
    expect(buildCritiquePrompt).toHaveBeenCalledWith('A pricing card', 'stripped-html');
  });

  it('should strip base64 images before sending to AI', async () => {
    (stripBase64Images as ReturnType<typeof vi.fn>).mockReturnValue({
      stripped: 'html-without-images',
      restore: (s: string) => s,
    });

    (generateWithFallback as ReturnType<typeof vi.fn>).mockResolvedValue({
      result: { text: 'critique text' },
    } as any);

    await critiqueStep.execute({
      inputData: { html: '<div>html-with-images</div>', prompt: 'test' },
    } as any);

    expect(stripBase64Images).toHaveBeenCalledWith('<div>html-with-images</div>');
    expect(buildCritiquePrompt).toHaveBeenCalledWith('test', 'html-without-images');
    expect(generateWithFallback).toHaveBeenCalledWith(
      expect.objectContaining({ maxTokens: 1024 }),
    );
  });

  it('should use provided model over default', async () => {
    (stripBase64Images as ReturnType<typeof vi.fn>).mockReturnValue({
      stripped: 'clean',
      restore: (s: string) => s,
    });

    (generateWithFallback as ReturnType<typeof vi.fn>).mockResolvedValue({
      result: { text: 'critique' },
    } as any);

    await critiqueStep.execute({
      inputData: { html: '<div></div>', prompt: 'test', model: 'claude-sonnet-4' },
    } as any);

    expect(generateWithFallback).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'claude-sonnet-4' }),
    );
  });
});
