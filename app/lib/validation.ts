import { containsProfanity, getProfanityWarning } from "./contentFilter";

interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate user-generated text content.
 *
 * Checks:
 * 1. Non-empty after trimming
 * 2. No profanity (client-side filter; backend should also enforce)
 */
export function validateTextContent(text: string): ValidationResult {
  if (!text.trim()) return { valid: false, error: "Content cannot be empty" };
  if (containsProfanity(text))
    return { valid: false, error: getProfanityWarning() };
  return { valid: true };
}
