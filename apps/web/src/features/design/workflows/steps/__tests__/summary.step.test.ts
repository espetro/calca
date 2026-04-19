import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@app/core/ai/client', () => ({
  generateWithFallback: vi.fn(),
}));

vi.mock('@app/core/prompts/summary', () => ({
  buildSummaryPrompt: vi.fn(() => 'mocked summary prompt'),
}));

vi.mock('@app/shared', () => ({
  validateSummary: vi.fn(),
}));

vi.mock('../../../lib/strip-base64', () => ({
  stripBase64Images: vi.fn(),
}));

import { generateWithFallback } from '@app/core/ai/client';
import { buildSummaryPrompt } from '@app/core/prompts/summary';
import { validateSummary } from '@app/shared';
import { stripBase64Images } from '../../../lib/strip-base64';

const { summaryStep } = await import('../summary.step');

describe('summaryStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return validated summary on successful generation', async () => {
    (stripBase64Images as ReturnType<typeof vi.fn>).mockReturnValue({
      stripped: 'stripped-html',
      restore: (s: string) => s,
    });

    const summaryObj = { title: 'Pricing Card', description: 'A card with pricing' };

    (generateWithFallback as ReturnType<typeof vi.fn>).mockResolvedValue({
      result: { text: JSON.stringify(summaryObj) },
    } as any);

    (validateSummary as ReturnType<typeof vi.fn>).mockReturnValue(summaryObj);

    const result = (await summaryStep.execute({
      inputData: {
        html: '<div>design</div>',
        prompt: 'A pricing card',
        labels: ['card', 'pricing'],
      },
    } as any)) as any;

    expect(result.summary).toBe(JSON.stringify(summaryObj));
    expect(buildSummaryPrompt).toHaveBeenCalledWith('A pricing card', 'stripped-html', [
      'card',
      'pricing',
    ]);
  });

  it('should return raw text when JSON parsing fails', async () => {
    (stripBase64Images as ReturnType<typeof vi.fn>).mockReturnValue({
      stripped: 'clean',
      restore: (s: string) => s,
    });

    (generateWithFallback as ReturnType<typeof vi.fn>).mockResolvedValue({
      result: { text: 'This is a plain text summary without JSON' },
    } as any);

    const result = (await summaryStep.execute({
      inputData: { html: '<div></div>', prompt: 'test' },
    } as any)) as any;

    expect(result.summary).toBe('This is a plain text summary without JSON');
  });

  it('should return raw text when validateSummary throws', async () => {
    (stripBase64Images as ReturnType<typeof vi.fn>).mockReturnValue({
      stripped: 'clean',
      restore: (s: string) => s,
    });

    (generateWithFallback as ReturnType<typeof vi.fn>).mockResolvedValue({
      result: { text: JSON.stringify({ title: 'Test' }) },
    } as any);

    (validateSummary as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error('Validation error');
    });

    const result = (await summaryStep.execute({
      inputData: { html: '<div></div>', prompt: 'test' },
    } as any)) as any;

    expect(result.summary).toBe(JSON.stringify({ title: 'Test' }));
  });

  it('should strip base64 images before building prompt', async () => {
    (stripBase64Images as ReturnType<typeof vi.fn>).mockReturnValue({
      stripped: 'no-base64',
      restore: (s: string) => s,
    });

    (generateWithFallback as ReturnType<typeof vi.fn>).mockResolvedValue({
      result: { text: JSON.stringify({ title: 'T' }) },
    } as any);

    (validateSummary as ReturnType<typeof vi.fn>).mockReturnValue({ title: 'T' });

    await summaryStep.execute({
      inputData: { html: '<div>with-base64</div>', prompt: 'test' },
    } as any);

    expect(stripBase64Images).toHaveBeenCalledWith('<div>with-base64</div>');
    expect(buildSummaryPrompt).toHaveBeenCalledWith('test', 'no-base64', []);
  });
});
