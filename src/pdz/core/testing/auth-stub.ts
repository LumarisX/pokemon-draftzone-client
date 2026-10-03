import { Provider } from '@angular/core';
import { AuthService } from '@pdz/core/services/auth0.service';
import { of } from 'rxjs';

export function provideAuthStub(): Provider {
  return {
    provide: AuthService,
    useValue: {
      isAuthenticated$: of(false),
      user$: of(null),
      login: () => undefined,
      logout: () => undefined,
    },
  };
}
