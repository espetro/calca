import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@app/core/pipeline/images', () => ({
  generateImages: vi.fn(),
}));

import { generateImages } from '@app/core/pipeline/images';

const { imagesStep } = await import('../images.step');

const mockWriter = () => ({
  write: vi.fn().mockResolvedValue(undefined),
});

const mockAbortSignal = () => new AbortController().signal;

describe('imagesStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return HTML unchanged when no API keys provided', async () => {
    const html = '<div data-placeholder="test" data-ph-w="100" data-ph-h="100"></div>';
    const writer = mockWriter();

    const result = (await imagesStep.execute({
      inputData: { html },
      writer: writer as any,
      abortSignal: mockAbortSignal(),
    } as any)) as any;

    expect(result.html).toBe(html);
    expect(generateImages).not.toHaveBeenCalled();
    expect(writer.write).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'progress', stage: 'images' }),
    );
  });

  it('should return HTML with images on successful generation', async () => {
    const inputHtml = '<div data-placeholder="sunset" data-ph-w="100" data-ph-h="100"></div>';
    const outputHtml = '<div><img src="https://example.com/sunset.jpg" /></div>';

    (generateImages as ReturnType<typeof vi.fn>).mockResolvedValue({
      html: outputHtml,
      imageCount: 1,
      skipped: false,
    });

    const writer = mockWriter();
    const result = (await imagesStep.execute({
      inputData: { html: inputHtml, unsplashKey: 'test-key' },
      writer: writer as any,
      abortSignal: mockAbortSignal(),
    } as any)) as any;

    expect(result.html).toBe(outputHtml);
    expect(generateImages).toHaveBeenCalledWith(
      expect.objectContaining({ html: inputHtml, unsplashKey: 'test-key' }),
    );
  });

  it('should return HTML unchanged when generation fails', async () => {
    const html = '<div data-placeholder="test" data-ph-w="100" data-ph-h="100"></div>';

    (generateImages as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

    const writer = mockWriter();
    const result = (await imagesStep.execute({
      inputData: { html, geminiKey: 'test-key' },
      writer: writer as any,
      abortSignal: mockAbortSignal(),
    } as any)) as any;

    expect(result.html).toBe(html);
    expect(writer.write).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('failed') }),
    );
  });

  it('should emit progress events during generation', async () => {
    (generateImages as ReturnType<typeof vi.fn>).mockResolvedValue({
      html: '<div>result</div>',
      imageCount: 3,
      skipped: false,
    });

    const writer = mockWriter();
    await imagesStep.execute({
      inputData: { html: '<div></div>', unsplashKey: 'key' },
      writer: writer as any,
      abortSignal: mockAbortSignal(),
    } as any);

    expect(writer.write).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'progress', stage: 'images', current: 3, total: 3 }),
    );
  });
});
