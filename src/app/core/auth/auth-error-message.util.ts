import type { ApiError } from '../errors/api-error.model';

const AUTH_ERROR_PATTERNS: ReadonlyArray<{ pattern: RegExp; message: string }> = [
  {
    pattern: /(network|failed to fetch|unable to connect|status\s*0|timeout)/i,
    message: 'Unable to reach the server right now. Please check your connection and try again.',
  },
  {
    pattern: /(invalid credentials|invalid email|invalid password|unauthorized|401)/i,
    message: 'Email or password is incorrect. Please check your credentials and try again.',
  },
  {
    pattern: /(already exists|duplicate|email.*taken|email.*exists)/i,
    message: 'This email is already registered. Please sign in or use another email address.',
  },
  {
    pattern: /(forbidden|access denied|403)/i,
    message: 'You do not have permission to perform this action.',
  },
  {
    pattern: /(otp|verification code).*(invalid|wrong|incorrect|expired)/i,
    message: 'The verification code is invalid or expired. Please request a new code and try again.',
  },
  {
    pattern: /(user not found|email not found|account not found|404)/i,
    message: 'No account was found for this email address.',
  },
  {
    pattern: /(too many requests|rate limit|429)/i,
    message: 'Too many attempts detected. Please wait a moment and try again.',
  },
  {
    pattern: /(server error|internal server error|500|502|503|504)/i,
    message: 'A server error occurred. Please try again shortly.',
  },
];

export const toFriendlyAuthErrorMessage = (error: ApiError | string | null | undefined): string | null => {
  // Extract message from ApiError or use string directly
  const rawMessage = typeof error === 'object' && error !== null ? error.message : error;

  const message = rawMessage?.trim();
  if (!message) {
    return null;
  }

  const matched = AUTH_ERROR_PATTERNS.find((entry) => entry.pattern.test(message));
  if (matched) {
    return matched.message;
  }

  return message;
};
