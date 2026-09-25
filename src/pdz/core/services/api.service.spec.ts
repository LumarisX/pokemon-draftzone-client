import { HttpErrorResponse } from '@angular/common/http';
import { apiErrorMessage } from './api.service';

function httpError(error: unknown) {
  return new HttpErrorResponse({ status: 400, error });
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

  it("uses the server's message when there is no reason", () => {
    expect(
      apiErrorMessage(
        httpError({ error: { code: 'MU-006', message: 'Not on the roster' } }),
        'Failed to save.',
      ),
    ).toBe('Not on the roster');
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
});
