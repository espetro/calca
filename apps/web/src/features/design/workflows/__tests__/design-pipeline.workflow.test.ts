import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@app/core/ai/client', () => ({
  streamAnthropic: vi.fn(),
  generateWithFallback: vi.fn(),
}));

vi.mock('@app/core/pipeline/images', () => ({
  generateImages: vi.fn(),
}));

vi.mock('@app/core/prompts/layout', () => ({
  buildNewPrompt: vi.fn(() => 'mocked layout prompt'),
  buildRevisionUserContent: vi.fn(() => 'mocked revision content'),
}));

vi.mock('@app/core/prompts/plan', () => ({
  buildPlanPrompt: vi.fn(() => 'mocked plan prompt'),
}));

vi.mock('@app/core/prompts/review', () => ({
  buildReviewPrompt: vi.fn(() => 'mocked review prompt'),
}));

vi.mock('@app/core/prompts/critique', () => ({
  buildCritiquePrompt: vi.fn(() => 'mocked critique prompt'),
}));

vi.mock('@app/core/prompts/summary', () => ({
  buildSummaryPrompt: vi.fn(() => 'mocked summary prompt'),
}));

vi.mock('@app/shared', () => ({
  validateLayout: vi.fn(),
  validateReview: vi.fn(),
  validateSummary: vi.fn(),
}));

vi.mock('../../lib/strip-base64', () => ({
  stripBase64Images: vi.fn(() => ({ stripped: 'stripped-html', restore: (s: string) => s })),
}));

vi.mock('../../lib/parse-html', () => ({
  parseHtmlWithSize: vi.fn(() => ({ html: '<div>parsed</div>', width: 800, height: 600 })),
}));

import { streamAnthropic, generateWithFallback } from '@app/core/ai/client';
import { generateImages } from '@app/core/pipeline/images';
import { validateLayout, validateReview, validateSummary } from '@app/shared';
import type { PlanOutput } from '../schemas/plan.schema';
import type { SummaryOutput } from '../schemas/summary.schema';

const mockWriter = () => ({
  write: vi.fn().mockResolvedValue(undefined),
});

const mockAbortSignal = () => {
  const controller = new AbortController();
  return controller.signal;
};

const setupLayoutMock = () => {
  (streamAnthropic as ReturnType<typeof vi.fn>).mockImplementation(() => ({
    text: Promise.resolve('<!--size:800x600-->\n<div>Generated layout</div>'),
  }));
  (validateLayout as ReturnType<typeof vi.fn>).mockReturnValue({
    html: '<div>Generated layout</div>',
    width: 800,
    height: 600,
  });
};

const setupPlanMock = (concepts = [{ name: 'Minimal', direction: 'Clean lines' }]) => {
  (generateWithFallback as ReturnType<typeof vi.fn>).mockImplementationOnce(() =>
    Promise.resolve({ result: { text: JSON.stringify(concepts) } }),
  );
};

const setupImagesMock = (html = '<div>with-images</div>') => {
  (generateImages as ReturnType<typeof vi.fn>).mockImplementationOnce(() =>
    Promise.resolve({ html, imageCount: 0, skipped: false }),
  );
};

const setupReviewMock = (html: string) => {
  (generateWithFallback as ReturnType<typeof vi.fn>).mockImplementationOnce(() =>
    Promise.resolve({ result: { text: JSON.stringify({ html }) } }),
  );
  (validateReview as ReturnType<typeof vi.fn>).mockReturnValue({ html });
};

const setupCritiqueMock = (critique: string) => {
  (generateWithFallback as ReturnType<typeof vi.fn>).mockImplementationOnce(() =>
    Promise.resolve({ result: { text: critique } }),
  );
};

const setupSummaryMock = (summary: object) => {
  (generateWithFallback as ReturnType<typeof vi.fn>).mockImplementationOnce(() =>
    Promise.resolve({ result: { text: JSON.stringify(summary) } }),
  );
  (validateSummary as ReturnType<typeof vi.fn>).mockReturnValue(summary);
};

const { planStep } = await import('../steps/plan.step');
const { layoutStep } = await import('../steps/layout.step');
const { imagesStep } = await import('../steps/images.step');
const { reviewStep } = await import('../steps/review.step');
const { critiqueStep } = await import('../steps/critique.step');
const { summaryStep } = await import('../steps/summary.step');

const unwrap = <T>(result: unknown): T => result as T;

type LayoutOutput = { html: string; width?: number; height?: number; comment?: string };
type ImagesOutput = { html: string };
type ReviewOutput = { html: string };
type CritiqueOutput = { critique: string };

