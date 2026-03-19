import { NextResponse } from 'next/server';

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'AUTH_REQUIRED'
  | 'ACCESS_DENIED'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'CONFLICT'
  | 'INTERNAL_ERROR';

const REDACTED = '[REDACTED]';
const MASKED = '[MASKED]';

const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /cookie/i,
  /authorization/i,
  /api[-_]?key/i,
];

const MASKED_KEY_PATTERNS = [
  /email/i,
  /phone/i,
];

function maskValue(value: unknown): unknown {
  if (typeof value !== 'string') {
    return MASKED;
  }

  if (value.length <= 4) {
    return MASKED;
  }

  return `${value.slice(0, 2)}***${value.slice(-2)}`;
}

export function redactSensitive(input: unknown): unknown {
  if (input === null || input === undefined) {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map((item) => redactSensitive(item));
  }

  if (typeof input !== 'object') {
    return input;
  }

  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key))) {
      output[key] = REDACTED;
      continue;
    }

    if (MASKED_KEY_PATTERNS.some((pattern) => pattern.test(key))) {
      output[key] = maskValue(value);
      continue;
    }

    output[key] = redactSensitive(value);
  }

  return output;
}

export function logApiError(
  context: string,
  error: unknown,
  metadata?: Record<string, unknown>,
) {
  const sanitizedMeta = metadata ? redactSensitive(metadata) : undefined;

  if (error instanceof Error) {
    console.error(context, {
      name: error.name,
      message: error.message,
      metadata: sanitizedMeta,
    });
    return;
  }

  console.error(context, {
    error: redactSensitive(error),
    metadata: sanitizedMeta,
  });
}

export function errorResponse(
  status: number,
  message: string,
  code: ApiErrorCode,
  details?: unknown,
) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    },
    { status },
  );
}
