import { HttpErrorResponse } from '@angular/common/http';

type Body = Record<string, unknown>;

function asRecord(value: unknown): Body | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Body)
    : undefined;
}

function asText(value: unknown, separator = '; '): string | undefined {
  if (typeof value === 'string') return value || undefined;
  if (
    Array.isArray(value) &&
    value.length &&
    value.every((item) => typeof item === 'string')
  ) {
    return value.join(separator);
  }
  return undefined;
}

export class ApiError extends Error {
  override readonly name = 'ApiError';
  readonly status: number;
  readonly statusText: string;
  readonly url: string | null;
  readonly code?: string;
  readonly serverMessage?: string;
  readonly details?: Body;
  readonly serverStack?: string;
  readonly requestId?: string;
  readonly timestamp?: string;

  constructor(response: HttpErrorResponse) {
    const body = asRecord(response.error);
    const envelope = asRecord(body?.['error']);
    const meta = asRecord(body?.['meta']);
    const code = asText(envelope?.['code']);
    const details = asRecord(envelope?.['details']);
    const serverMessage =
      asText(envelope?.['message']) ?? asText(body?.['message']);

    super(userMessage(response.status, code, serverMessage, details));

    this.status = response.status;
    this.statusText = response.statusText;
    this.url = response.url;
    this.code = code;
    this.serverMessage = serverMessage;
    this.details = details;
    this.serverStack = asText(envelope?.['stack']);
    this.requestId = asText(meta?.['requestId']);
    this.timestamp = asText(meta?.['timestamp']);
  }
}

function userMessage(
  status: number,
  code: string | undefined,
  serverMessage: string | undefined,
  details: Body | undefined,
): string {
  const designed = status < 500 || (!!code && !code.startsWith('ERR-'));
  if (!designed) return '';
  return (
    asText(details?.['reason']) ??
    asText(details?.['reasons'], ' ') ??
    serverMessage ??
    ''
  );
}

export function toApiError(error: unknown): ApiError | undefined {
  if (error instanceof ApiError) return error;
  if (error instanceof HttpErrorResponse) return new ApiError(error);
  return undefined;
}
