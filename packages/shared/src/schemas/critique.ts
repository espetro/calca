import { z } from "zod";

export const CritiqueSchema = z.string().transform((raw) => raw.trim());

export const CritiqueParsedSchema = z.string().min(1);

export const validateCritique = (raw: string) =>
  CritiqueParsedSchema.parse(CritiqueSchema.parse(raw));

export type CritiqueOutput = string;
