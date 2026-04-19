import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the core functions before importing the step
vi.mock('@app/core/ai/client', () => ({
  generateWithFallback: vi.fn(),
}));

vi.mock('@app/core/prompts/plan', () => ({
  buildPlanPrompt: vi.fn(() => 'mocked plan prompt'),
}));

import { generateWithFallback } from '@app/core/ai/client';
import { buildPlanPrompt } from '@app/core/prompts/plan';

// Import step after mocks are set up
const { planStep } = await import('../plan.step');

describe('planStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return concepts on successful generation with JSON array response', async () => {
    const mockConcepts = [
      { name: 'Minimal', direction: 'Clean lines, whitespace' },
      { name: 'Bold', direction: 'High contrast, striking typography' },
    ];

    (generateWithFallback as ReturnType<typeof vi.fn>).mockResolvedValue({
      result: { text: JSON.stringify(mockConcepts) },
    } as any);

    const result = (await planStep.execute({
      inputData: { prompt: 'A pricing card', model: 'test-model', apiKey: 'test-key' },
    } as any)) as any;

    expect(result.count).toBe(2);
    expect(result.concepts).toHaveLength(2);
    expect(result.concepts[0]!.name).toBe('Minimal');
    expect(result.concepts[1]!.direction).toBe('High contrast, striking typography');
    expect(buildPlanPrompt).toHaveBeenCalledWith('A pricing card');
  });

  it('should parse concepts from object with concepts array', async () => {
    (generateWithFallback as ReturnType<typeof vi.fn>).mockResolvedValue({
      result: {
        text: JSON.stringify({
          concepts: [{ name: 'Warm', direction: 'Soft tones' }],
        }),
      },
    } as any);

    const result = (await planStep.execute({
      inputData: { prompt: 'A landing page' },
    } as any)) as any;

    expect(result.count).toBe(1);
    expect(result.concepts[0]!.name).toBe('Warm');
  });

  it('should fallback to VARIATION_STYLES when generation fails', async () => {
    (generateWithFallback as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('API Error'));

    const result = (await planStep.execute({
      inputData: { prompt: 'A pricing card', model: 'test', apiKey: 'key' },
    } as any)) as any;

    expect(result.count).toBe(3);
    expect(result.concepts).toHaveLength(3);
    expect(result.concepts[0]!.name).toBe('Minimal');
    expect(result.concepts[1]!.name).toBe('Bold');
    expect(result.concepts[2]!.name).toBe('Organic');
  });

  it('should use default model when none provided', async () => {
    (generateWithFallback as ReturnType<typeof vi.fn>).mockResolvedValue({
      result: { text: JSON.stringify([{ name: 'Test', direction: 'test' }]) },
    } as any);

    await planStep.execute({
      inputData: { prompt: 'A card' },
    } as any);

    expect(generateWithFallback).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'claude-opus-4-6' }),
    );
  });

  it('should extract concepts from text lines when JSON parse fails', async () => {
    (generateWithFallback as ReturnType<typeof vi.fn>).mockResolvedValue({
      result: { text: 'Concept A: Bold design\nConcept B: Minimal approach\nExtra line' },
    } as any);

    const result = (await planStep.execute({
      inputData: { prompt: 'A dashboard' },
    } as any)) as any;

    expect(result.count).toBe(3);
    expect(result.concepts[0]!.name).toBe('Concept A');
  });
});