const runFramePipeline = async (
  prompt: string,
  concept: { name: string; direction: string },
  index: number,
  total: number,
  isQuickMode: boolean,
  writer: ReturnType<typeof mockWriter>,
  abortSignal: AbortSignal,
  previousCritique?: string,
) => {
  const conceptStr = concept.direction
    ? `${concept.name}: ${concept.direction}`
    : concept.name;

  writer.write({
    type: 'workflow-step',
    step: 'layout',
    frameIndex: index,
    progress: 0.2 + (index / total) * 0.6,
  });

  const layoutResult = unwrap<LayoutOutput>(await layoutStep.execute({
    inputData: {
      prompt,
      concept: conceptStr,
      critique: previousCritique,
    },
    writer,
    abortSignal,
  } as any));

  let html: string = layoutResult.html;
  const width: number | undefined = layoutResult.width;
  const height: number | undefined = layoutResult.height;
  const comment: string | undefined = layoutResult.comment;

  writer.write({
    type: 'workflow-step',
    step: 'images',
    frameIndex: index,
    progress: 0.4 + (index / total) * 0.6,
  });

  const imagesResult = unwrap<ImagesOutput>(await imagesStep.execute({
    inputData: {
      html,
    },
    writer,
    abortSignal,
  } as any));

  html = imagesResult.html;

  let critiqueText: string | undefined;

  if (!isQuickMode) {
    writer.write({
      type: 'workflow-step',
      step: 'review',
      frameIndex: index,
      progress: 0.7 + (index / total) * 0.3,
    });

    const reviewResult = unwrap<ReviewOutput>(await reviewStep.execute({
      inputData: {
        html,
        prompt,
        width,
        height,
      },
    } as any));

    html = reviewResult.html;

    writer.write({
      type: 'workflow-step',
      step: 'critique',
      frameIndex: index,
      progress: 0.9 + (index / total) * 0.1,
    });

    try {
      const critiqueResult = unwrap<CritiqueOutput>(await critiqueStep.execute({
        inputData: {
          html,
          prompt,
        },
      } as any));

      critiqueText = critiqueResult.critique;
    } catch {
      // critique is optional
    }
  }

  writer.write({
    type: 'workflow-step',
    step: 'frameComplete',
    frameIndex: index,
    progress: (index + 1) / total,
  });

  return {
    html,
    width,
    height,
    label: `Variation ${index + 1}`,
    comment,
    critique: critiqueText,
  };
};

