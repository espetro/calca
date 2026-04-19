import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@app/core/ai/client', () => ({
  streamAnthropic: vi.fn(),
}));

vi.mock('@app/core/prompts/layout', () => ({
  buildNewPrompt: vi.fn(() => 'mocked new prompt'),
  buildRevisionUserContent: vi.fn(() => 'mocked revision content'),
}));

vi.mock('@app/shared', () => ({
  validateLayout: vi.fn(),
}));

vi.mock('../../../lib/strip-base64', () => ({
  stripBase64Images: vi.fn(() => ({ stripped: 'stripped-html', restore: (s: string) => s })),
}));

vi.mock('../../../lib/parse-html', () => ({
  parseHtmlWithSize: vi.fn(() => ({ html: '<div>parsed</div>', width: 800, height: 600 })),
}));

import { streamAnthropic } from '@app/core/ai/client';
import { validateLayout } from '@app/shared';
import { parseHtmlWithSize } from '../../../lib/parse-html';

const { layoutStep } = await import('../layout.step');

const mockWriter = () => ({
  write: vi.fn().mockResolvedValue(undefined),
});

const mockAbortSignal = () => {
  const controller = new AbortController();
  return controller.signal;
};

describe('layoutStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return HTML with size hints on successful stream', async () => {
    const mockText = '<!--size:800x600-->\n<div>Generated layout</div>';

    (streamAnthropic as ReturnType<typeof vi.fn>).mockReturnValue({
      text: Promise.resolve(mockText),
    } as any);

    (validateLayout as ReturnType<typeof vi.fn>).mockReturnValue({
      html: '<div>Generated layout</div>',
      width: 800,
      height: 600,
    });

    const writer = mockWriter();
    const result = (await layoutStep.execute({
      inputData: { prompt: 'A pricing card', apiKey: 'key' },
      writer: writer as any,
      abortSignal: mockAbortSignal(),
    } as any)) as any;

    expect(result.html).toBe('<div>Generated layout</div>');
    expect(result.width).toBe(800);
    expect(result.height).toBe(600);
  });

  it('should set up heartbeat interval during streaming', async () => {
    (streamAnthropic as ReturnType<typeof vi.fn>).mockReturnValue({
      text: Promise.resolve('<!--size:100x100-->\n<div>result</div>'),
    } as any);

    (validateLayout as ReturnType<typeof vi.fn>).mockReturnValue({
      html: '<div>result</div>',
      width: 100,
      height: 100,
    });

    const writer = mockWriter();
    const setIntervalSpy = vi.spyOn(global, 'setInterval');
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

    await layoutStep.execute({
      inputData: { prompt: 'test' },
      writer: writer as any,
      abortSignal: mockAbortSignal(),
    } as any);

    expect(setIntervalSpy).toHaveBeenCalledWith(
      expect.any(Function),
      5000,
    );
    expect(clearIntervalSpy).toHaveBeenCalled();

    setIntervalSpy.mockRestore();
    clearIntervalSpy.mockRestore();
  });

  it('should reject when abort signal is already aborted', async () => {
    (streamAnthropic as ReturnType<typeof vi.fn>).mockReturnValue({
      text: new Promise(() => {}),
    } as any);

    const controller = new AbortController();
    controller.abort();

    const writer = mockWriter();

    await expect(
      layoutStep.execute({
        inputData: { prompt: 'test' },
        writer: writer as any,
        abortSignal: controller.signal,
      } as any),
    ).rejects.toThrow();
  });

  it('should fall back to parseHtmlWithSize when validateLayout throws', async () => {
    (streamAnthropic as ReturnType<typeof vi.fn>).mockReturnValue({
      text: Promise.resolve('<div>raw html</div>'),
    } as any);

    (validateLayout as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error('Validation failed');
    });

    (parseHtmlWithSize as ReturnType<typeof vi.fn>).mockReturnValue({
      html: '<div>parsed</div>',
      width: 400,
      height: 300,
    });

    const writer = mockWriter();
    const result = (await layoutStep.execute({
      inputData: { prompt: 'A card' },
      writer: writer as any,
      abortSignal: mockAbortSignal(),
    } as any)) as any;

    expect(parseHtmlWithSize).toHaveBeenCalled();
    expect(result.html).toBe('<div>parsed</div>');
  });
});
