import { HttpErrorResponse } from '@angular/common/http';
import { ApiError } from './api-error';
import { apiErrorMessage } from './api.service';

function httpError(error: unknown, status = 400) {
  return new HttpErrorResponse({ status, error });
}

describe('apiErrorMessage', () => {
  it("prefers the server's specific reason over its generic message", () => {
    expect(
      apiErrorMessage(
        httpError({
          error: {
            code: 'TRN-003',
            message: 'Invalid tournament settings',
            details: { reason: 'A draw cannot be worth more than a win.' },
          },
        }),
        'Failed to save.',
      ),
    ).toBe('A draw cannot be worth more than a win.');
  });

  it('joins a list of reasons', () => {
    expect(
      apiErrorMessage(
        httpError({
          error: {
            code: 'STG-002',
            message: 'Invalid bracket',
            details: { reasons: ['Round 1 is empty.', 'Seed 3 is missing.'] },
          },
        }),
        'Failed to save.',
      ),
    ).toBe('Round 1 is empty. Seed 3 is missing.');
  });

  it("uses the server's message when there is no reason", () => {
    expect(
      apiErrorMessage(
        httpError({ error: { code: 'MU-006', message: 'Not on the roster' } }),
        'Failed to save.',
      ),
    ).toBe('Not on the roster');
  });

  it('joins validation messages', () => {
    expect(
      apiErrorMessage(
        httpError({
          error: { code: 'ERR-400', message: ['name is required', 'bad date'] },
        }),
        'Failed to save.',
      ),
    ).toBe('name is required; bad date');
  });

  it('ignores a reason that is not text', () => {
    expect(
      apiErrorMessage(
        httpError({
          error: { message: 'Bad request', details: { reason: { nested: 1 } } },
        }),
        'Failed to save.',
      ),
    ).toBe('Bad request');
  });

  it('falls back when the body carries nothing usable', () => {
    expect(apiErrorMessage(httpError(null), 'Failed to save.')).toBe(
      'Failed to save.',
    );
  });

  it('falls back on a generic server failure', () => {
    expect(
      apiErrorMessage(
        httpError({ statusCode: 500, message: 'Internal server error' }, 500),
        'Failed to save.',
      ),
    ).toBe('Failed to save.');
    expect(
      apiErrorMessage(
        httpError({ error: { code: 'ERR-502', message: 'Bad Gateway' } }, 502),
        'Failed to save.',
      ),
    ).toBe('Failed to save.');
  });

  it('keeps a server failure the server described on purpose', () => {
    expect(
      apiErrorMessage(
        httpError(
          { error: { code: 'RPL-002', message: 'Failed to parse replay' } },
          500,
        ),
        'Could not read that replay.',
      ),
    ).toBe('Failed to parse replay');
  });

  it('falls back on a network failure', () => {
    expect(
      apiErrorMessage(httpError(new ProgressEvent('error'), 0), 'Offline.'),
    ).toBe('Offline.');
  });

  it('reads an ApiError the same way', () => {
    const error = new ApiError(
      httpError({ error: { code: 'TRN-005', message: 'Completed' } }, 409),
    );
    expect(apiErrorMessage(error, 'Failed.')).toBe('Completed');
    expect(error.message).toBe('Completed');
    expect(error.code).toBe('TRN-005');
  });

  it('falls back for errors that did not come from the API', () => {
    expect(apiErrorMessage(new TypeError('x is undefined'), 'Failed.')).toBe(
      'Failed.',
    );
  });
});