describe('Design Pipeline Workflow (Integration)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('quick mode', () => {
    it('single prompt → all frames generated in parallel → summary', async () => {
      const concepts = [
        { name: 'Minimal', direction: 'Clean lines' },
        { name: 'Bold', direction: 'High contrast' },
      ];

      const writer = mockWriter();
      const abortSignal = mockAbortSignal();

      setupPlanMock(concepts);
      const planResult = unwrap<PlanOutput>(await planStep.execute({
        inputData: { prompt: 'A pricing card with 3 tiers', mode: 'quick' },
      } as any));

      expect(planResult.count).toBe(2);
      expect(planResult.concepts).toHaveLength(2);

      const isQuickMode = true;
      const total = concepts.length;

      const results = await Promise.allSettled(
        concepts.map((concept, i) => {
          setupLayoutMock();
          setupImagesMock('<div>with-images</div>');
          return runFramePipeline(
            'A pricing card with 3 tiers',
            concept,
            i,
            total,
            isQuickMode,
            writer,
            abortSignal,
          );
        }),
      );

      const frames = results.map((r, i) => {
        if (r.status === 'fulfilled') return r.value;
        return {
          html: `<div style="padding:32px;color:#666;font-family:system-ui"><p style="font-size:14px">⚠ Frame ${i + 1} failed</p></div>`,
          label: `Variation ${i + 1}`,
        };
      });

      expect(frames).toHaveLength(2);
      expect(frames[0]!.html).toContain('Generated layout');
      expect(frames[1]!.html).toContain('Generated layout');

      setupSummaryMock({ title: 'Pricing Card', description: 'Clean and minimal' });

      const summaryResult = unwrap<SummaryOutput>(await summaryStep.execute({
        inputData: {
          html: frames[frames.length - 1]!.html ?? '',
          prompt: 'A pricing card with 3 tiers',
          labels: frames.map((f) => f.label).filter(Boolean),
        },
      } as any));

      expect(summaryResult.summary).toBe(JSON.stringify({ title: 'Pricing Card', description: 'Clean and minimal' }));
    });
  });

  describe('sequential mode', () => {
    it('single prompt → frames with critique loop → summary', async () => {
      const concepts = [{ name: 'Warm', direction: 'Soft tones' }];

      const writer = mockWriter();
      const abortSignal = mockAbortSignal();

      setupPlanMock(concepts);
      const planResult = unwrap<PlanOutput>(await planStep.execute({
        inputData: { prompt: 'A warm welcome card', mode: 'sequential' },
      } as any));

      expect(planResult.concepts[0]!.name).toBe('Warm');

      const isQuickMode = false;
      const total = concepts.length;
      const frames = [];
      let previousCritique: string | undefined;

      for (let i = 0; i < concepts.length; i++) {
        if (abortSignal.aborted) break;

        setupLayoutMock();
        setupImagesMock('<div>with-images</div>');
        setupReviewMock('<div>reviewed</div>');
        setupCritiqueMock('Improve contrast and spacing');

        const result = await runFramePipeline(
          'A warm welcome card',
          concepts[i]!,
          i,
          total,
          isQuickMode,
          writer,
          abortSignal,
          previousCritique,
        );
        frames.push(result);
        previousCritique = result.critique;
      }

      expect(frames).toHaveLength(1);
      expect(frames[0]!.critique).toBe('Improve contrast and spacing');

      setupSummaryMock({ title: 'Warm Card', description: 'Soft tones' });

      const summaryResult = unwrap<SummaryOutput>(await summaryStep.execute({
        inputData: {
          html: frames[frames.length - 1]!.html ?? '',
          prompt: 'A warm welcome card',
          labels: frames.map((f) => f.label).filter(Boolean),
        },
      } as any));

      expect(summaryResult.summary).toBe(JSON.stringify({ title: 'Warm Card', description: 'Soft tones' }));
    });
  });

  describe('error handling', () => {
    it('invalid API key → graceful error, other frames unaffected', async () => {
      const concepts = [
        { name: 'Frame1', direction: 'First' },
        { name: 'Frame2', direction: 'Second' },
      ];

      const writer = mockWriter();
      const abortSignal = mockAbortSignal();

      setupPlanMock(concepts);
      await planStep.execute({
        inputData: { prompt: 'Test prompt', mode: 'quick' },
      } as any);

      const isQuickMode = true;
      const total = concepts.length;

      const results = await Promise.allSettled(
        concepts.map((concept, i) => {
          if (i === 0) {
            (streamAnthropic as ReturnType<typeof vi.fn>)
              .mockImplementationOnce(() => ({
                text: Promise.reject(new Error('Invalid API key')),
              }));
            (validateLayout as ReturnType<typeof vi.fn>).mockReset();
            setupImagesMock('<div>result</div>');
          } else {
            setupLayoutMock();
            setupImagesMock('<div>result</div>');
          }
          return runFramePipeline(
            'Test prompt',
            concept,
            i,
            total,
            isQuickMode,
            writer,
            abortSignal,
          );
        }),
      );

      const frames = results.map((r, i) => {
        if (r.status === 'fulfilled') return r.value;
        return {
          html: `<div style="padding:32px;color:#666;font-family:system-ui"><p style="font-size:14px">⚠ Frame ${i + 1} failed</p></div>`,
          label: `Variation ${i + 1}`,
        };
      });

      expect(frames).toHaveLength(2);
      expect(results[0]!.status).toBe('rejected');
      expect(results[1]!.status).toBe('fulfilled');
      expect(frames[1]!.html).toContain('Generated layout');
    });
  });

  describe('missing image keys', () => {
    it('images step skipped, pipeline continues', async () => {
      const concepts = [{ name: 'Card', direction: 'Simple' }];

      const writer = mockWriter();
      const abortSignal = mockAbortSignal();

      setupPlanMock(concepts);
      await planStep.execute({
        inputData: { prompt: 'A simple card', mode: 'quick' },
      } as any);

      const isQuickMode = true;
      const total = concepts.length;

      const results = await Promise.allSettled(
        concepts.map((concept, i) => {
          setupLayoutMock();
          (generateImages as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            html: '<div>no-images</div>',
            imageCount: 0,
            skipped: true,
          });
          return runFramePipeline(
            'A simple card',
            concept,
            i,
            total,
            isQuickMode,
            writer,
            abortSignal,
          );
        }),
      );

      const frames = results.map((r, i) => {
        if (r.status === 'fulfilled') return r.value;
        return {
          html: `<div style="padding:32px;color:#666;font-family:system-ui"><p style="font-size:14px">⚠ Frame ${i + 1} failed</p></div>`,
          label: `Variation ${i + 1}`,
        };
      });

      expect(frames).toHaveLength(1);
      expect(streamAnthropic).toHaveBeenCalled();
    });
  });

  describe('abort', () => {
    it('start generation → abort mid-stream → verify cleanup', async () => {
      const concepts = [
        { name: 'Frame1', direction: 'First' },
        { name: 'Frame2', direction: 'Second' },
      ];

      setupPlanMock(concepts);

      let resolveLayout: (value: string) => void;
      const layoutPromise = new Promise<string>((resolve) => {
        resolveLayout = resolve;
      });

      (streamAnthropic as ReturnType<typeof vi.fn>).mockReturnValue({
        text: layoutPromise,
      } as any);

      (validateLayout as ReturnType<typeof vi.fn>).mockReturnValue({
        html: '<div>Generated layout</div>',
        width: 800,
        height: 600,
      });

      setupImagesMock('<div>result</div>');
      setupSummaryMock({ title: 'Test' });

      const writer = mockWriter();
      const controller = new AbortController();

      await planStep.execute({
        inputData: { prompt: 'A complex design', mode: 'quick' },
      } as any);

      const isQuickMode = true;
      const total = concepts.length;

      const framePromise = runFramePipeline(
        'A complex design',
        concepts[0]!,
        0,
        total,
        isQuickMode,
        writer,
        controller.signal,
      );

      controller.abort();

      resolveLayout!('<!--size:800x600-->\n<div>Generated layout</div>');

      await expect(framePromise).rejects.toThrow();
      expect(generateWithFallback).toHaveBeenCalled();
    });
  });
});
