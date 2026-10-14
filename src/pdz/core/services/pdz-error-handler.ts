import { ErrorHandler, Injectable, Injector, inject } from '@angular/core';
import { ErrorService } from '@pdz/layout/error/error.service';
import { toApiError } from './api-error';

function unwrapRejection(error: unknown): unknown {
  const rejection = (error as { rejection?: unknown } | null)?.rejection;
  return rejection ?? error;
}

@Injectable()
export class PdzErrorHandler extends ErrorHandler {
  private injector = inject(Injector);

  override handleError(error: unknown): void {
    const apiError = toApiError(unwrapRejection(error));
    if (apiError) {
      this.injector.get(ErrorService).reportError(apiError);
    }
    super.handleError(error);
  }
}
